/// <reference no-default-lib="true" />
/// <reference path="../main.ts" />

server.registerRoute(Server.APP_SCOPE + "/train", {
  files: {
    "mpc.css": Server.APP_SCOPE + "/client/css/mpc.css",
    "main.css": Server.APP_SCOPE + "/client/css/main.css",
    "print.css": Server.APP_SCOPE + "/client/css/print.css",
    "main.js": Server.APP_SCOPE + "/client/js/main.js",
    "layout.html": Server.APP_SCOPE + "/client/html/layout.html",
    "train.html": Server.APP_SCOPE + "/client/html/main/train.html",
    "train.css": Server.APP_SCOPE + "/client/css/page/train.css",
  },
  async response() {
    this.add_style("mpc-css", this.files["mpc.css"].url);
    this.add_style("main-css", this.files["main.css"].url);
    this.add_style("print-css", this.files["print.css"].url, "print");
    this.add_script("main-js", this.files["main.js"].url);
    this.add_style("train-css", this.files["train.css"].url);

    if (
      "id" in this.GET &&
      "hints_used" in this.GET &&
      "known" in this.GET
    ) {
      let entry = (await idb.get("vocabulary", { id: this.GET.id }))[0];
      if (entry) {
        entry.tries += 1;
        if (this.GET.known == -1) {
          entry.fails = (entry.fails || 0) + 1;
        }
        entry.points = (entry.points || 0) + Number(this.GET.known) - Number(this.GET.hints_used) * 0.5;
        delete entry.is_well_known;
        delete entry.is_known;
        delete entry.is_unknown;

        if (entry.points > 20) {
          entry.is_well_known = true;
        } else if (entry.points > 0) {
          entry.is_known = true;
        } else if (entry.points < 0) {
          entry.is_unknown = true;
        }
        idb.put("vocabulary", entry);
      }
    }

    let unknown_items_count = await idb.index("vocabulary", "is_unknown").count();
    let well_known_items_count = await idb.index("vocabulary", "is_well_known").count();
    let known_items_count = await idb.index("vocabulary", "is_known").count();
    let tried_items_count = await idb.index("vocabulary", "by_tries").count();
    let new_items_count = await idb.count("vocabulary") - tried_items_count;

    let range: ("unknown" | "known" | "well-known" | "new" | "random")[] = [];
    if (unknown_items_count > 20) {
      range.push(...Array(45).fill("unknown"));
    } else if (unknown_items_count > 5) {
      range.push(...Array(25).fill("unknown"));
    } else if (unknown_items_count > 0) {
      range.push(...Array(15).fill("unknown"));
    }

    if (known_items_count > 20) {
      range.push(...Array(45).fill("known"));
    } else if (known_items_count > 5) {
      range.push(...Array(25).fill("known"));
    } else if (known_items_count > 0) {
      range.push(...Array(15).fill("known"));
    }

    let range_length = range.length;

    if (range_length < 75 && well_known_items_count >= 25) {
      range.push(...Array(25).fill("well-known"));
    } else if (range_length < 100 && well_known_items_count > 0) {
      range.push(...Array(100 - range_length).fill("well-known"));
    }

    range_length = range.length;

    if (range_length < 100) {
      range.push(...Array(100 - range_length).fill(new_items_count > 0 ? "new" : "random"));
    }

    let item: VocCardPageData = null;

    let index = rndInt(0, range.length - 1);
    let entry: Entry = null;
    let array: Entry[] = null;

    switch (range[index]) {
      case "known":
        array = await idb.index("vocabulary", "is_known").getAll();
        entry = array[rndInt(0, array.length - 1)];
        break;
      case "new":
        array = await idb.get("vocabulary", { tries: 0 });
        entry = array[0];
        break;
      case "random":
        array = await idb.getAll("vocabulary");
        entry = array[rndInt(0, array.length - 1)];
        break;
      case "unknown":
        array = await idb.index("vocabulary", "is_unknown").getAll();
        entry = array[rndInt(0, array.length - 1)];
        break;
      case "well-known":
        array = await idb.index("vocabulary", "is_well_known").getAll();
        entry = array[rndInt(0, array.length - 1)];
        break;
    }

    if (entry) {
      item = {
        id: entry.id,
        german: entry.german.join(" / "),
        hebrew: entry.hebrew,
        hint_german: entry.hints_german.join(" / "),
        hint_hebrew: entry.hints_hebrew.join(" / "),
        hint_lesson: entry.lesson.toString(),
        hint_transcription: entry.transcription,
        hint_tries: entry.tries,
        hint_points: entry.points || 0
      };
    } else {
      item = {
        id: "",
        german: "Eintrag nicht gefunden",
        hebrew: "Eintrag nicht gefunden",
        hint_german: "",
        hint_hebrew: "",
        hint_lesson: "",
        hint_transcription: "",
        hint_tries: 0,
        hint_points: 0
      }
    }

    let main = await this.build(item, await this.files["train.html"].text());

    return await this.build({
      page_title: "Vokabel-Trainer",
      main
    }, await this.files["layout.html"].text());
  }
});

/**
 * 
 * @param min inklusive min
 * @param max inclusive max
 * @returns min <= random number <= max
 */
function rndInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

interface VocCardPageData {
  id: string;
  hebrew: string;
  hint_transcription: string;
  hint_lesson: string;
  hint_hebrew: string;
  german: string;
  hint_german: string;
  hint_tries: number;
  hint_points: number;
}
