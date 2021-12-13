/// <reference no-default-lib="true" />
/// <reference path="index.ts" />

class IndexedDB<M, I extends string> extends EventTarget {
  [Symbol.toStringTag] = "IndexedDB";

  static readonly STATE_CLOSED = 0;
  static readonly STATE_UPGRADING = 1;
  static readonly STATE_IDLE = 2;
  static readonly STATE_OPERATING = 4;
  readonly STATE_CLOSED = IndexedDB.STATE_CLOSED;
  readonly STATE_UPGRADING = IndexedDB.STATE_UPGRADING;
  readonly STATE_IDLE = IndexedDB.STATE_IDLE;
  readonly STATE_OPERATING = IndexedDB.STATE_OPERATING;

  #idb: IDBDatabase;
  #state: number = this.STATE_CLOSED;
  #queue: (() => Promise<void> | void)[] = [];
  #ready: Promise<this>;

  get ready() {
    return this.#ready;
  }

  get state() {
    return this.#state;
  }

  constructor(name: string, version: number, objectStoreDefinitions: IDBObjectStoreDefinition<keyof M, I>[]) {
    super();

    this.#ready = new Promise((resolve, reject) => {
      let request = indexedDB.open(name, version);
      request.addEventListener("success", () => {
        this.#idb = request.result;
        this.dispatchEvent(new IndexedDBEvent("statechange", {
          cancelable: false,
          function: "statechange",
          arguments: null,
          result: this.STATE_IDLE
        }));
        this.#state = this.STATE_IDLE;
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[keyof M], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
          cancelable: false,
          function: "open",
          arguments: {
            name,
            version,
            objectStoreDefinitions
          },
          result: request.result
        }));
        resolve(this);
      });
      request.addEventListener("upgradeneeded", () => {
        this.dispatchEvent(new IndexedDBEvent("statechange", {
          cancelable: false,
          function: "statechange",
          arguments: null,
          result: this.STATE_UPGRADING
        }));
        this.#state = this.STATE_UPGRADING;
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[keyof M], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("upgradeneeded", {
          cancelable: false,
          function: "open",
          arguments: {
            name,
            version,
            objectStoreDefinitions
          },
          result: request.result
        }));

        objectStoreDefinitions.forEach(objectStoreDefinition => {
          let objectStore = request.result.createObjectStore(<string>objectStoreDefinition.name, objectStoreDefinition);
          objectStoreDefinition.indices.forEach(index => {
            objectStore.createIndex(index.name, index.keyPath, index);
          });
        });
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[keyof M], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "open",
          arguments: {
            name,
            version,
            objectStoreDefinitions
          },
          error: request.error
        }));
        this.dispatchEvent(new IndexedDBEvent("statechange", {
          cancelable: false,
          function: "statechange",
          arguments: null,
          result: this.STATE_CLOSED
        }));
        this.#state = this.STATE_CLOSED;
        reject(request.error);
      });
      request.addEventListener("blocked", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[keyof M], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("blocked", {
          cancelable: false,
          function: "open",
          arguments: {
            name,
            version,
            objectStoreDefinitions
          },
          error: request.error
        }));
        this.dispatchEvent(new IndexedDBEvent("statechange", {
          cancelable: false,
          function: "statechange",
          arguments: null,
          result: this.STATE_CLOSED
        }));
        this.#state = this.STATE_CLOSED;
        reject(request.error);
      });
    });
  }

  async #dequeue() {
    if (this.#state == this.STATE_IDLE && this.#queue.length > 0) {
      this.dispatchEvent(new IndexedDBEvent("statechange", {
        cancelable: false,
        function: "statechange",
        arguments: null,
        result: this.STATE_OPERATING
      }));
      this.#state = this.STATE_OPERATING;
      // console.log("IndexedDB: operating");
      let task: (() => Promise<void> | void);
      while (task = this.#queue.shift()) {
        try {
          await task();
        } catch (error) {
          console.error(error);
        }
      }
      this.dispatchEvent(new IndexedDBEvent("statechange", {
        cancelable: false,
        function: "statechange",
        arguments: null,
        result: this.STATE_IDLE
      }));
      this.#state = this.STATE_IDLE;
      // console.log("IndexedDB: idle");
    }
  }

  #add<O extends keyof M>(objectStoreName: O, record: IndexedDBRecord<M[O]>): Promise<IDBValidKey> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#idb.transaction([<string>objectStoreName], "readwrite").objectStore(<string>objectStoreName).add(record);
      request.addEventListener("success", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
          cancelable: false,
          function: "add",
          arguments: {
            objectStoreName,
            record
          },
          result: request.result
        }));
        resolve(request.result);
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "add",
          arguments: {
            objectStoreName,
            record
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #put<O extends keyof M>(objectStoreName: O, record: IndexedDBRecord<M[O]>): Promise<IDBValidKey> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#idb.transaction([<string>objectStoreName], "readwrite").objectStore(<string>objectStoreName).put(record);
      request.addEventListener("success", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
          cancelable: false,
          function: "put",
          arguments: {
            objectStoreName,
            record
          },
          result: request.result
        }));
        resolve(request.result);
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "put",
          arguments: {
            objectStoreName,
            record
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #get<O extends keyof M>(objectStoreName: O, query: IndexedDBQuery<M[O]>): Promise<IndexedDBRecord<M[O]>[]> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#idb.transaction([<string>objectStoreName], "readwrite").objectStore(<string>objectStoreName).openCursor();
      let results: IndexedDBRecord<M[O]>[] = [];
      request.addEventListener("success", () => {
        let cursor = request.result;
        if (cursor) {
          if (this.#record_matches_query(cursor.value, query)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
            cancelable: false,
            function: "get",
            arguments: {
              objectStoreName,
              query
            },
            result: results
          }));
          resolve(results);
        }
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "get",
          arguments: {
            objectStoreName,
            query
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #getAll<O extends keyof M>(objectStoreName: O): Promise<IndexedDBRecord<M[O]>[]> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#idb.transaction([<string>objectStoreName], "readonly").objectStore(<string>objectStoreName).getAll();
      request.addEventListener("success", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
          cancelable: false,
          function: "getAll",
          arguments: {
            objectStoreName
          },
          result: request.result
        }));
        resolve(request.result);
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "getAll",
          arguments: {
            objectStoreName
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #delete<O extends keyof M>(objectStoreName: O, query: IndexedDBQuery<M[O]>): Promise<IndexedDBRecord<M[O]>[]> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#idb.transaction([<string>objectStoreName], "readwrite").objectStore(<string>objectStoreName).openCursor();
      let results: IndexedDBRecord<M[O]>[] = [];
      request.addEventListener("success", () => {
        let cursor = request.result;
        if (cursor) {
          if (this.#record_matches_query(cursor.value, query)) {
            results.push(cursor.value);
            cursor.delete();
          }
          cursor.continue();
        } else {
          this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
            cancelable: false,
            function: "delete",
            arguments: {
              objectStoreName,
              query
            },
            result: results
          }));
          resolve(results);
        }
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "delete",
          arguments: {
            objectStoreName,
            query
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #count<O extends keyof M>(objectStoreName: O): Promise<number> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#idb.transaction([<string>objectStoreName]).objectStore(<string>objectStoreName).count();
      request.addEventListener("success", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
          cancelable: false,
          function: "count",
          arguments: {
            objectStoreName
          },
          result: request.result
        }));
        resolve(request.result);
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "count",
          arguments: {
            objectStoreName
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #clear<O extends keyof M>(objectStoreName: O): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#idb.transaction([<string>objectStoreName], "readwrite").objectStore(<string>objectStoreName).clear();
      request.addEventListener("success", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
          cancelable: false,
          function: "clear",
          arguments: {
            objectStoreName
          },
          result: request.result
        }));
        resolve(request.result);
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "clear",
          arguments: {
            objectStoreName
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #openCursor<O extends keyof M>(objectStoreName: O, cursorCallback: (record: M[O]) => boolean): Promise<IndexedDBRecord<M[O]>[]> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#idb.transaction([<string>objectStoreName], "readwrite").objectStore(<string>objectStoreName).openCursor();
      let results: IndexedDBRecord<M[O]>[] = [];
      request.addEventListener("success", () => {
        let cursor = request.result;
        if (cursor) {
          if (cursorCallback(cursor.value)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("success", {
            cancelable: false,
            function: "openCursor",
            arguments: {
              objectStoreName,
              cursorCallback
            },
            result: results
          }));
          resolve(results);
        }
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<keyof M, M[O], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>("error", {
          cancelable: false,
          function: "openCursor",
          arguments: {
            objectStoreName,
            cursorCallback
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #record_matches_query<O extends keyof M>(record: IndexedDBRecord<M[O]>, query: IndexedDBQuery<M[O]>): boolean {
    if (query) {
      let property: string;
      for (property in query) {
        if (
          typeof query[property] != typeof record[property] &&
          typeof query[property] == "object" &&
          query[property]
        ) {
          if (
            query[property] instanceof RegExp &&
            !query[property].test(record[property])
          ) {
            return false;
          } else if (
            query[property] instanceof Array &&
            query[property].length == 2 &&
            record[property] < query[property][0] ||
            record[property] > query[property][1]
          ) {
            return false;
          }
        } else if (record[property] != query[property]) {
          return false;
        }
      }
    }
    return true;
  }

  add<O extends keyof M>(objectStoreName: O, record: IndexedDBRecord<M[O]>): Promise<IDBValidKey> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#add(objectStoreName, record).then(resolve, reject));
      this.#dequeue();
    });
  }

  put<O extends keyof M>(objectStoreName: O, record: IndexedDBRecord<M[O]>): Promise<IDBValidKey> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#put(objectStoreName, record).then(resolve, reject));
      this.#dequeue();
    });
  }

  get<O extends keyof M>(objectStoreName: O, query: IndexedDBQuery<M[O]>): Promise<IndexedDBRecord<M[O]>[]> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#get(objectStoreName, query).then(resolve, reject));
      this.#dequeue();
    });
  }

  getAll<O extends keyof M>(objectStoreName: O): Promise<IndexedDBRecord<M[O]>[]> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#getAll(objectStoreName).then(resolve, reject));
      this.#dequeue();
    });
  }

  delete<O extends keyof M>(objectStoreName: O, query: IndexedDBQuery<M[O]>): Promise<IndexedDBRecord<M[O]>[]> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#delete(objectStoreName, query).then(resolve, reject));
      this.#dequeue();
    });
  }

  count<O extends keyof M>(objectStoreName: O): Promise<number> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#count(objectStoreName).then(resolve, reject));
      this.#dequeue();
    });
  }

  clear<O extends keyof M>(objectStoreName: O): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#clear(objectStoreName).then(resolve, reject));
      this.#dequeue();
    });
  }

  openCursor<O extends keyof M>(objectStoreName: O, cursorCallback: (record: M[O]) => boolean): Promise<IndexedDBRecord<M[O]>[]> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#openCursor(objectStoreName, cursorCallback).then(resolve, reject));
      this.#dequeue();
    });
  }

  index<O extends keyof M>(objectStoreName: O, index: I): IndexedDBIndex<O, M[O]> {
    return new IndexedDBIndex(this.#idb.transaction([<string>objectStoreName], "readonly").objectStore(<string>objectStoreName).index(index));
  }

  #staticEvents: Map<keyof IndexedDBEventMap<M>, (this: IndexedDB<M, I>, ev: IndexedDBEventMap<M>[keyof IndexedDBEventMap<M>]) => any> = new Map();
  get onsuccess() {
    return this.#staticEvents.get("success") || null;
  }
  set onsuccess(value: (this: IndexedDB<M, I>, ev: IndexedDBEventMap<M>["success"]) => any) {
    if (this.#staticEvents.has("success")) {
      this.removeEventListener("success", <EventListener>this.#staticEvents.get("success"));
    }
    if (typeof value == "function") {
      this.#staticEvents.set("success", value);
      this.addEventListener("success", <EventListener>value);
    } else {
      this.#staticEvents.delete("success");
    }
  }
  get onerror() {
    return this.#staticEvents.get("error") || null;
  }
  set onerror(value: (this: IndexedDB<M, I>, ev: IndexedDBEventMap<M>["error"]) => any) {
    if (this.#staticEvents.has("error")) {
      this.removeEventListener("error", <EventListener>this.#staticEvents.get("error"));
    }
    if (typeof value == "function") {
      this.#staticEvents.set("error", value);
      this.addEventListener("error", <EventListener>value);
    } else {
      this.#staticEvents.delete("error");
    }
  }
  get onblocked() {
    return this.#staticEvents.get("blocked") || null;
  }
  set onblocked(value: (this: IndexedDB<M, I>, ev: IndexedDBEventMap<M>["blocked"]) => any) {
    if (this.#staticEvents.has("blocked")) {
      this.removeEventListener("blocked", <EventListener>this.#staticEvents.get("blocked"));
    }
    if (typeof value == "function") {
      this.#staticEvents.set("blocked", value);
      this.addEventListener("blocked", <EventListener>value);
    } else {
      this.#staticEvents.delete("blocked");
    }
  }
  get onstatechange() {
    return this.#staticEvents.get("statechange") || null;
  }
  set onstatechange(value: (this: IndexedDB<M, I>, ev: IndexedDBEventMap<M>["statechange"]) => any) {
    if (this.#staticEvents.has("statechange")) {
      this.removeEventListener("statechange", <EventListener>this.#staticEvents.get("statechange"));
    }
    if (typeof value == "function") {
      this.#staticEvents.set("statechange", value);
      this.addEventListener("statechange", <EventListener>value);
    } else {
      this.#staticEvents.delete("statechange");
    }
  }
}

interface IndexedDB<M, I> {
  addEventListener<K extends keyof IndexedDBEventMap<M>>(type: K, listener: (this: IndexedDB<M, I>, ev: IndexedDBEventMap<M>[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
}

interface IndexedDBEventMap<M> {
  success: IndexedDBEvent<keyof M, M[keyof M], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>;
  error: IndexedDBEvent<keyof M, M[keyof M], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>;
  blocked: IndexedDBEvent<keyof M, M[keyof M], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>;
  statechange: IndexedDBEvent<keyof M, M[keyof M], keyof IndexedDBEventInitMap<keyof M, M[keyof M]>>;
}

interface IDBObjectStoreDefinition<O extends PropertyKey, I> {
  name: O;
  autoIncrement: boolean;
  keyPath: string;
  indices: IDBIndexConfiguration<I>[];
}

interface IDBIndexConfiguration<I> {
  name: I;
  keyPath: string;
  multiEntry: boolean;
  unique: boolean;
}

type IndexedDBQuery<R> = { [K in keyof R]?: R[K] | [string | number, string | number] | string | number | RegExp; }

type IndexedDBRecord<R> = { [K in keyof R]: R[K]; }
