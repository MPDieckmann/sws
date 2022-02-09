class MPIDBObjectStore<O extends MPIDBObjectStoreInit<MPIDBValidRecord, string>> {
  [Symbol.toStringTag] = "MPIDBObjectStore";

  #idb: IDBDatabase;
  #name: string;
  #autoIncrement: boolean;
  #keyPath: string | string[];
  #indexNames: DOMStringList;
  #databaseName: string;
  #databaseVersion: number;
  #databaseObjectStoreNames: DOMStringList;
  #state: "open" | "aborted" | "closed";

  get name() {
    return this.#name;
  }
  get autoIncrement() {
    return this.#autoIncrement;
  }
  get keyPath() {
    return this.#keyPath;
  }
  get indexNames() {
    return this.#indexNames;
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

  constructor(objectStore: IDBObjectStore) {
    this.#state = "open";
    this.#idb = objectStore.transaction.db;
    this.#name = objectStore.name;
    this.#keyPath = objectStore.keyPath;
    this.#autoIncrement = objectStore.autoIncrement;
    this.#indexNames = objectStore.indexNames;
    this.#databaseName = this.#idb.name;
    this.#databaseVersion = this.#idb.version;
    this.#databaseObjectStoreNames = this.#idb.objectStoreNames;

    this.#idb.addEventListener("abort", () => this.#state = "aborted");
    this.#idb.addEventListener("close", () => this.#state = "closed");
  }

  #index = (indexName: string, mode: IDBTransactionMode): IDBIndex => {
    return this.#objectStore(mode).index(indexName);
  }

  #objectStore = (mode: IDBTransactionMode): IDBObjectStore => {
    let objectStore = this.#idb.transaction(this.#name, mode).objectStore(this.#name);
    this.#indexNames = objectStore.indexNames;
    return objectStore;
  }

  #openCursor = (args: { indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      let request = (
        "indexName" in args && typeof args.indexName == "string"
          ? this.#index(args.indexName, mode)
          : this.#objectStore(mode)
      ).openCursor(
        "key" in args ? <IDBValidKey>args.key : null,
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

  async add(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]>; record: O["Records"]; }): Promise<MPIDBValidKey>;
  async add(args: { keys?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]>[]; records: O["Records"][]; }): Promise<MPIDBValidKey[]>;
  async add(args: { key?: MPIDBValidKey; record: MPIDBValidRecord; } | { keys?: MPIDBValidKey[]; records: MPIDBValidRecord[]; }): Promise<MPIDBValidKey | MPIDBValidKey[]> {
    let objectStore = this.#objectStore("readwrite");
    if ("keys" in args && args.keys.length == args.records.length) {
      let i = 0;
      let l = args.records.length;
      let keys: MPIDBValidKey[] = [];
      for (i; i < l; i++) {
        keys.push(
          (<IDBRequest>(
            await this.#awaitEvent(
              objectStore.add(args.records[i], <IDBValidKey>args.keys[i]),
              "success",
              "error"
            )
          ).target).result
        );
      }
      return keys;
    } else if ("records" in args) {
      let i = 0;
      let l = args.records.length;
      let keys: MPIDBValidKey[] = [];
      for (i; i < l; i++) {
        keys.push(
          (<IDBRequest>(
            await this.#awaitEvent(
              objectStore.add(args.records[i]),
              "success",
              "error"
            )
          ).target).result
        );
      }
      return keys;
    } else if ("key" in args) {
      return (<IDBRequest>(
        await this.#awaitEvent(
          objectStore.add(args.record, <IDBValidKey>args.key),
          "success",
          "error"
        )
      ).target).result;
    } else {
      return (<IDBRequest>(
        await this.#awaitEvent(
          objectStore.add(args.record),
          "success",
          "error"
        )
      ).target).result;
    }
  }

  async count(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; }): Promise<number>;
  async count(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<O["Records"]>[]; }): Promise<number>;
  async count(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<number>;
  async count<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; }): Promise<number>;
  async count<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<O["Records"]>[]; }): Promise<number>;
  async count<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<number>;
  async count(args: { indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<number> {
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
        await this.#awaitEvent((
          "indexName" in args && typeof args.indexName == "string"
            ? this.#index(args.indexName, "readonly")
            : this.#objectStore("readonly")
        ).count("key" in args ? <IDBValidKey>args.key : null),
          "success",
          "error"
        )
      ).target).result;
    }
  }

  async delete(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; }): Promise<null>;
  async delete(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<O["Records"]>[]; }): Promise<null>;
  async delete(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<null>;
  async delete<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; }): Promise<null>;
  async delete<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<O["Records"]>[]; }): Promise<null>;
  async delete<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<null>;
  async delete(args: { indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<null> {
    if (
      ("ranges" in args && args.ranges.length > 0) ||
      ("cursor" in args && typeof args.cursor == "function") ||
      ("indexName" in args && typeof args.indexName == "string")
    ) {
      await this.#openCursor(
        args,
        "readwrite",
        "cursor" in args && typeof args.cursor == "function"
          ? async cursor => await args.cursor(cursor.value) && await this.#awaitEvent(cursor.delete(), "success", "error")
          : async cursor => void await this.#awaitEvent(cursor.delete(), "success", "error")
      );
    } else {
      let objectStore: IDBObjectStore = this.#objectStore("readwrite");
      let request: IDBRequest<undefined>;
      if ("key" in args) {
        request = objectStore.delete(<IDBValidKey>args.key);
      } else {
        request = objectStore.clear();
      }
      await this.#awaitEvent(request, "success", "error");
    }
    return null;
  }

  async get(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; limit?: number; }): Promise<O["Records"][]>;
  async get(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<O["Records"]>[]; limit?: number; }): Promise<O["Records"][]>;
  async get(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<O["Records"][]>;
  async get<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; limit?: number; }): Promise<O["Records"][]>;
  async get<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<O["Records"]>[]; limit?: number; }): Promise<O["Records"][]>;
  async get<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<O["Records"][]>;
  async get(args: { indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBValidRecord[]> {
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
          (
            "indexName" in args && typeof args.indexName == "string"
              ? this.#index(args.indexName, "readonly")
              : this.#objectStore("readonly")
          ).getAll(
            "key" in args ? <IDBValidKey>args.key : null,
            "limit" in args ? args.limit : 0
          ),
          "success",
          "error"
        )
      ).target).result;
    }
  }

  async getKey(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; limit?: number; }): Promise<MPIDBKeyPathToType<O["KeyPath"], O["Records"]>[]>;
  async getKey(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<O["Records"]>[]; limit?: number; }): Promise<MPIDBKeyPathToType<O["KeyPath"], O["Records"]>[]>;
  async getKey(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBKeyPathToType<O["KeyPath"], O["Records"]>[]>;
  async getKey<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; limit?: number; }): Promise<MPIDBKeyPathToType<O["KeyPath"], O["Records"]>[]>;
  async getKey<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<O["Records"]>[]; limit?: number; }): Promise<MPIDBKeyPathToType<O["KeyPath"], O["Records"]>[]>;
  async getKey<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBKeyPathToType<O["KeyPath"], O["Records"]>[]>;
  async getKey(args: { indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBValidKey[]> {
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
          (
            "indexName" in args && typeof args.indexName == "string"
              ? this.#index(args.indexName, "readonly")
              : this.#objectStore("readonly")
          ).getAllKeys(
            "key" in args ? <IDBValidKey>args.key : null,
            "limit" in args ? args.limit : 0
          ),
          "success",
          "error"
        )
      ).target).result;
    }
  }

  index<I extends Extract<keyof O["Indices"], string>>(index: I): MPIDBIndex<O["Indices"][I], O["Records"]> {
    return new MPIDBIndex(this.#index(index, "readonly"));
  }

  async openCursor(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null>;
  async openCursor<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I, key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<O["Records"]>[]; cursor(record: O["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null>;
  async openCursor(args: { indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null> {
    await this.#openCursor(
      args,
      mode,
      "cursor" in args && typeof args.cursor == "function"
        ? async cursor => await args.cursor(cursor.value) && await callback(cursor)
        : async cursor => void await callback(cursor)
    );
    return null;
  }

  async put(args: { key?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]>; record: O["Records"]; }): Promise<MPIDBValidKey>;
  async put(args: { keys?: MPIDBKeyPathToType<O["KeyPath"], O["Records"]>[]; records: O["Records"][]; }): Promise<MPIDBValidKey[]>;
  async put<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I; key?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]>; record: O["Records"]; }): Promise<MPIDBValidKey>;
  async put<I extends Extract<keyof O["Indices"], string>>(args: { indexName: I; keys?: MPIDBKeyPathToType<O["Indices"][I], O["Records"]>[]; records: O["Records"][]; }): Promise<MPIDBValidKey[]>;
  async put(args: { key?: MPIDBValidKey; record: MPIDBValidRecord; } | { keys?: MPIDBValidKey[]; records: MPIDBValidRecord[]; }): Promise<MPIDBValidKey | MPIDBValidKey[]> {
    let objectStore = this.#objectStore("readwrite");
    if ("keys" in args && args.keys.length == args.records.length) {
      let i = 0;
      let l = args.records.length;
      let keys: MPIDBValidKey[] = [];
      for (i; i < l; i++) {
        keys.push(
          (<IDBRequest>(
            await this.#awaitEvent(
              objectStore.add(args.records[i], <IDBValidKey>args.keys[i]),
              "success",
              "error"
            )
          ).target).result
        );
      }
      return keys;
    } else if ("records" in args) {
      let i = 0;
      let l = args.records.length;
      let keys: MPIDBValidKey[] = [];
      for (i; i < l; i++) {
        keys.push(
          (<IDBRequest>(
            await this.#awaitEvent(objectStore.add(args.records[i]),
              "success",
              "error"
            )
          ).target).result
        );
      }
      return keys;
    } else if ("key" in args) {
      return (<IDBRequest>(
        await this.#awaitEvent(
          objectStore.add(args.record, <IDBValidKey>args.key),
          "success",
          "error"
        )
      ).target).result;
    } else {
      return (<IDBRequest>(
        await this.#awaitEvent(
          objectStore.add(args.record),
          "success",
          "error"
        )
      ).target).result;
    }
  }
}

interface MPIDBObjectStoreInit<R extends MPIDBValidRecord, I extends string> {
  Records: R;
  KeyPath: string;
  Indices: {
    [i in I]: string;
  };
}