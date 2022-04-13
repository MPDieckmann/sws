class MPIDBIndex<K extends string, R extends MPIDBValidRecord> {
  [Symbol.toStringTag] = "MPIDBIndex";

  #idb: IDBDatabase;
  #name: string;
  #keyPath: string | string[];
  #multiEntry: boolean;
  #unique: boolean;
  #objectStoreName: string;
  #objectStoreAutoIncrement: boolean;
  #objectStoreKeyPath: string | string[];
  #objectStoreIndexNames: DOMStringList;
  #databaseName: string;
  #databaseVersion: number;
  #databaseObjectStoreNames: DOMStringList;
  #state: "open" | "aborted" | "closed";

  get name() {
    return this.#name;
  }
  get keyPath() {
    return this.#keyPath;
  }
  get multiEntry() {
    return this.#multiEntry;
  }
  get unique() {
    return this.#unique;
  }
  get objectStoreName() {
    return this.#objectStoreName;
  }
  get objectStoreAutoIncrement() {
    return this.#objectStoreAutoIncrement;
  }
  get objectStoreKeyPath() {
    return this.#objectStoreKeyPath;
  }
  get objectStoreIndexNames() {
    return this.#objectStoreIndexNames;
  }
  get databaseName() {
    return this.#databaseName;
  }
  get databaseVersion() {
    return this.#databaseVersion;
  }
  get databaseObjectStoreNames() {
    return this.#databaseObjectStoreNames;
  }
  get state() {
    return this.#state;
  }

  constructor(index: IDBIndex) {
    this.#state = "open";
    this.#idb = index.objectStore.transaction.db;
    this.#name = index.name;
    this.#keyPath = typeof index.keyPath == "string" ? index.keyPath : index.keyPath.join(".");
    this.#multiEntry = index.multiEntry;
    this.#unique = index.unique;
    this.#objectStoreName = index.objectStore.name;
    this.#objectStoreAutoIncrement = index.objectStore.autoIncrement;
    this.#objectStoreKeyPath = index.objectStore.keyPath;
    this.#objectStoreIndexNames = index.objectStore.indexNames;
    this.#databaseName = this.#idb.name;
    this.#databaseVersion = this.#idb.version;
    this.#databaseObjectStoreNames = this.#idb.objectStoreNames;

    this.#idb.addEventListener("abort", () => this.#state = "aborted");
    this.#idb.addEventListener("close", () => this.#state = "closed");
  }

  #index = (mode: IDBTransactionMode): IDBIndex => {
    let objectStore = this.#idb.transaction(this.#objectStoreName, mode).objectStore(this.#objectStoreName);
    this.#objectStoreIndexNames = objectStore.indexNames;
    return objectStore.index(this.#name);
  }

  #openCursor = (args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor?(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      let request = (this.#index(mode)).openCursor(
        "key" in args ? args.key : null,
        "direction" in args && typeof args.direction == "string" ? args.direction : "next"
      );

      if ("limit" in args && typeof args.limit == "number" && args.limit > 0) {
        let counts = 0;
        let limit = args.limit;
        request.addEventListener(
          "success",
          "ranges" in args && args.ranges.length > 0
            ? async () => {
              let cursor = request.result;
              counts++;
              if (cursor) {
                if (
                  counts < limit &&
                  args.ranges.filter(range => range.includes(cursor.value)).length > 0
                ) {
                  await callback(cursor);
                }
                cursor.continue();
              } else {
                resolve();
              }
            }
            : async () => {
              let cursor = request.result;
              if (cursor) {
                if (counts < limit) {
                  await callback(cursor);
                }
                cursor.continue();
              } else {
                resolve();
              }
            }
        );
      } else {
        request.addEventListener(
          "success",
          "ranges" in args && args.ranges.length > 0
            ? async () => {
              let cursor = request.result;
              if (cursor) {
                if (args.ranges.filter(range => range.includes(cursor.value)).length > 0) {
                  await callback(cursor);
                }
                cursor.continue();
              } else {
                resolve();
              }
            }
            : async () => {
              let cursor = request.result;
              if (cursor) {
                await callback(cursor);
                cursor.continue();
              } else {
                resolve();
              }
            }
        );
      }
      request.addEventListener("error", () => {
        reject(request.error);
      });
    });
  }

  #awaitEvent = (target: EventTarget, resolveType: string, rejectType: string): Promise<Event> => {
    return new Promise(function (resolve, reject) {
      function resolveCallback(event: Event) {
        resolve(event);
        target.removeEventListener(resolveType, resolveCallback);
        target.removeEventListener(rejectType, rejectCallback);
      }
      function rejectCallback(event: Event) {
        reject(event);
        target.removeEventListener(resolveType, resolveCallback);
        target.removeEventListener(rejectType, rejectCallback);
      }
      target.addEventListener(resolveType, resolveCallback, { once: true });
      target.addEventListener(rejectType, rejectCallback, { once: true });
    });
  }

  async count(args: { key?: K | IDBKeyRange; }): Promise<number>;
  async count(args: { key?: K | IDBKeyRange; ranges: MPIDBKeyRanges<R>[]; }): Promise<number>;
  async count(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<number>;
  async count(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor?(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<number> {
    if (
      ("ranges" in args && args.ranges.length > 0) ||
      ("cursor" in args && typeof args.cursor == "function")
    ) {
      let results: number = 0;
      await this.#openCursor(
        args,
        "readonly",
        "cursor" in args && typeof args.cursor == "function"
          ? async cursor => await args.cursor(cursor.value) && void results++
          : () => void results++
      );
      return results;
    } else {
      return (<IDBRequest<number>>(
        await this.#awaitEvent(
          this.#index("readonly").count("key" in args ? args.key : null),
          "success",
          "error"
        )
      ).target).result;
    }
  }

  async delete(args: { key?: K | IDBKeyRange; }): Promise<null>;
  async delete(args: { key?: K | IDBKeyRange; ranges: MPIDBKeyRanges<R>[]; }): Promise<null>;
  async delete(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<null>;
  async delete(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor?(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<null> {
    await this.#openCursor(
      args,
      "readwrite",
      "cursor" in args && typeof args.cursor == "function"
        ? async cursor => await args.cursor(cursor.value) && await this.#awaitEvent(cursor.delete(), "success", "error")
        : async cursor => void await this.#awaitEvent(cursor.delete(), "success", "error")
    );
    return null;
  }

  async get(args: { key?: K | IDBKeyRange; limit?: number; }): Promise<R[]>;
  async get(args: { key?: K | IDBKeyRange; ranges: MPIDBKeyRanges<R>[]; limit?: number; }): Promise<R[]>;
  async get(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<R[]>;
  async get(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor?(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBValidRecord[]> {
    if (
      ("ranges" in args && args.ranges.length > 0) ||
      ("cursor" in args && typeof args.cursor == "function")
    ) {
      let results: MPIDBValidRecord[] = [];
      await this.#openCursor(
        args,
        "readonly",
        "cursor" in args && typeof args.cursor == "function"
          ? async cursor => await args.cursor(cursor.value) && results.push(cursor.value)
          : cursor => void results.push(cursor.value)
      );
      return results;
    } else {
      return (<IDBRequest<any[]>>(
        await this.#awaitEvent(
          this.#index("readonly").getAll(
            "key" in args ? args.key : null,
            "limit" in args ? args.limit : 0
          ),
          "success",
          "error"
        )
      ).target).result;
    }
  }

  async getKey(args: { key?: K | IDBKeyRange; limit?: number; }): Promise<K[]>;
  async getKey(args: { key?: K | IDBKeyRange; ranges: MPIDBKeyRanges<R>[]; limit?: number; }): Promise<K[]>;
  async getKey(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<K[]>;
  async getKey(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor?(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBValidKey[]> {
    if (
      ("ranges" in args && args.ranges.length > 0) ||
      ("cursor" in args && typeof args.cursor == "function")
    ) {
      let results: MPIDBValidKey[] = [];
      await this.#openCursor(
        args,
        "readonly",
        "cursor" in args && typeof args.cursor == "function"
          ? async cursor => await args.cursor(cursor.value) && results.push(<MPIDBValidKey>cursor.key)
          : cursor => void results.push(<MPIDBValidKey>cursor.key)
      );
      return results;
    } else {
      return (<IDBRequest<any[]>>(
        await this.#awaitEvent(
          this.#index("readonly").getAllKeys(
            "key" in args ? args.key : null,
            "limit" in args ? args.limit : 0
          ),
          "success",
          "error"
        )
      ).target).result;
    }
  }

  async openCursor(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null>;
  async openCursor(args: { key?: K | IDBKeyRange; ranges?: MPIDBKeyRanges<R>[]; cursor(record: R): boolean | Promise<boolean>; direction?: IDBCursorDirection; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null> {
    await this.#openCursor(
      args,
      mode,
      "cursor" in args && typeof args.cursor == "function"
        ? async cursor => await args.cursor(cursor.value) && await callback(cursor)
        : async cursor => void await callback(cursor)
    );
    return null;
  }
}
