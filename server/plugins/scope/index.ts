/// <reference path="../../server/index.ts" />

class Scope<GET extends string = string, POST extends string = string, Data extends Record<string, any> = any> {

  /**
   * Convert special characters to HTML entities
   * 
   * @param string The string being converted.
   * @return The converted string.
   */
  static htmlspecialchars(string: string): string {
    return string.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }

  readonly GET = <Record<GET, string>>{};
  readonly POST = <Record<POST, string>>{};
  readonly REQUEST = <Record<GET | POST, string>>{};

  readonly url: URL;
  readonly ready: Promise<this>;
  readonly request: Request;

  #status: number = 200;
  get status() {
    return this.#status;
  }
  set status(value: number) {
    if (value > 100 && value < 600) {
      this.#status = value;
    }
  }

  statusText: string = "OK";
  #headers: Headers = new Headers({
    "Content-Type": "text/html;charset=utf8"
  });
  get headers() {
    return this.#headers;
  }
  set headers(value: HeadersInit | Headers) {
    if (value instanceof Headers) {
      this.#headers = value;
    } else {
      this.#headers = new Headers(value);
    }
  }
  site_title: string = "";
  page_title: string = "";
  data: Data;

  constructor(request: Request, data: Data = <Data>{}) {
    this.request = request;
    this.url = new URL(request.url);
    this.data = data;
    this.ready = (async () => {
      this.url.searchParams.forEach((value, key) => {
        this.GET[key] = value;
        this.REQUEST[key] = value;
      });

      if (this.request.headers.has("content-type") && /application\/x-www-form-urlencoded/i.test(request.headers.get("content-type"))) {
        new URLSearchParams(await this.request.text()).forEach((value, key) => {
          this.POST[key] = value;
          this.REQUEST[key] = value;
        });
      }

      return this;
    })();
  }

  /**
   * Füllt den Template-String mit Daten
   * 
   * @param template Der Template-String
   */
  async build(template: string | MPCacheResponse): Promise<string> {
    if (template instanceof MPCacheResponse) {
      template = await template.text();
    }
    let matches = template.match(/\{\{ (generate_[A-Za-z0-9_]+)\(([A-Za-z0-9_, \-+]*)\) \}\}/g);
    if (matches) {
      for (let value of matches) {
        let match = /\{\{ (generate_[A-Za-z0-9_]+)\(([A-Za-z0-9_, \-+]*)\) \}\}/.exec(value);

        if (typeof this[match[1]] == "function") {
          let pattern = match[0];
          let args: (object | string)[] = match[2].split(",").map(a => a.trim());
          let replacement = await this[match[1]].apply(this, args);
          template = template.replace(pattern, replacement);
        }
      }
    }

    return template;
  }

  async toResponse(template: string | MPCacheResponse): Promise<Response> {
    if (template instanceof MPCacheResponse) {
      template = await template.text();
    }
    return new Response(await this.build(template), this);
  }

  /**
   * Gibt das Menü im HTML-Format aus
   * 
   * @param menu Das Menü
   * @param options Die zu verwendenden Optionen
   * @returns &lt;ul&gt;-Tags mit Einträgen
   */
  build_menu(menu: ScopeMenu, options: BuildScopeMenuOptions = {}): string {
    options = Object.assign(options, {
      menu_class: "menu",
      submenu_class: "submenu",
      entry_class: "menuitem",
      id_prefix: "",
    });

    let html = "<ul class=\"" + Scope.htmlspecialchars(options.menu_class) + "\">";

    for (let id in menu) {
      let item = menu[id];
      html += "<li class=\"" + Scope.htmlspecialchars(options.entry_class);
      if ("submenu" in item && Object.keys(item.submenu).length > 0) {
        html += " has-submenu";
      }
      let url = new URL(new Request(item.href).url);
      if (this.url.origin + this.url.pathname == url.origin + url.pathname) {
        html += " selected";
      }
      html += "\" id=\"" + Scope.htmlspecialchars(options.id_prefix + id) + "_item\"><a href=\"" + Scope.htmlspecialchars(item.href) + "\" id=\"" + Scope.htmlspecialchars(id) + "\">" + Scope.htmlspecialchars(item.label) + "</a>";
      if ("submenu" in item && Object.keys(item.submenu).length > 0) {
        html += this.build_menu(item.submenu, Object.assign({
          id_prefix: Scope.htmlspecialchars("id_prefix" in options ? options.id_prefix + "-" + id + "-" : id + "-"),
          menu_class: options.submenu_class,
        }, options));
      }
      html += "</li>";
    }

    html += "</ul>";
    return html;
  }

  #styles: { [id in string]: { id: id; href: string; media: string; type: string; } } = {};
  /**
   * Fügt ein Stylesheet hinzu oder ändert ein bestehendes
   * 
   * @param data Das zu benutzende Daten-Array
   * @param id ID des Stylesheets
   * @param href URL zum Stylesheet
   * @param media Media Informationen
   * @param type Typ des Stylesheets
   */
  add_style(id: string, href: string | MPCacheResponse, media: string = "all,screen,handheld,print", type: string = "text/css") {
    this.#styles[id] = { id, href: href instanceof MPCacheResponse ? href.url : href, media, type };
  }

  /**
   * Löscht ein zuvor hinzugefügtes Stylesheet
   * 
   * @param data Das zu benutzende Daten-Array
   * @param id ID des Stylesheets
   */
  remove_style(id: string) {
    delete this.#styles[id];
  }

  #scripts: { [id in string]: { id: id; src: string; type: string; position: string; } } = {};
  /**
   * Fügt ein Skript hinzu
   * 
   * @param data Das zu benutzende Daten-Array
   * @param id ID des Skripts
   * @param src URL zum Skript
   * @param type Typ des Skripts
   * @param position Gibt an, an welcher Position das Sktip eingefügt werden soll
   */
  add_script(id: string, src: string | MPCacheResponse, type: string = "text/javascript", position: string = "head") {
    this.#scripts[id] = { id, src: src instanceof MPCacheResponse ? src.url : src, type, position };
  }

  /**
   * Löscht ein zuvor hinzugefügtes Skript
   * 
   * @param id ID des Skripts
   */
  remove_script(id: string) {
    delete this.#scripts[id];
  }

  #menus: ScopeMenu = {};
  /**
   * Fügt einen Menüpunkt hinzu
   * 
   * @param path Pfad zum Menü-Eintrag (geteilt durch "/")
   * @param label Beschriftung des Links
   * @param href URL
   * @private @param submenu `[Privater Parameter]` Das Menü, dem ein Eintrag hinzugefügt werden soll
   */
  add_menu_item(path: string, label: string, href: string): void;
  add_menu_item(path: string, label: string, href: string, submenu: ScopeMenu): void;
  add_menu_item(path: string, label: string, href: string, submenu: ScopeMenu = this.#menus) {
    let patharray = path.split("/");
    let id = patharray.shift();

    if (patharray.length > 0) {
      if (id in submenu === false) {
        submenu[id] = {
          label: id,
          href: `#${id}`,
          submenu: {}
        };
      }
      this.add_menu_item(patharray.join("/"), label, href, submenu[id].submenu);
    } else {
      submenu[id] = { label, href, submenu: {} };
    }
  }

  #toasts: [string, number, string][] = [];
  /**
   * Zeigt eine Nachrichtenblase für eine kurze Dauer an
   * 
   * @param message Nachricht
   * @param delay Anzeigedauer
   * @param color Hintergrundfarbe
   */
  toast(message: string, delay: number = 1000, color: string = "#000") {
    this.#toasts.push([message, delay, color]);
  }

  /**
   * Gibt die Value des Daten-Arrays an einem Index aus
   * 
   * @param index Index des in data
   * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
   */
  generate_value(index: keyof Data, escape?: "html" | "url" | "json" | "plain"): string {
    if (!this.data) {
      return "Failed to load data";
    }
    if ((index in this.data) === false) {
      return `Index '${index}' not found`;
    }
    switch (escape) {
      case "html":
        return Scope.htmlspecialchars(String(this.data[index]));
      case "url":
        return encodeURI(String(this.data[index]));
      case "json":
        return JSON.stringify(this.data[index]);
      case "plain":
      default:
        return String(this.data[index]);
    }
  }

  /**
   * Gibt eine Server-Einstellung aus
   * 
   * @param key Gibt an, welche Einstellung zurückgegeben werden soll 
   * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
   */
  generate_setting(key: keyof ServerSettingsMap, escape?: "html" | "url" | "json" | "plain"): string {
    return this.generate_value.call({ data: { setting: String(Server.server.getSetting(key)) } }, "setting", escape);
  }

  /**
   * Gibt die Version des Servers zurück
   * 
   * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
   */
  generate_version(escape: "html" | "url" | "json" | "plain") {
    return this.generate_value.call({ data: { version: "Version: " + Server.server.version + (Server.server.online ? " (Online)" : " (Offline)") } }, "version", escape);
  }

  /**
   * Gibt die Copyright-Zeichenfolge des Servers zurück
   * 
   * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
   */
  generate_copyright(escape: "html" | "url" | "json" | "plain") {
    return this.generate_value.call({ data: { copyright: Server.server.getSetting("copyright") } }, "copyright", escape);
  }

  /**
   * Gibt die Version des Servers zurück
   * 
   * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
   */
  generate_url(url: string = "", escape: "html" | "url" | "json" | "plain" = "url") {
    return this.generate_value.call({ data: { url: Server.server.scope + url } }, "url", escape);
  }

  /**
   * 
   * @param hidden 
   * @returns 
   */
  generate_offline_switch(hidden: string) {
    return `<input type="checkbox" name="switch_offline_mode" class="switch_offline_mode" onclick="navigator.serviceWorker.controller.postMessage({type:&quot;set-setting&quot;,property:&quot;offline-mode&quot;,value:this.checked})" ${Server.server.getSetting("offline-mode") ? ' checked=""' : ""}${hidden == "true" ? "" : ' hidden="'}/>`;
  }

  /**
   * Gibt den Inhalt des &lt;title&gt;-Tags aus
   * 
   * @param mode full | page | site
   * @return Inhalt des &lt;title&gt;-Tags
   */
  generate_title(mode: "page" | "site" | "full"): string {
    switch (mode) {
      case "page":
        return Scope.htmlspecialchars(this.page_title);
      case "site":
        return Scope.htmlspecialchars(this.site_title);
      case "full":
      default:
        if (this.page_title) {
          return Scope.htmlspecialchars(this.page_title + " | " + this.site_title);
        } else {
          return Scope.htmlspecialchars(this.site_title);
        }
    }
  }

  /**
   * Gibt die Stylesheets als &lt;link&gt;-Tags aus
   * 
   * @return &lt;link&gt;-Tags
   */
  generate_styles(): string {
    let html = "";
    for (let index in this.#styles) {
      let style = this.#styles[index];
      html += "<link id=\"" + Scope.htmlspecialchars(style.id) + "\" rel=\"stylesheet\" href=\"" + Scope.htmlspecialchars(style.href) + "\" media=\"" + Scope.htmlspecialchars(style.media) + "\" type=\"" + Scope.htmlspecialchars(style.type) + "\" />";
    }
    return html;
  }

  /**
   * Gibt das Skript als &lt;script&gt;-Tags aus
   * 
   * @param data Daten-Array der build-Funktion
   * @param position Gibt an, für welche Position die Skripte ausgegeben werden sollen
   * @return &lt;script&gt;-Tags
   */
  generate_scripts(position: string = "head"): string {
    let html = "";
    for (let index in this.#scripts) {
      let script = this.#scripts[index];
      if (script.position == position) {
        html += "<script id=\"" + Scope.htmlspecialchars(script.id) + "\" src=\"" + Scope.htmlspecialchars(script.src) + "\" type=\"" + Scope.htmlspecialchars(script.type) + "\"></script>";
      }
    };
    return html;
  }

  /**
   * Gibt ein Menü aus
   * 
   * @param data Daten-Array der build-Funktion
   * @param index Index des Menüs
   * @return
   */
  generate_menu(index: string): string {
    if (index in this.#menus) {
      return this.build_menu(this.#menus[index].submenu);
    } else {
      return `<p>Men&uuml; "${index}" wurde nicht gefunden!</p>`;
    }
  }

  /**
   * Gibt die Anzahl an Server-Log-Einträgen des angegebenen Types aus
   * 
   * @param _data 
   * @param type 
   * @param hide_empty 
   * @returns 
   */
  async generate_log_badge(type: "log" | "warn" | "error", hide_empty: `${boolean}` = "false") {
    let options = {
      log: false,
      warn: false,
      error: false
    };

    switch (type) {
      case "log":
        options.log = true;
        break;
      case "warn":
        options.warn = true;
        break;
      case "error":
        options.error = true;
        break;
    }

    let entries = await Server.server.getLog(options);
    if (entries.length == 0 && hide_empty == "true") {
      return "";
    }
    return `<span class="${Scope.htmlspecialchars(type)}-badge">${Scope.htmlspecialchars("" + entries.length)}</span>`;
  }

  /**
   * Erstellt Toasts
   */
  generate_toasts() {
    if (this.#toasts && this.#toasts.length > 0) {
      return "<script type=\"text/javascript\">(async ()=>{let toasts=" + JSON.stringify(this.#toasts) + ";let toast;while(toast=toasts.shift()){await createToast(...toast);}})()</script>";
    }
    return "";
  }
}

interface ScopeMenu {
  [id: string]: {
    label: string;
    href: string;
    submenu: ScopeMenu;
  }
}

interface BuildScopeMenuOptions {
  menu_class?: string;
  submenu_class?: string;
  entry_class?: string;
  id_prefix?: string;
}

interface ServerSettingsMap {
  "site-title": string;
  "theme-color": string;
}

/**

  generate_icons(_data: never) {
    let max_size = "";
    let max_width = 0;
    let max_icon = "";
    if (!this.icon) {
      return "";
    }
    return Server.ICON_SIZES.map(size => {
      let [width, height] = size.split("x");
      let icon = this.icon.replace("${p}", "any").replace("${w}", width).replace("${h}", height);

      if (Number(width) > max_width) {
        max_size = size;
        max_width = Number(width);
        max_icon = icon;
      }

      return `<link rel="apple-touch-icon" sizes="${size}" href="${icon}" /><link rel="icon" sizes="${size}" href="${icon}" />`;
    }).join("") + `<link rel="apple-touch-startup-image" sizes="${max_size}" href="${max_icon}" />`;
  }

 */