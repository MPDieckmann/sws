class MPIDBKeyRanges<R extends MPIDBValidRecord> {
  #ranges: Map<string, MPIDBKeyRange> = new Map();

  lowerBound<K extends MPIDBKeyPath<R>>(keyPath: K, lower: MPIDBKeyPathToType<K, R>, lowerOpen?: boolean): this;
  // lowerBound(keyPath: string, lower: MPIDBValidRecord, lowerOpen?: boolean): this;
  lowerBound(keyPath: string, lower: MPIDBValidRecord, lowerOpen: boolean = false): this {
    this.#ranges.set(keyPath, IDBKeyRange.lowerBound(lower, lowerOpen));
    return this;
  }

  upperBound<K extends MPIDBKeyPath<R>>(keyPath: K, upper: MPIDBKeyPathToType<K, R>, upperOpen?: boolean): this;
  // upperBound(keyPath: string, upper: MPIDBValidRecord, upperOpen?: boolean): this;
  upperBound(keyPath: string, upper: MPIDBValidRecord, upperOpen: boolean = false): this {
    this.#ranges.set(keyPath, IDBKeyRange.upperBound(upper, upperOpen));
    return this;
  }

  bound<K extends MPIDBKeyPath<R>>(keyPath: K, lower: MPIDBKeyPathToType<K, R>, upper: MPIDBKeyPathToType<K, R>, lowerOpen?: boolean, upperOpen?: boolean): this;
  // bound(keyPath: string, lower: MPIDBValidRecord, upper: MPIDBValidRecord, lowerOpen?: boolean, upperOpen?: boolean): this;
  bound(keyPath: string, lower: MPIDBValidRecord, upper: MPIDBValidRecord, lowerOpen: boolean = false, upperOpen: boolean = false): this {
    this.#ranges.set(keyPath, IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen));
    return this;
  }

  only<K extends MPIDBKeyPath<R>>(keyPath: K, value: MPIDBKeyPathToType<K, R>, multiple?: false): this;
  only<K extends MPIDBKeyPath<R>>(keyPath: K, values: MPIDBKeyPathToType<K, R>[], multiple: true): this;
  // only(keyPath: string, value: MPIDBValidRecord, multiple?: false): this;
  // only(keyPath: string, values: MPIDBValidRecord[], multiple: true): this;
  only(keyPath: string, values: MPIDBValidRecord | MPIDBValidRecord[], multiple: boolean = false): this {
    this.#ranges.set(keyPath, {
      only: <MPIDBValidRecord[]>(multiple ? values : [values]),
      includes(key: MPIDBValidRecord) {
        return this.only.indexOf(key) > -1;
      }
    });
    return this;
  }

  custom<K extends MPIDBKeyPath<R>>(keyPath: K, callbackfn: (key: MPIDBKeyPathToType<K, R>, keyPath: K) => boolean): this;
  // custom(keyPath: string, callbackfn: (key: MPIDBValidRecord, keyPath: string) => boolean): this;
  custom(keyPath: string, callbackfn: (key: any, keyPath: string) => boolean): this {
    this.#ranges.set(keyPath, { includes: callbackfn });
    return this;
  }

  get rangesCount() {
    return this.#ranges.size;
  }

  ranges() {
    return this.#ranges.values();
  }

  forEach(callbackfn: <K extends MPIDBKeyPath<R>>(range: MPIDBKeyRange, keyPath: K, ranges: MPIDBKeyRanges<R>) => void, thisArg?: any): void;
  // forEach(callbackfn: (range: MPIDBKeyRange, keyPath: string, ranges: MPIDBKeyRanges<R>) => void, thisArg?: any): void;
  forEach(callbackfn: <K extends MPIDBKeyPath<R>>(range: MPIDBKeyRange, keyPath: K, ranges: MPIDBKeyRanges<R>) => void, thisArg: any = this): void {
    this.#ranges.forEach((range, keyPath) => callbackfn.call(thisArg, range, keyPath, this));
  }

  *[Symbol.iterator]() {
    return this.#ranges.values();
  }

  keyPathToValue<K extends MPIDBKeyPath<R>>(record: R, keyPath: K): MPIDBKeyPathToType<K, R>;
  keyPathToValue(record: MPIDBValidRecord, keyPath: string): MPIDBValidRecord;
  keyPathToValue(record: R, keyPath: string, baseKeyPath: string = keyPath): any {
    let splitted_keyPath = keyPath.split(".");
    let property = splitted_keyPath.shift();
    if (property in record == false) {
      throw new DOMException(`KeyPath does not match MPIDBValidRecord's structure: ${keyPath} of ${baseKeyPath} was not found in MPIDBValidRecord`, "KeyPath does not match MPIDBValidRecord's structure");
    }
    if (splitted_keyPath.length > 1) {
      // @ts-expect-error
      return this.keyPathToValue(record[property], splitted_keyPath.join("."), baseKeyPath);
    }
    return record[property];
  }

  includes(record: R): boolean {
    for (let [keyPath, range] of this.#ranges) {
      try {
        if (!range.includes(this.keyPathToValue(record, keyPath), keyPath)) {
          return false;
        }
      } catch (e) {
        if (e instanceof DOMException && e.name == "KeyPath does not match MPIDBValidRecord's structure") {
          return false;
        }
        throw e;
      }
    }
    return true;
  }
}

type MPIDBKeyRange = {
  readonly lower: MPIDBValidRecord;
  readonly upper: MPIDBValidRecord;
  readonly lowerOpen: boolean;
  readonly upperOpen: boolean;
  includes(key: MPIDBValidRecord): boolean;
} | {
  readonly only: MPIDBValidRecord[];
  includes(key: MPIDBValidRecord): boolean;
} | {
  includes(key: MPIDBValidRecord, keyPath: string): boolean;
};

type MPIDBKeyPath<E> = `${Extract<keyof E, string | number>}` | `${Extract<keyof PickByType<E, object>, string | number>}.${MPIDBKeyPath1<PickByType<E, object>[keyof PickByType<E, object>]>}`;
type MPIDBKeyPath1<E> = `${Extract<keyof E, string | number>}` | `${Extract<keyof PickByType<E, object>, string | number>}.${MPIDBKeyPath2<PickByType<E, object>[keyof PickByType<E, object>]>}`;
type MPIDBKeyPath2<E> = `${Extract<keyof E, string | number>}` | `${Extract<keyof PickByType<E, object>, string | number>}.${string}`;
