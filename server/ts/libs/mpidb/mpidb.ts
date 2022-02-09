class MPIDB<Init extends MPIDBInit> {
  [Symbol.toStringTag] = "MPIDB";

  static open<Init extends MPIDBInit>(name: string, version: number = null, objectStores: {
    [o in keyof Init]: {
      name: string;
      autoIncrement: boolean;
      keyPath: Init[o]["KeyPath"];
      indices: {
        [i in keyof Init[o]["Indices"]]: {
          name: string;
          keyPath: Init[o]["Indices"][i];
          multiEntry: boolean;
          unique: boolean;
        }
      };
    }
  } = null): MPIDBPromise<Init> {
    return new MPIDBPromise(new Promise((resolve, reject) => {
      let request = version ? indexedDB.open(name, version) : indexedDB.open(name);
      request.addEventListener("success", () => resolve(new MPIDB(request.result)));
      if (objectStores) {
        request.addEventListener("upgradeneeded", () => {
          let idb = request.result;
          let objectStoreNames = Object.keys(objectStores).map(objectStoreName => {
            let objectStoreDefinition = objectStores[objectStoreName];
            let objectStore: IDBObjectStore = null;
            if (idb.objectStoreNames.contains(objectStoreName)) {
              let oldObjectStore = idb.transaction(objectStoreName, "readonly").objectStore(objectStoreName);
              if (
                oldObjectStore.autoIncrement != objectStoreDefinition.autoIncrement ||
                oldObjectStore.keyPath != objectStoreDefinition.keyPath
              ) {
                throw new DOMException("Failed to alter ObjectStore");
              }
              objectStore = oldObjectStore;
            }
            if (!objectStore) {
              objectStore = idb.createObjectStore(objectStoreDefinition.name, objectStoreDefinition);
            }
            let indexNames = Object.keys(objectStoreDefinition.indices).map(indexName => {
              let indexDefinition = objectStoreDefinition.indices[indexName];
              if (objectStore.indexNames.contains(indexDefinition.name)) {
                let oldIndex = objectStore.index(indexDefinition.name);
                if (
                  oldIndex.keyPath !== indexDefinition.keyPath &&
                  oldIndex.multiEntry !== indexDefinition.multiEntry &&
                  oldIndex.unique !== indexDefinition.unique
                ) {
                  objectStore.deleteIndex(indexDefinition.name);
                }
              }
              if (!objectStore.indexNames.contains(indexDefinition.name)) {
                objectStore.createIndex(indexDefinition.name, indexDefinition.keyPath, {
                  multiEntry: indexDefinition.multiEntry,
                  unique: indexDefinition.unique
                });
              }
              return indexDefinition.name;
            });
            Array.from(objectStore.indexNames).forEach(indexName => {
              if (indexNames.indexOf(indexName) < 0) {
                objectStore.deleteIndex(indexName);
              }
            });
            return objectStoreName;
          });
          Array.from(idb.objectStoreNames).forEach(objectStoreName => {
            if (objectStoreNames.indexOf(objectStoreName) < 0) {
              idb.deleteObjectStore(objectStoreName);
            }
          });
        });
      }
      request.addEventListener("error", () => reject(request.error));
      request.addEventListener("blocked", () => reject(request.error));
      request.addEventListener("versionchange", () => reject(request.error));
    }));
  }

  #idb: IDBDatabase;
  #name: string;
  #version: number;
  #objectStoreNames: DOMStringList;
  #state: "open" | "aborted" | "closed";

  get name() {
    return this.#name;
  }
  get version() {
    return this.#version;
  }
  get objectStoreNames() {
    return this.#objectStoreNames;
  }
  get state() {
    return this.#state;
  }

  constructor(indexedDB: IDBDatabase) {
    this.#idb = indexedDB;
    this.#name = indexedDB.name;
    this.#version = indexedDB.version;
    this.#objectStoreNames = indexedDB.objectStoreNames;
    this.#state = "open";

    this.#idb.addEventListener("abort", () => this.#state = "aborted");
    this.#idb.addEventListener("close", () => this.#state = "closed");
  }

  #index = (objectStoreName: string, indexName: string, mode: IDBTransactionMode): IDBIndex => {
    return this.#objectStore(objectStoreName, mode).index(indexName);
  }

  #objectStore = (objectStoreName: string, mode: IDBTransactionMode): IDBObjectStore => {
    return this.#idb.transaction(objectStoreName, mode).objectStore(objectStoreName);
  }

  #openCursor = (args: { objectStoreName?: string; indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      let request = (
        "indexName" in args && typeof args.indexName == "string"
          ? this.#index(args.objectStoreName, args.indexName, mode)
          : this.#objectStore(args.objectStoreName, mode)
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

  // async add<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; record: Init[O]["Records"]; }): Promise<MPIDBValidKey>;
  // async add<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; keys?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]; records: Init[O]["Records"][]; }): Promise<MPIDBValidKey[]>;
  async add<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBValidKey; record: MPIDBValidRecord; } | { objectStoreName: O; keys?: MPIDBValidKey[]; records: MPIDBValidRecord[]; }): Promise<MPIDBValidKey | MPIDBValidKey[]> {
    let objectStore = this.#objectStore(args.objectStoreName, "readwrite");
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

  async count<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<number>;
  async count(args: { objectStoreName?: string; indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<number> {
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
          (
            "indexName" in args && typeof args.indexName == "string"
              ? this.#index(args.objectStoreName, args.indexName, "readonly")
              : this.#objectStore(args.objectStoreName, "readonly")
          ).count("key" in args ? <IDBValidKey>args.key : null),
          "success",
          "error"
        )
      ).target).result;
    }
  }

  async delete<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<null>;
  async delete(args: { objectStoreName?: string; indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<null> {
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
      let objectStore: IDBObjectStore = this.#objectStore(args.objectStoreName, "readwrite");
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

  async get<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get(args: { objectStoreName?: string; indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBValidRecord[]> {
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
          : cursor => void results.push(cursor.value));
      return results;
    } else {
      return (<IDBRequest<any[]>>(
        await this.#awaitEvent(
          (
            "indexName" in args && typeof args.indexName == "string"
              ? this.#index(args.objectStoreName, args.indexName, "readonly")
              : this.#objectStore(args.objectStoreName, "readonly")
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

  async getKey<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey(args: { objectStoreName: string; indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBValidKey[]> {
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
              ? this.#index(args.objectStoreName, args.indexName, "readonly")
              : this.#objectStore(args.objectStoreName, "readonly")
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

  index<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(objectStoreName: O, index: I): MPIDBIndex<Init[O]["Indices"][I], Init[O]["Records"]> {
    return new MPIDBIndex(this.#index(objectStoreName, index, "readonly"));
  }

  objectStore<O extends Extract<keyof Init, string>>(objectStoreName: O): MPIDBObjectStore<Init[O]> {
    return new MPIDBObjectStore(this.#objectStore(objectStoreName, "readonly"));
  }

  async openCursor<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null>;
  async openCursor<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I, key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]> | IDBKeyRange; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null>;
  async openCursor(args: { objectStoreName?: string; indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null> {
    await this.#openCursor(
      args,
      mode,
      "cursor" in args && typeof args.cursor == "function"
        ? async cursor => await args.cursor(cursor.value) && await callback(cursor)
        : async cursor => void await callback(cursor)
    );
    return null;
  }

  // async put<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; record: Init[O]["Records"]; }): Promise<MPIDBValidKey>;
  // async put<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; keys?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]; records: Init[O]["Records"][]; }): Promise<MPIDBValidKey[]>;
  // async put<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; record: Init[O]["Records"]; }): Promise<MPIDBValidKey>;
  // async put<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; keys?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>[]; records: Init[O]["Records"][]; }): Promise<MPIDBValidKey[]>;
  async put<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; key?: MPIDBValidKey; record: MPIDBValidRecord; } | { objectStoreName: O; keys?: MPIDBValidKey[]; records: MPIDBValidRecord[]; } | { objectStoreName: O; indexName: I; key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>[]; record: Init[O]["Records"][]; } | { objectStoreName: O; indexName: I; keys?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>[]; records: Init[O]["Records"][]; }): Promise<MPIDBValidKey | MPIDBValidKey[]> {
    let objectStore = this.#objectStore(args.objectStoreName, "readwrite");
    console.warn("Support for updating by indexName is missing");
    if ("keys" in args && args.keys.length == args.records.length) {
      let i = 0;
      let l = args.records.length;
      let keys: MPIDBValidKey[] = [];
      for (i; i < l; i++) {
        keys.push(
          (<IDBRequest>(
            await this.#awaitEvent(
              objectStore.put(
                args.records[i],
                <IDBValidKey>args.keys[i]
              ),
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
              objectStore.put(args.records[i]),
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
          objectStore.put(args.record, <IDBValidKey>args.key),
          "success",
          "error"
        )
      ).target).result;
    } else {
      return (<IDBRequest>(
        await this.#awaitEvent(
          objectStore.put(args.record),
          "success",
          "error"
        )
      ).target).result;
    }
  }
}

type MPIDBValidKeyPrimitives = string | number;
type MPIDBValidKeyBuiltInObjects = Date | ArrayBuffer | ArrayBufferView;
type MPIDBValidKeyObjects = MPIDBValidKey[];
type MPIDBValidKey = MPIDBValidKeyPrimitives | MPIDBValidKeyBuiltInObjects | MPIDBValidRecordObjects;

type MPIDBValidRecordPrimitives = boolean | null | undefined | number | bigint | string;
type MPIDBValidRecordBuiltInObjects = String | Date | RegExp | Blob | File | FileList | ArrayBuffer | ArrayBufferView | ImageBitmap | ImageData | Map<MPIDBValidRecord, MPIDBValidRecord> | Set<MPIDBValidRecord>;
type MPIDBValidRecordObjects = { [n in string | number]: MPIDBValidRecord; } | MPIDBValidRecord[];
type MPIDBValidRecord = MPIDBValidRecordPrimitives | MPIDBValidRecordBuiltInObjects | MPIDBValidRecordObjects;

type MPIDBKeyPathToType<K extends string, R extends MPIDBValidRecord> =
  K extends `${infer P1}.${infer P2}` ? (
    P1 extends keyof R ? MPIDBKeyPathToType<P2, Extract<R[P1], MPIDBValidRecord>> : `KeyPath does not match MPIDBValidRecord's structure: ${P1} was not found in MPIDBValidRecord`
  ) : K extends `${infer P1}` ? (
    P1 extends keyof R ? (
      R[P1] extends MPIDBValidKey ? R[P1] : "Value of KeyPath does not match MPIDBValidKey"
    ) : `KeyPath does not match MPIDBValidRecord's structure: ${P1} was not found`
  ) : `KeyPath does not match MPIDBValidRecord's structure: ${K} was not found in MPIDBValidRecord`;

type MPIDBInit = Record<string, MPIDBObjectStoreInit<MPIDBValidRecord, string>>;
