class IndexedDBEvent<O extends PropertyKey, R, T extends keyof IndexedDBEventInitMap<O, R>> extends Event {
  [Symbol.toStringTag] = "IndexedDBEvent";

  readonly function: T;
  readonly arguments: IndexedDBEventInitMap<O, R>[T]["arguments"];
  readonly result: IndexedDBEventInitMap<O, R>[T]["result"];
  readonly error: DOMException;

  constructor(type: string, eventInitDict?: IndexedDBEventInit<O, R, T>) {
    super(type, eventInitDict);

    this.function = eventInitDict.function || null;
    this.arguments = eventInitDict.arguments || null;
    this.result = eventInitDict.result || null;
    this.error = eventInitDict.error || null;
  }
}

interface IndexedDBEventInit<O extends PropertyKey, R, T extends keyof IndexedDBEventInitMap<O, R>> extends EventInit {
  function?: T;
  arguments?: IndexedDBEventInitMap<O, R>[T]["arguments"];
  result?: IndexedDBEventInitMap<O, R>[T]["result"];
  error?: DOMException;
}

interface IndexedDBEventInitMap<O extends PropertyKey, R> {
  statechange: {
    arguments: null;
    result: number;
  }
  open: {
    arguments: {
      name: string;
      version: number;
      objectStoreDefinitions: IDBObjectStoreDefinition<O, string>[];
    };
    result: IDBDatabase;
  }
  add: {
    arguments: {
      objectStoreName: O;
      record: IndexedDBRecord<R>;
    };
    result: IDBValidKey;
  }
  put: {
    arguments: {
      objectStoreName: O;
      record: IndexedDBRecord<R>;
    };
    result: IDBValidKey;
  }
  get: {
    arguments: {
      objectStoreName: O;
      query: IndexedDBQuery<R>;
    };
    result: IndexedDBRecord<R>[];
  }
  getAll: {
    arguments: {
      objectStoreName: O;
    };
    result: IndexedDBRecord<R>[];
  }
  delete: {
    arguments: {
      objectStoreName: O;
      query: IndexedDBQuery<R>;
    };
    result: IndexedDBRecord<R>[];
  }
  count: {
    arguments: {
      objectStoreName: O;
    };
    result: number;
  }
  clear: {
    arguments: {
      objectStoreName: O;
    };
    result: void[];
  }
  openCursor: {
    arguments: {
      objectStoreName: O;
      cursorCallback: (record: IndexedDBRecord<R>) => boolean;
    };
    result: IndexedDBRecord<R>[];
  }
}