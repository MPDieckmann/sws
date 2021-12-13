/// <reference no-default-lib="true" />
/// <reference path="index.ts" />

class IndexedDBIndex<O, R> extends EventTarget {
  [Symbol.toStringTag] = "IndexedDBIndex";

  readonly STATE_CLOSED = 0;
  readonly STATE_UPGRADING = 1;
  readonly STATE_IDLE = 2;
  readonly STATE_OPERATING = 4;

  #index: IDBIndex;
  #state: number = this.STATE_CLOSED;
  #queue: (() => Promise<void>)[] = [];
  #ready: Promise<this>;

  get state() {
    return this.#state;
  }

  get name() {
    return this.#index.name;
  }

  get objectStoreName() {
    return this.#index.objectStore.name;
  }

  get keyPath() {
    return this.#index.keyPath;
  }

  get multiEntry() {
    return this.#index.multiEntry;
  }

  get unique() {
    return this.#index.unique;
  }

  constructor(index: IDBIndex) {
    super();

    this.#index = index;
    this.dispatchEvent(new IndexedDBEvent("statechange", {
      cancelable: false,
      function: "statechange",
      arguments: null,
      result: this.STATE_IDLE
    }));
    this.#state = this.STATE_IDLE;
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
      // console.log("IndexedDBIndex: operating");
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
      // console.log("IndexedDBIndex: idle");
    }
  }

  #get(query: IndexedDBQuery<R>): Promise<IndexedDBRecord<R>[]> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#index.openCursor();
      let results: IndexedDBRecord<R>[] = [];
      request.addEventListener("success", () => {
        let cursor = request.result;
        if (cursor) {
          if (this.#record_matches_query(cursor.value, query)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          this.dispatchEvent(new IndexedDBEvent<O, R, keyof IndexedDBEventInitMap<O, R>>("success", {
            cancelable: false,
            function: "get",
            arguments: {
              objectStoreName: <O>(<IDBIndex>request.source).objectStore.name,
              query
            },
            result: results
          }));
          resolve(results);
        }
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<O, R, keyof IndexedDBEventInitMap<O, R>>("error", {
          cancelable: false,
          function: "get",
          arguments: {
            objectStoreName: <O>(<IDBIndex>request.source).objectStore.name,
            query
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #getAll(): Promise<IndexedDBRecord<R>[]> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#index.getAll();
      request.addEventListener("success", () => {
        this.dispatchEvent(new IndexedDBEvent<O, R, keyof IndexedDBEventInitMap<O, R>>("success", {
          cancelable: false,
          function: "getAll",
          arguments: {
            objectStoreName: <O>(<IDBIndex>request.source).objectStore.name
          },
          result: request.result
        }));
        resolve(request.result);
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<O, R, keyof IndexedDBEventInitMap<O, R>>("error", {
          cancelable: false,
          function: "getAll",
          arguments: {
            objectStoreName: <O>(<IDBIndex>request.source).objectStore.name
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #count(): Promise<number> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#index.count();
      request.addEventListener("success", () => {
        this.dispatchEvent(new IndexedDBEvent<O, R, keyof IndexedDBEventInitMap<O, R>>("success", {
          cancelable: false,
          function: "count",
          arguments: {
            objectStoreName: <O>(<IDBIndex>request.source).objectStore.name
          },
          result: request.result
        }));
        resolve(request.result);
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<O, R, keyof IndexedDBEventInitMap<O, R>>("error", {
          cancelable: false,
          function: "count",
          arguments: {
            objectStoreName: <O>(<IDBIndex>request.source).objectStore.name
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #openCursor(cursorCallback: (record: R) => boolean): Promise<IndexedDBRecord<R>[]> {
    return new Promise(async (resolve, reject) => {
      await this.#ready;
      let request = this.#index.openCursor();
      let results: IndexedDBRecord<R>[] = [];
      request.addEventListener("success", () => {
        let cursor = request.result;
        if (cursor) {
          if (cursorCallback(cursor.value)) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          this.dispatchEvent(new IndexedDBEvent<O, R, keyof IndexedDBEventInitMap<O, R>>("success", {
            cancelable: false,
            function: "openCursor",
            arguments: {
              objectStoreName: <O>(<IDBIndex>request.source).objectStore.name,
              cursorCallback
            },
            result: results
          }));
          resolve(results);
        }
      });
      request.addEventListener("error", () => {
        this.dispatchEvent(new IndexedDBEvent<O, R, keyof IndexedDBEventInitMap<O, R>>("error", {
          cancelable: false,
          function: "openCursor",
          arguments: {
            objectStoreName: <O>(<IDBIndex>request.source).objectStore.name,
            cursorCallback
          },
          error: request.error
        }));
        reject(request.error);
      });
    });
  }

  #record_matches_query(record: IndexedDBRecord<R>, query: IndexedDBQuery<R>): boolean {
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

  get(query: IndexedDBQuery<R>): Promise<IndexedDBRecord<R>[]> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#get(query).then(resolve, reject));
      this.#dequeue();
    });
  }

  getAll(): Promise<IndexedDBRecord<R>[]> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#getAll().then(resolve, reject));
      this.#dequeue();
    });
  }

  count(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#count().then(resolve, reject));
      this.#dequeue();
    });
  }

  openCursor(cursorCallback: (record: R) => boolean): Promise<IndexedDBRecord<R>[]> {
    return new Promise((resolve, reject) => {
      this.#queue.push(() => this.#openCursor(cursorCallback).then(resolve, reject));
      this.#dequeue();
    });
  }
  #staticEvents: Map<keyof IndexedDBIndexEventMap<O>, (this: IndexedDBIndex<O, R>, ev: IndexedDBIndexEventMap<O>[keyof IndexedDBIndexEventMap<O>]) => any> = new Map();
  get onsuccess() {
    return this.#staticEvents.get("success") || null;
  }
  set onsuccess(value: (this: IndexedDBIndex<O, R>, ev: IndexedDBIndexEventMap<O>["success"]) => any) {
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
  set onerror(value: (this: IndexedDBIndex<O, R>, ev: IndexedDBIndexEventMap<O>["error"]) => any) {
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
}

interface IndexedDBIndex<O extends PropertyKey, R> {
  addEventListener<K extends keyof IndexedDBIndexEventMap<O>>(type: K, listener: (this: IndexedDBIndex<O, R>, ev: IndexedDBIndexEventMap<O>[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
}

interface IndexedDBIndexEventMap<O extends PropertyKey> {
  success: IndexedDBEvent<O, string, keyof IndexedDBEventInitMap<O, string>>;
  error: IndexedDBEvent<O, string, keyof IndexedDBEventInitMap<O, string>>;
}
