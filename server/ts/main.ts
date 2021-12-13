/// <reference no-default-lib="true" />
/// <reference path="server/index.ts" />

let idb = new IndexedDB<{
  vocabulary: Entry;
  lessons: {
    name: string;
    number: number;
  }
}, "by_id" | "by_lesson" | "by_german" | "by_hebrew" | "by_points" | "by_tries" | "by_fails" | "is_well_known" | "is_known" | "is_unknown">("voc", 2, [{
  name: "vocabulary",
  keyPath: "key_id",
  autoIncrement: true,
  indices: [
    { name: "by_id", keyPath: "id", multiEntry: false, unique: false },
    { name: "by_lesson", keyPath: "lesson", multiEntry: false, unique: false },
    { name: "by_german", keyPath: "german", multiEntry: true, unique: false },
    { name: "by_hebrew", keyPath: "hebrew", multiEntry: false, unique: false },
    { name: "by_points", keyPath: "points", multiEntry: false, unique: false },
    { name: "by_tries", keyPath: "tries", multiEntry: false, unique: false },
    { name: "by_fails", keyPath: "fails", multiEntry: false, unique: false },
    { name: "is_well_known", keyPath: "is_well_known", multiEntry: false, unique: false },
    { name: "is_known", keyPath: "is_known", multiEntry: false, unique: false },
    { name: "is_unknown", keyPath: "is_unknown", multiEntry: false, unique: false }
  ]
}, {
  name: "lessons",
  keyPath: "number",
  autoIncrement: false,
  indices: []
}]);

async function update_lessons(): Promise<number> {
  let server_lessons = await server.apiFetch("get_lessons");
  let local_lessons = (await idb.getAll("lessons")).map(a => a.number);
  let new_lessons = server_lessons.filter(a => local_lessons.indexOf(a) < 0);
  if (new_lessons.length > 0) {
    await Promise.all(new_lessons.map(add_lesson));
    return new_lessons.length;
  }
  return 0;
}

async function add_lesson(lesson: string | number): Promise<boolean> {
  let lesson_text = await server.apiFetch("get_lesson", [lesson]);
  if (lesson_text === false) {
    return false;
  }
  await Promise.all(lesson_text.split("\n").map((line, id) => {
    let entry = line.split("\t");
    return idb.add("vocabulary", <Entry>{
      id: entry[0] + "-" + (id + 1),
      lesson: Number(entry[0]),
      german: (entry[1] || "").normalize("NFD").split("; "),
      transcription: (entry[2] || "").normalize("NFD"),
      hebrew: (entry[3] || "").normalize("NFD"),
      hints_german: (entry[4] || "").normalize("NFD").split("; "),
      hints_hebrew: (entry[4] || "").normalize("NFD").split("; ").map(hint => {
        switch (hint) {
          case "m.Sg.":
            return "ז'";
          case "f.Sg.":
            return "נ'";
          case "m.Pl.":
            return "ז\"ר";
          case "f.Pl.":
            return "נ\"ר";
          case "ugs.":
            return "ס'";
          default:
            return hint;
        }
      }),
      tries: 0
    });
  }));
  await idb.add("lessons", {
    name: "Lesson " + lesson,
    number: Number(lesson)
  });
  return true;
}

interface Entry {
  key_id: number;
  id: string;
  lesson: number;
  german: string[];
  transcription: string;
  hebrew: string;
  hints_german: string[];
  hints_hebrew: string[];
  points?: number;
  tries: number;
  fails?: number;
  is_well_known?: boolean;
  is_known?: boolean;
  is_unknown?: boolean;
}

interface APIFunctions {
  get_lessons: {
    args: [];
    return: number[];
  }
  get_lesson: {
    args: [string | number];
    return: string | false;
  }
}

server.addEventListener("ping", event => {
  event.data.await(update_lessons());
});

server.addEventListener("beforestart", event => {
  event.data.await(idb.ready);
});
