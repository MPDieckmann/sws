/// <reference no-default-lib="true" />
/// <reference path="index.ts" />

class Server extends EventTarget {
  [Symbol.toStringTag] = "Server";

  static readonly server: Server = new Server();
  #version: string;
  readonly #cacheName = "ServerCache-20211226";
  readonly #scope = registration.scope.replace(/\/$/, "");
  readonly #regex_safe_scope = registration.scope.escape(String.ESCAPE_REGEXP, "\\");
  #online: boolean = navigator.onLine;
  #idb = new IndexedDB<{
    settings: {
      Records: { key: keyof ServerSettingsMap, value: ServerSettingsMap[keyof ServerSettingsMap]; };
      Indices: "";
    }
    routes: {
      Records: Route;
      Indices: "by_priority";
    }
    log: {
      Records: { type: string, message: IndexedDBSupportedDataTypes, stack: IndexedDBSupportedDataTypes, timestamp: number };
      Indices: "by_type";
    }
    assets: {
      Records: { id: string; blob: Blob; };
      Indices: "";
    }
  }>("Server", 1, {
    settings: {
      name: "settings",
      autoIncrement: false,
      keyPath: "key",
      indices: []
    },
    routes: {
      name: "routes",
      autoIncrement: false,
      keyPath: "path",
      indices: [
        { name: "by_priority", keyPath: "priority", multiEntry: false, unique: false }
      ]
    },
    log: {
      name: "log",
      autoIncrement: true,
      keyPath: "id",
      indices: [
        { name: "by_type", keyPath: "type", multiEntry: false, unique: false }
      ]
    },
    assets: {
      name: "assets",
      keyPath: "id",
      autoIncrement: false,
      indices: []
    }
  });

  get version() {
    return this.#version;
  }
  get scope() {
    return this.#scope;
  }
  get regex_safe_scope() {
    return this.#regex_safe_scope;
  }
  get online() {
    return this.#online;
  }

  readonly ready: Promise<this>;
  #start: Promise<null> & { resolve(value: null): void; };
  constructor() {
    super();

    if (Server.server) {
      return Server.server;
    }

    this.#settingsListenerMap.set("offline-mode", (old_value, new_value) => {
      if (old_value == new_value) {
        return;
      }
      if (new_value) {
        if (this.#online) {
          this.#online = false;
          this.dispatchEvent(new ServerEvent("offline", { cancelable: false, group: "network", data: null }));
        }
      } else {
        if (navigator.onLine != this.#online) {
          this.#online = navigator.onLine;
          this.dispatchEvent(new ServerEvent(this.#online ? "online" : "offline", { cancelable: false, group: "network", data: null }));
        }
      }
    });

    navigator.connection.addEventListener("change", () => {
      if (
        !this.getSetting("offline-mode") &&
        navigator.onLine != this.#online
      ) {
        this.#online = navigator.onLine;
        this.dispatchEvent(new ServerEvent(this.#online ? "online" : "offline", { cancelable: false, group: "network", data: null }));
      }
    });

    addEventListener("install", event => event.waitUntil(this.install()));
    addEventListener("message", event => event.waitUntil(this.message(event.data, event.source)));
    addEventListener("activate", event => event.waitUntil(this.activate()));
    addEventListener("fetch", event => event.respondWith(this.fetch(event.request)));

    let _resolve: (value: null) => void;
    this.#start = <Promise<null> & { resolve(value: null): void; }>new Promise(resolve => _resolve = resolve);
    this.#start.resolve = _resolve;

    this.ready = (async () => {
      await Promise.all((await this.#idb.get("settings")).map(async record => {
        this.#settings.set(record.key, record.value);
        if (this.#settingsListenerMap.has(record.key)) {
          await this.#settingsListenerMap.get(record.key)(record.value, record.value);
        }
      }));

      await this.#idb.put("routes", {
        priority: 0,
        type: "string",
        string: this.#scope + "/serviceworker.js",
        ignoreCase: true,
        storage: "cache",
        key: this.#scope + "/serviceworker.js"
      });

      let promises: PromiseLike<void>[] = [];
      this.dispatchEvent(new ServerEvent("beforestart", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
      await Promise.all(promises);
      await this.#idb.ready;

      await this.#start;
      this.dispatchEvent(new ServerEvent("afterstart", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
      await Promise.all(promises);
      return this;
    })();
  }

  #loadedScripts: Map<string, any> = new Map([
    [null, null]
  ]);
  async #loadScript(id: string) {
    if (!this.#loadedScripts.has(id)) {
      let assets = await this.#idb.get("assets", { id });
      if (assets.length > 0) {
        let blob = assets[0].blob;
        if (/(text|application)\/javascript/.test(blob.type)) {
          let result = await eval.call(self, await blob.text());
          this.#loadedScripts.set(id, result);
        } else {
          throw new DOMException(`Failed to load script: ${id}\nScripts mime type is not supported.`, `UnsupportedMimeType`);
        }
      } else {
        throw new DOMException(`Failed to load script: ${id}\nScript not found.`, `FileNotFound`);
      }
    }
    return this.#loadedScripts.get(id);
  }

  async install(): Promise<void> {
    // console.log("server called 'install'", { server, routes: this.#routes });
    let promises: PromiseLike<void>[] = [];
    this.dispatchEvent(new ServerEvent("beforeinstall", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
    promises.splice(0, promises.length);
    this.dispatchEvent(new ServerEvent("install", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
    promises.splice(0, promises.length);
    await this.update();
    this.log("Serviceworker erfolgreich installiert");
    skipWaiting();
    this.dispatchEvent(new ServerEvent("afterinstall", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
  }
  async update(): Promise<boolean> {
    // console.log("server called 'update'", { server, routes: this.#routes });
    let promises: PromiseLike<void>[] = [];
    this.dispatchEvent(new ServerEvent("beforeupdate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
    promises.splice(0, promises.length);
    this.dispatchEvent(new ServerEvent("update", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
    promises.splice(0, promises.length);
    try {
      await caches.delete(this.#cacheName);
      this.log("Cache erfolgreich gelöscht");
      let cache = await caches.open(this.#cacheName);
      await Promise.all(
        (
          await this.#idb.get(
            "routes",
            { storage: "cache" }
          )
        ).map(
          (route: CacheRoute) => cache.add(route.key)
        )
      );
      this.warn("Caching files not implemented yet!");
      this.log("Dateien erfolgreich in den Cache geladen");
      this.dispatchEvent(new ServerEvent("afterupdate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
      await Promise.all(promises);
      return true;
    } catch (e) {
      this.error(e.message, e.stack);
      return false;
    }
  }
  async activate(): Promise<void> {
    // console.log("server called 'activate'", { server, routes: this.#routes });
    let promises: PromiseLike<void>[] = [];
    this.dispatchEvent(new ServerEvent("beforeactivate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
    promises.splice(0, promises.length);
    let response = await (await caches.open(this.#cacheName)).match(this.#scope + "/serviceworker.js");
    this.#version = response ? date("Y.md.Hi", response.headers.get("Date")) : "ServiceWorker is broken.";
    await this.ready;
    this.dispatchEvent(new ServerEvent("activate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
    promises.splice(0, promises.length);
    await clients.claim();
    this.log("Serviceworker erfolgreich aktiviert (Version: " + this.#version + ")");
    this.dispatchEvent(new ServerEvent("afteractivate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
  }
  async start() {
    // console.log("server called 'start'", { server, routes: this.#routes });
    let promises: PromiseLike<void>[] = [];
    this.dispatchEvent(new ServerEvent("start", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
    await Promise.all(promises);
    this.#start.resolve(null);
  }
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    // console.log("server called 'fetch'", { server, routes: this.#routes, arguments });
    let response: Response = null;
    let respondWithResponse: Response | PromiseLike<Response> = null;
    this.dispatchEvent(new ServerEvent("beforefetch", { cancelable: false, group: "fetch", data: { url: typeof input == "string" ? input : input.url, request: null, response, respondWith(r) { respondWithResponse = r; } } }));
    await this.ready;
    let request = new Request(input, init);
    this.dispatchEvent(new ServerEvent("fetch", { cancelable: false, group: "fetch", data: { url: typeof input == "string" ? input : input.url, request, response, respondWith(r) { respondWithResponse = r; } } }));
    if (respondWithResponse) {
      response = (await respondWithResponse).clone();
      respondWithResponse = null;
      this.dispatchEvent(new ServerEvent("afterfetch", { cancelable: false, group: "fetch", data: { url: typeof input == "string" ? input : input.url, request, response, respondWith(r) { respondWithResponse = r; } } }));
      respondWithResponse && (response = (await respondWithResponse).clone());
      return response;
    }
    try {
      let routes = await this.#idb.get("routes", async route => (
        (
          route.type == "string" && (
            (route.ignoreCase && route.string.toLowerCase() == request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1").toLowerCase()) ||
            (!route.ignoreCase && route.string == request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1"))
          )
        ) || (
          route.type == "regexp" && route.regexp.test(request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1"))
        )
      ));

      if (routes.length < 0) {
        throw "File not cached: " + request.url;
      }

      response = null;
      let index = routes.length;
      let hasError = false;
      while (
        response === null &&
        index >= 0
      ) {
        index--;
        let route = routes[index];
        if (route.storage == "cache") {
          response = await (await caches.open(this.#cacheName)).match(route.key);
          if (!response) {
            this.error(`File not cached: '${request.url}'`, `Redirected to cache: '${route.key}'.`);
            hasError = true;
            response = null;
          }
        } else if (route.storage == "static") {
          let assets = await this.#idb.get("assets", { id: route.key });
          if (assets.length > 0) {
            response = new Response(assets[0].blob);
          } else {
            this.error(`File not stored: '${request.url}'`, `Redirected to indexedDB: '${route.key}'.`);
            hasError = true;
          }
        } else if (route.storage == "dynamic") {
          await this.#loadScript(route.script).catch((e: Error) => {
            this.error(e.message, e.stack);
            hasError = true;
          });
          if (this.#responseFunctions.has(route.function)) {
            try {
              response = await this.#responseFunctions.get(route.function)(request, route.arguments);
            } catch (error) {
              this.error(error);
              hasError = true;
              response = null;
            };
          } else {
            this.error(`Failed to execute response function for '${request.url}'`, `Redirected to function '${route.function}' in script '${route.script}'.`);
            hasError = true;
          }
        } else {
          this.error(`Unknown storage type: '${(<Route>route).storage}'`);
          hasError = true;
        }
      }
      if (response) {
        if (hasError) {
          let route = routes[index];
          if (route.storage == "dynamic") {
            this.log(`File served with function`, `Redirected to function '${route.function}' in script '${route.script}'.`);
          } else {
            this.log(`File served as ${route.storage}`, `Redirected to ${route.storage == "cache" ? "cache" : "indexedDB"}: '${route.key}'.`);
          }
        }
      } else {
        if (hasError) {
          response = await this.errorResponse("See log for more info", {
            status: 500,
            statusText: "Internal ServiceWorker Error"
          });
        } else {
          response = await this.errorResponse("See log for more info", {
            status: 404,
            statusText: "File not found."
          });
        }
      }
    } catch (error) {
      this.error(error);
      response = await this.errorResponse(error, {
        status: 500,
        statusText: "Internal ServiceWorker Error",
      });
    }
    this.dispatchEvent(new ServerEvent("afterfetch", { cancelable: false, group: "fetch", data: { url: typeof input == "string" ? input : input.url, request, response, respondWith(r) { respondWithResponse = r; } } }));
    respondWithResponse && (response = (await respondWithResponse).clone());
    return response;
  }
  async message<K extends keyof ServerMessageMap>(message: ServerMessage<K>, source: Client | ServiceWorker | MessagePort | null) {
    this.dispatchEvent(new ServerEvent("beforemessage", { cancelable: false, group: "message", data: message }));
    this.dispatchEvent(new ServerEvent("message", { cancelable: false, group: "message", data: message }));
    switch (message.type) {
      case "set-setting":
        this.setSetting(message.property, message.value);
        source.postMessage({
          type: "set-setting",
          property: message.property,
          value: this.getSetting(message.property)
        }, null);
        break;
      default:
        this.log("Failed to prozess message", "type: " + message.type + "\nJSON: " + JSON.stringify(message, null, "  "));
    }
    this.dispatchEvent(new ServerEvent("aftermessage", { cancelable: false, group: "message", data: message }));
  }

  #settings: Map<keyof ServerSettingsMap, ServerSettingsMap[keyof ServerSettingsMap]> = new Map();
  #settingsListenerMap: Map<keyof ServerSettingsMap, (old_value: ServerSettingsMap[keyof ServerSettingsMap], new_value: ServerSettingsMap[keyof ServerSettingsMap]) => void | PromiseLike<void>> = new Map();
  getSetting<Key extends keyof ServerSettingsMap>(key: Key): ServerSettingsMap[Key] {
    return <ServerSettingsMap[Key]>this.#settings.get(key);
  }
  async setSetting<Key extends keyof ServerSettingsMap>(key: Key, value: ServerSettingsMap[Key]): Promise<void> {
    let old_value = this.#settings.get(key);
    this.#settings.set(key, value);
    if (this.#settingsListenerMap.has(key)) {
      await this.#settingsListenerMap.get(key)(old_value, value);
    }
    await this.#idb.put("settings", { key, value });
  }
  async #log(type: string, message: IndexedDBSupportedDataTypes, stack: IndexedDBSupportedDataTypes): Promise<void> {
    await this.#idb.put("log", {
      timestamp: Date.now(),
      type,
      message,
      stack
    });
  }
  async log(message: IndexedDBSupportedDataTypes, stack: IndexedDBSupportedDataTypes = null): Promise<void> {
    console.log(message, stack);
    await this.#log("log", message, stack);
  }
  async warn(message: IndexedDBSupportedDataTypes, stack: IndexedDBSupportedDataTypes = null): Promise<void> {
    console.warn(message, stack);
    await this.#log("warn", message, stack);
  }
  async error(message: IndexedDBSupportedDataTypes, stack: IndexedDBSupportedDataTypes = null): Promise<void> {
    console.error(message, stack);
    await this.#log("error", message, stack);
  }
  async clearLog(): Promise<void> {
    await this.#idb.delete("log");
    this.#log("clear", "Das Protokoll wurde erfolgreich gelöscht", null);
    console.clear();
  }
  async getLog(types: {
    log?: boolean;
    warn?: boolean;
    error?: boolean;
  } = {
      log: true,
      warn: true,
      error: true
    }): Promise<{
      type: string;
      message: IndexedDBSupportedDataTypes;
      stack: IndexedDBSupportedDataTypes;
      timestamp: number;
    }[]> {
    if (types.log && types.warn && types.error) {
      return this.#idb.get("log");
    } else {
      let type_array = [];
      types.log && type_array.push("log");
      types.warn && type_array.push("warn");
      types.error && type_array.push("error");
      return this.#idb.get("log", {
        type: new RegExp("^(" + type_array.join("|") + ")$")
      });
    }
  }

  #responseFunctions: Map<string, (request: Request, args: IndexedDBSupportedDataTypes) => Response | Promise<Response>> = new Map();
  registerResponseFunction<args extends IndexedDBSupportedDataTypes>(id: string, responseFunction: (request: Request, args: args) => Response | Promise<Response>): void {
    this.#responseFunctions.set(id, responseFunction);
  }
  async errorResponse(error: any, responseInit: ResponseInit = {
    headers: {
      "Content-Type": "text/plain"
    },
    status: 500,
    statusText: "Internal Server Error"
  }): Promise<Response> {
    return new Response(error, responseInit);
  }
  async registerRoute(route: Route): Promise<void> {
    await this.#idb.add("routes", route);
  }
  async registerAsset(id: string, blob: Blob): Promise<void> {
    await this.#idb.put("assets", { id, blob });
  }
  async registerRedirection(routeSelector: RouteSelector, destination: string) {
    await this.#idb.add(
      "routes",
      Object.assign(
        <DynamicRoute>{
          priority: 0,
          script: null,
          function: "redirect",
          arguments: [destination]
        },
        routeSelector
      )
    );
  }

  #ononline: (this: this, ev: ServerEventMap["online"]) => any = null;
  get ononline() {
    return this.#ononline;
  }
  set ononline(value: (this: this, ev: ServerEventMap["online"]) => any) {
    if (this.#ononline) {
      this.removeEventListener("online", this.#ononline);
    }
    if (typeof value == "function") {
      this.#ononline = value;
      this.addEventListener("online", value);
    } else {
      this.#ononline = null;
    }
  }
  #onoffline: (this: this, ev: ServerEventMap["offline"]) => any = null;
  get onoffline() {
    return this.#onoffline;
  }
  set onoffline(value: (this: this, ev: ServerEventMap["offline"]) => any) {
    if (this.#onoffline) {
      this.removeEventListener("offline", this.#onoffline);
    }
    if (typeof value == "function") {
      this.#onoffline = value;
      this.addEventListener("offline", value);
    } else {
      this.#onoffline = null;
    }
  }
  #onconnected: (this: this, ev: ServerEventMap["connected"]) => any = null;
  get onconnected() {
    return this.#onconnected;
  }
  set onconnected(value: (this: this, ev: ServerEventMap["connected"]) => any) {
    if (this.#onconnected) {
      this.removeEventListener("connected", this.#onconnected);
    }
    if (typeof value == "function") {
      this.#onconnected = value;
      this.addEventListener("connected", value);
    } else {
      this.#onconnected = null;
    }
  }
  #ondisconnected: (this: this, ev: ServerEventMap["disconnected"]) => any = null;
  get ondisconnected() {
    return this.#ondisconnected;
  }
  set ondisconnected(value: (this: this, ev: ServerEventMap["disconnected"]) => any) {
    if (this.#ondisconnected) {
      this.removeEventListener("disconnected", this.#ondisconnected);
    }
    if (typeof value == "function") {
      this.#ondisconnected = value;
      this.addEventListener("disconnected", value);
    } else {
      this.#ondisconnected = null;
    }
  }

  #onbeforeinstall: (this: this, ev: ServerEventMap["beforeinstall"]) => any = null;
  get onbeforeinstall() {
    return this.#onbeforeinstall;
  }
  set onbeforeinstall(value: (this: this, ev: ServerEventMap["beforeinstall"]) => any) {
    if (this.#onbeforeinstall) {
      this.removeEventListener("beforeinstall", this.#onbeforeinstall);
    }
    if (typeof value == "function") {
      this.#onbeforeinstall = value;
      this.addEventListener("beforeinstall", value);
    } else {
      this.#onbeforeinstall = null;
    }
  }
  #oninstall: (this: this, ev: ServerEventMap["install"]) => any = null;
  get oninstall() {
    return this.#oninstall;
  }
  set oninstall(value: (this: this, ev: ServerEventMap["install"]) => any) {
    if (this.#oninstall) {
      this.removeEventListener("install", this.#oninstall);
    }
    if (typeof value == "function") {
      this.#oninstall = value;
      this.addEventListener("install", value);
    } else {
      this.#oninstall = null;
    }
  }
  #onafterinstall: (this: this, ev: ServerEventMap["afterinstall"]) => any = null;
  get onafterinstall() {
    return this.#onafterinstall;
  }
  set onafterinstall(value: (this: this, ev: ServerEventMap["afterinstall"]) => any) {
    if (this.#onafterinstall) {
      this.removeEventListener("afterinstall", this.#onafterinstall);
    }
    if (typeof value == "function") {
      this.#onafterinstall = value;
      this.addEventListener("afterinstall", value);
    } else {
      this.#onafterinstall = null;
    }
  }

  #onbeforeupdate: (this: this, ev: ServerEventMap["beforeupdate"]) => any = null;
  get onbeforeupdate() {
    return this.#onbeforeupdate;
  }
  set onbeforeupdate(value: (this: this, ev: ServerEventMap["beforeupdate"]) => any) {
    if (this.#onbeforeupdate) {
      this.removeEventListener("beforeupdate", this.#onbeforeupdate);
    }
    if (typeof value == "function") {
      this.#onbeforeupdate = value;
      this.addEventListener("beforeupdate", value);
    } else {
      this.#onbeforeupdate = null;
    }
  }
  #onupdate: (this: this, ev: ServerEventMap["update"]) => any = null;
  get onupdate() {
    return this.#onupdate;
  }
  set onupdate(value: (this: this, ev: ServerEventMap["update"]) => any) {
    if (this.#onupdate) {
      this.removeEventListener("update", this.#onupdate);
    }
    if (typeof value == "function") {
      this.#onupdate = value;
      this.addEventListener("update", value);
    } else {
      this.#onupdate = null;
    }
  }
  #onafterupdate: (this: this, ev: ServerEventMap["afterupdate"]) => any = null;
  get onafterupdate() {
    return this.#onafterupdate;
  }
  set onafterupdate(value: (this: this, ev: ServerEventMap["afterupdate"]) => any) {
    if (this.#onafterupdate) {
      this.removeEventListener("afterupdate", this.#onafterupdate);
    }
    if (typeof value == "function") {
      this.#onafterupdate = value;
      this.addEventListener("afterupdate", value);
    } else {
      this.#onafterupdate = null;
    }
  }

  #onbeforeactivate: (this: this, ev: ServerEventMap["beforeactivate"]) => any = null;
  get onbeforeactivate() {
    return this.#onbeforeactivate;
  }
  set onbeforeactivate(value: (this: this, ev: ServerEventMap["beforeactivate"]) => any) {
    if (this.#onbeforeactivate) {
      this.removeEventListener("beforeactivate", this.#onbeforeactivate);
    }
    if (typeof value == "function") {
      this.#onbeforeactivate = value;
      this.addEventListener("beforeactivate", value);
    } else {
      this.#onbeforeactivate = null;
    }
  }
  #onactivate: (this: this, ev: ServerEventMap["activate"]) => any = null;
  get onactivate() {
    return this.#onactivate;
  }
  set onactivate(value: (this: this, ev: ServerEventMap["activate"]) => any) {
    if (this.#onactivate) {
      this.removeEventListener("activate", this.#onactivate);
    }
    if (typeof value == "function") {
      this.#onactivate = value;
      this.addEventListener("activate", value);
    } else {
      this.#onactivate = null;
    }
  }
  #onafteractivate: (this: this, ev: ServerEventMap["afteractivate"]) => any = null;
  get onafteractivate() {
    return this.#onafteractivate;
  }
  set onafteractivate(value: (this: this, ev: ServerEventMap["afteractivate"]) => any) {
    if (this.#onafteractivate) {
      this.removeEventListener("afteractivate", this.#onafteractivate);
    }
    if (typeof value == "function") {
      this.#onafteractivate = value;
      this.addEventListener("afteractivate", value);
    } else {
      this.#onafteractivate = null;
    }
  }

  #onbeforefetch: (this: this, ev: ServerEventMap["beforefetch"]) => any = null;
  get onbeforefetch() {
    return this.#onbeforefetch;
  }
  set onbeforefetch(value: (this: this, ev: ServerEventMap["beforefetch"]) => any) {
    if (this.#onbeforefetch) {
      this.removeEventListener("beforefetch", this.#onbeforefetch);
    }
    if (typeof value == "function") {
      this.#onbeforefetch = value;
      this.addEventListener("beforefetch", value);
    } else {
      this.#onbeforefetch = null;
    }
  }
  #onfetch: (this: this, ev: ServerEventMap["fetch"]) => any = null;
  get onfetch() {
    return this.#onfetch;
  }
  set onfetch(value: (this: this, ev: ServerEventMap["fetch"]) => any) {
    if (this.#onfetch) {
      this.removeEventListener("fetch", this.#onfetch);
    }
    if (typeof value == "function") {
      this.#onfetch = value;
      this.addEventListener("fetch", value);
    } else {
      this.#onfetch = null;
    }
  }
  #onafterfetch: (this: this, ev: ServerEventMap["afterfetch"]) => any = null;
  get onafterfetch() {
    return this.#onafterfetch;
  }
  set onafterfetch(value: (this: this, ev: ServerEventMap["afterfetch"]) => any) {
    if (this.#onafterfetch) {
      this.removeEventListener("afterfetch", this.#onafterfetch);
    }
    if (typeof value == "function") {
      this.#onafterfetch = value;
      this.addEventListener("afterfetch", value);
    } else {
      this.#onafterfetch = null;
    }
  }

  #onbeforestart: (this: this, ev: ServerEventMap["beforestart"]) => any = null;
  get onbeforestart() {
    return this.#onbeforestart;
  }
  set onbeforestart(value: (this: this, ev: ServerEventMap["beforestart"]) => any) {
    if (this.#onbeforestart) {
      this.removeEventListener("beforestart", this.#onbeforestart);
    }
    if (typeof value == "function") {
      this.#onbeforestart = value;
      this.addEventListener("beforestart", value);
    } else {
      this.#onbeforestart = null;
    }
  }
  #onstart: (this: this, ev: ServerEventMap["start"]) => any = null;
  get onstart() {
    return this.#onstart;
  }
  set onstart(value: (this: this, ev: ServerEventMap["start"]) => any) {
    if (this.#onstart) {
      this.removeEventListener("start", this.#onstart);
    }
    if (typeof value == "function") {
      this.#onstart = value;
      this.addEventListener("start", value);
    } else {
      this.#onstart = null;
    }
  }
  #onafterstart: (this: this, ev: ServerEventMap["afterstart"]) => any = null;
  get onafterstart() {
    return this.#onafterstart;
  }
  set onafterstart(value: (this: this, ev: ServerEventMap["afterstart"]) => any) {
    if (this.#onafterstart) {
      this.removeEventListener("afterstart", this.#onafterstart);
    }
    if (typeof value == "function") {
      this.#onafterstart = value;
      this.addEventListener("afterstart", value);
    } else {
      this.#onafterstart = null;
    }
  }

  #onbeforemessage: (this: this, ev: ServerEventMap["beforemessage"]) => any = null;
  get onbeforemessage() {
    return this.#onbeforemessage;
  }
  set onbeforemessage(value: (this: this, ev: ServerEventMap["beforemessage"]) => any) {
    if (this.#onbeforemessage) {
      this.removeEventListener("beforemessage", this.#onbeforemessage);
    }
    if (typeof value == "function") {
      this.#onbeforemessage = value;
      this.addEventListener("beforemessage", value);
    } else {
      this.#onbeforemessage = null;
    }
  }
  #onmessage: (this: this, ev: ServerEventMap["message"]) => any = null;
  get onmessage() {
    return this.#onmessage;
  }
  set onmessage(value: (this: this, ev: ServerEventMap["message"]) => any) {
    if (this.#onmessage) {
      this.removeEventListener("message", this.#onmessage);
    }
    if (typeof value == "function") {
      this.#onmessage = value;
      this.addEventListener("message", value);
    } else {
      this.#onmessage = null;
    }
  }
  #onaftermessage: (this: this, ev: ServerEventMap["aftermessage"]) => any = null;
  get onaftermessage() {
    return this.#onaftermessage;
  }
  set onaftermessage(value: (this: this, ev: ServerEventMap["aftermessage"]) => any) {
    if (this.#onaftermessage) {
      this.removeEventListener("aftermessage", this.#onaftermessage);
    }
    if (typeof value == "function") {
      this.#onaftermessage = value;
      this.addEventListener("aftermessage", value);
    } else {
      this.#onaftermessage = null;
    }
  }
}

interface Server {
  addEventListener<K extends keyof ServerEventMap>(type: K, listener: (this: this, ev: ServerEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: (this: this, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof ServerEventMap>(type: K, listener: (this: this, ev: ServerEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: (this: this, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  awaitEventListener<SK extends keyof ServerEventMap, EK extends keyof ServerEventMap>(resolve_type: SK, reject_type?: EK): Promise<ServerEventMap[SK]>;
  awaitEventListener<EK extends keyof ServerEventMap>(resolve_type: string, reject_type?: EK): Promise<Event>;
  awaitEventListener<SK extends keyof ServerEventMap>(resolve_type: SK, reject_type?: string): Promise<ServerEventMap[SK]>;
  awaitEventListener(resolve_type: string, reject_type?: string): Promise<Event>;
}

interface ServerSettingsMap {
  version: string;
  copyright: string;
  "offline-mode": boolean;
}

interface ServerEventMap {
  online: ServerEvent<"network">;
  offline: ServerEvent<"network">;
  connected: ServerEvent<"network">;
  disconnected: ServerEvent<"network">;

  beforeinstall: ServerEvent<"start">;
  install: ServerEvent<"start">;
  afterinstall: ServerEvent<"start">;

  beforeupdate: ServerEvent<"start">;
  update: ServerEvent<"start">;
  afterupdate: ServerEvent<"start">;

  beforeactivate: ServerEvent<"start">;
  activate: ServerEvent<"start">;
  afteractivate: ServerEvent<"start">;

  beforefetch: ServerEvent<"fetch">;
  fetch: ServerEvent<"fetch">;
  afterfetch: ServerEvent<"fetch">;

  beforestart: ServerEvent<"start">;
  start: ServerEvent<"start">;
  afterstart: ServerEvent<"start">;

  beforemessage: ServerEvent<"message">;
  message: ServerEvent<"message">;
  aftermessage: ServerEvent<"message">;
}

interface ServerEventGroupMap {
  start: {
    await(promise: PromiseLike<any>): void;
  };
  network: null;
  fetch: {
    url: string;
    request: Request;
    response: Response;
    respondWith(response: Response | PromiseLike<Response>): void;
  };
  message: ServerMessage<keyof ServerMessageMap>;
}

type ServerMessage<K extends keyof ServerMessageMap> = { type: K } & ServerMessageMap[K];

interface ServerMessageMap {
  "set-setting": {
    property: keyof ServerSettingsMap;
    value: ServerSettingsMap[keyof ServerSettingsMap];
  };
}

type RouteSelector = {
  priority: 0;
  type: "string";
  string: string;
  ignoreCase: boolean;
} | {
  type: "regexp";
  regexp: RegExp;
};
type CacheRoute = RouteSelector & {
  storage: "cache";
  key: string;
};
type StaticRoute = RouteSelector & {
  storage: "static";
  key: string;
};
type DynamicRoute = RouteSelector & {
  storage: "dynamic";
  script: string;
  function: string;
  arguments: IndexedDBSupportedDataTypes;
}
type Route = CacheRoute | StaticRoute | DynamicRoute;