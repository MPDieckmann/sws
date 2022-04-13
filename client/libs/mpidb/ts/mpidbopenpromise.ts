class MPIDBPromise<Init extends MPIDBInit> {
  #idb: Promise<MPIDB<Init>>;
  constructor(promise: Promise<MPIDB<Init>>) {
    this.#idb = promise;
  }
  then<TResult1 = MPIDB<Init>, TResult2 = never>(onfulfilled?: (value: MPIDB<Init>) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): MPIDBPromise<Init> {
    this.#idb.then(onfulfilled, onrejected);
    return new MPIDBPromise((async () => await this.#idb)());
  }
  catch<TResult = never>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): MPIDBPromise<Init> {
    this.#idb.catch(onrejected);
    return new MPIDBPromise((async () => await this.#idb)());
  }
  finally(onfinally?: () => void): MPIDBPromise<Init> {
    this.#idb.finally(onfinally);
    return new MPIDBPromise((async () => await this.#idb)());
  }
  async add<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBValidKey; record: MPIDBValidRecord; } | { objectStoreName: O; keys?: MPIDBValidKey[]; records: MPIDBValidRecord[]; }): Promise<MPIDBValidKey | MPIDBValidKey[]> {
    return (await this.#idb).add(args);
  }
  async count<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; }): Promise<number>;
  async count<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<number>;
  async count(args: { objectStoreName?: string; indexName?: string; key?: MPIDBValidKey | IDBKeyRange; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<number> {
    // @ts-expect-error
    return (await this.#idb).count(args);
  }
  async delete<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; }): Promise<null>;
  async delete<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }): Promise<null>;
  async delete(args: { objectStoreName?: string; indexName?: string; key?: IDBKeyRange | MPIDBValidKey; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<null> {
    // @ts-expect-error
    return (await this.#idb).delete(args);
  }
  async get<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<Init[O]["Records"][]>;
  async get(args: { objectStoreName?: string; indexName?: string; key?: IDBKeyRange | MPIDBValidKey; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBValidRecord[]> {
    // @ts-expect-error
    return (await this.#idb).get(args);
  }
  async getKey<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges: MPIDBKeyRanges<Init[O]["Records"]>[]; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]>;
  async getKey(args: { objectStoreName: string; indexName?: string; key?: IDBKeyRange | MPIDBValidKey; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }): Promise<MPIDBValidKey[]> {
    // @ts-expect-error
    return (await this.#idb).getKey(args);
  }
  async index<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(objectStoreName: O, index: I): Promise<MPIDBIndex<Init[O]["Indices"][I], Init[O]["Records"]>> {
    return (await this.#idb).index(objectStoreName, index);
  }
  async objectStore<O extends Extract<keyof Init, string>>(objectStoreName: O): Promise<MPIDBObjectStore<Init[O]>> {
    return (await this.#idb).objectStore(objectStoreName);
  }
  async openCursor<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null>;
  async openCursor<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: IDBKeyRange | MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; ranges?: MPIDBKeyRanges<Init[O]["Records"]>[]; cursor(record: Init[O]["Records"]): boolean | Promise<boolean>; direction?: IDBCursorDirection; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null>;
  async openCursor(args: { objectStoreName?: string; indexName?: string; key?: IDBKeyRange | MPIDBValidKey; ranges?: MPIDBKeyRanges<MPIDBValidRecord>[]; cursor?(record: MPIDBValidRecord): boolean | Promise<boolean>; direction?: IDBCursorDirection; limit?: number; }, mode: IDBTransactionMode, callback: (cursor: IDBCursorWithValue) => void | Promise<void>): Promise<null> {
    // @ts-expect-error
    return (await this.#idb).openCursor(args, mode, callback);
  }
  async put<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; key?: MPIDBValidKey; record: MPIDBValidRecord; } | { objectStoreName: O; keys?: MPIDBValidKey[]; records: MPIDBValidRecord[]; } | { objectStoreName: O; indexName: I; key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>[]; record: Init[O]["Records"][]; } | { objectStoreName: O; indexName: I; keys?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>[]; records: Init[O]["Records"][]; }): Promise<MPIDBValidKey | MPIDBValidKey[]> {
    return (await this.#idb).put(args);
  }
}