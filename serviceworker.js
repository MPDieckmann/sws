Number.prototype.toFloatingString = function (decimals) {
    let value = this.toString();
    if (decimals > 0) {
        let floatings = new Array(decimals).fill(0).join("");
        if (value.indexOf(".") > -1) {
            let split = value.split(".");
            if (split[1].length >= floatings.length) {
                return split[0] + "." + split[1].substr(0, floatings.length);
            }
            else {
                return value + floatings.substr(split[1].length);
            }
        }
        else {
            return value + "." + floatings;
        }
    }
    else {
        return value.split(".")[0];
    }
};
String.prototype.toRegExp = function (flags = "") {
    return new RegExp(this.replace(/([\\\/\[\]\{\}\?\*\+\.\^\$\(\)\:\=\!\|\,])/g, "\\$1"), flags);
};
String.prototype.escape = function (escapable = "", escapeWith) {
    return this.replace(new RegExp(escapable.replace(/([\\\/\[\]\{\}\?\*\+\.\^\$\(\)\:\=\!\|\,])/g, "\\$1"), "g"), escapeWith.replace(/([\\\/\[\]\{\}\?\*\+\.\^\$\(\)\:\=\!\|\,])/g, "\\$1") + "$1");
};
String.ESCAPE_REGEXP = "\\/[]{}?*+.^$():=!|,";
class MPCacheResponse {
    constructor(url) {
        this[Symbol.toStringTag] = "MPCacheResponse";
        this.#response = null;
        this.#getResponse = async () => {
            if (this.#response === null) {
                this.#response = await fetch(this.url);
            }
        };
        this.#url = url;
    }
    #response;
    #arrayBuffer;
    #blob;
    #formData;
    #json;
    #text;
    #url;
    get url() {
        return this.#url;
    }
    #getResponse;
    async arrayBuffer() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#arrayBuffer) {
            this.#arrayBuffer = await this.#response.clone().arrayBuffer();
        }
        return this.#arrayBuffer;
    }
    async blob() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#blob) {
            this.#blob = await this.#response.clone().blob();
        }
        return this.#blob;
    }
    async formData() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#formData) {
            this.#formData = await this.#response.clone().formData();
        }
        return this.#formData;
    }
    async json() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#json) {
            this.#json = await this.#response.clone().json();
        }
        return this.#json;
    }
    async text() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#text) {
            this.#text = await this.#response.clone().text();
        }
        return this.#text;
    }
    clone() {
        return new MPCacheResponse(this.#url);
    }
}
/**
 * Formatiert ein(e) angegebene(s) Ortszeit/Datum gemäß PHP 7
 * @param {string} string die Zeichenfolge, die umgewandelt wird
 * @param {number | string | Date} timestamp der zu verwendende Zeitpunkt
 * @return {string}
 */
function mpdate(string, timestamp = new Date) {
    var d = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
    var escaped = false;
    return string.split("").map(string => {
        if (!escaped && string == "\\") {
            escaped = true;
            return "";
        }
        else if (!escaped && string in mpdate._functions) {
            return mpdate._functions[string](d).toString();
        }
        else {
            escaped = false;
            return string;
        }
    }).join("");
}
(function (mpdate) {
    //@ts-ignore
    let i18n = self.i18n || ((text) => text.toString());
    /**
     * Überprüft, ob eine Zeichenkette ein gültiges Datum (nach dem angegebenen Datumsformat) darstellt
     *
     * @param date_string Die zu überprüfende Zeichenkette
     * @param format Das Datumsformat
     */
    function isValid(date_string, format = "Y-m-d") {
        return mpdate(format, date_string) == date_string;
    }
    mpdate.isValid = isValid;
    /**
     * Diese Zeichenfolgen werden von `date()` benutzt um die Wochentage darzustellen
     *
     * Sie werden von `i18n(weekdays[i] , "mpdate")` übersetzt
     */
    mpdate.weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];
    /**
     * Diese Zeichenfolgen werden von `date()` benutzt um die Monate darzustellen
     *
     * Sie werden von `i18n(months[i] , "mpdate")` übersetzt
     */
    mpdate.months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    /**
     * Gibt die aktuelle Zeit und Datum in Millisekunden aus.
     * @param {number | string | Date} timestamp Zahl oder `Date`-Objekt/Zeichenfolge um nicht die aktuelle Zeit zu verwenden
     * @return {number}
     */
    function time(timestamp = new Date) {
        var d = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
        return d.getTime();
    }
    mpdate.time = time;
    /**
     * Fügt einer Zahl eine führende 0 hinzu, wenn sie kleiner als 10 ist
     * @param {number} value Zahl, der eine führende 0 hinzugefügt werden soll
     * @return {string}
     * @private
     */
    function leadingZero(value) {
        return value < 10 ? "0" + value : value.toString();
    }
    // #region Tag
    /**
     * Die verwendeten Funktionen zur mwandlung der Buchstaben
     * @private
     */
    mpdate._functions = Object.create(null);
    /**
     * Tag des Monats, 2-stellig mit führender Null
     * 01 bis 31
     */
    mpdate._functions.d = date => {
        return leadingZero(date.getDate());
    };
    /**
     * Wochentag, gekürzt auf drei Buchstaben
     * Mon bis Sun
     */
    mpdate._functions.D = date => {
        return i18n(mpdate.weekdays[date.getDay()], "mpdate").substr(0, 3);
    };
    /**
     * Tag des Monats ohne führende Nullen
     * 1 bis 31
     */
    mpdate._functions.j = date => {
        return date.getDate();
    };
    /**
     * Ausgeschriebener Wochentag
     * Sunday bis Saturday
     */
    mpdate._functions.l = date => {
        return i18n(mpdate.weekdays[date.getDay()], "mpdate");
    };
    /**
     * Numerische Repräsentation des Wochentages gemäß ISO-8601 (in PHP 5.1.0 hinzugefügt)
     * 1 (für Montag) bis 7 (für Sonntag)
     */
    mpdate._functions.N = date => {
        return date.getDay() == 0 ? 7 : date.getDay();
    };
    /**
     * Anhang der englischen Aufzählung für einen Monatstag, zwei Zeichen
     * st, nd, rd oder th
     * Zur Verwendung mit j empfohlen.
     */
    mpdate._functions.S = date => {
        switch (date.getDate()) {
            case 1:
                return i18n("st", "mpdate");
            case 2:
                return i18n("nd", "mpdate");
            case 3:
                return i18n("rd", "mpdate");
            default:
                return i18n("th", "mpdate");
        }
    };
    /**
     * Numerischer Tag einer Woche
     * 0 (für Sonntag) bis 6 (für Samstag)
     */
    mpdate._functions.w = date => {
        return 7 == date.getDay() ? 0 : date.getDay();
    };
    /**
     * Der Tag des Jahres (von 0 beginnend)
     * 0 bis 366
     */
    mpdate._functions.z = date => {
        return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 864e5).toString();
    };
    // #endregion
    // #region Woche
    /**
     * Der Tag des Jahres (von 0 beginnend)
     * Beispiel: 42 (die 42. Woche im Jahr)
     */
    mpdate._functions.W = date => {
        var tmp_date = new Date(date.getTime() + 864e5 * (3 - (date.getDay() + 6) % 7));
        return Math.floor(1.5 + (tmp_date.getTime() - new Date(new Date(tmp_date.getFullYear(), 0, 4).getTime() + 864e5 * (3 - (new Date(tmp_date.getFullYear(), 0, 4).getDay() + 6) % 7)).getTime()) / 864e5 / 7);
    };
    // #endregion
    // #region Monat
    /**
     * Monat als ganzes Wort, wie January oder March
     * January bis December
     */
    mpdate._functions.F = date => {
        return i18n(mpdate.months[date.getMonth()], "mpdate");
    };
    /**
     * Monat als Zahl, mit führenden Nullen
     * 01 bis 12
     */
    mpdate._functions.m = date => {
        return leadingZero(date.getMonth() + 1);
    };
    /**
     * Monatsname mit drei Buchstaben
     * Jan bis Dec
     */
    mpdate._functions.M = date => {
        return i18n(mpdate.months[date.getMonth()], "mpdate").substr(0, 3);
    };
    /**
     * Monatszahl, ohne führende Nullen
     * 1 bis 12
     */
    mpdate._functions.n = date => {
        return date.getMonth() + 1;
    };
    /**
     * Anzahl der Tage des angegebenen Monats
     * 28 bis 31
     */
    mpdate._functions.t = date => {
        switch (date.getMonth()) {
            case 1:
                if (date.getFullYear() % 4 == 0 &&
                    date.getFullYear() % 100 != 0) {
                    return "29";
                }
                else {
                    return "28";
                }
            case 3:
            case 5:
            case 8:
            case 10:
                return "30";
            default:
                return "31";
        }
    };
    // #endregion
    // #region Jahr
    /**
     * Schaltjahr oder nicht
     * 1 für ein Schaltjahr, ansonsten 0
     */
    mpdate._functions.L = date => {
        return date.getFullYear() % 4 == 0 && date.getFullYear() % 100 != 0 ? 1 : 0;
    };
    /**
     * Jahreszahl der Kalenderwoche gemäß ISO-8601. Dies ergibt den gleichen Wert wie Y, außer wenn die ISO-Kalenderwoche (W) zum vorhergehenden oder nächsten Jahr gehört, wobei dann jenes Jahr verwendet wird (in PHP 5.1.0 hinzugefügt).
     * Beispiele: 1999 oder 2003
     */
    mpdate._functions.o = date => {
        var tmp_d = new Date(date.toISOString());
        tmp_d.setDate(date.getDate() - (date.getDay() == 0 ? 7 : date.getDay()) + 1);
        return tmp_d.getFullYear();
    };
    /**
     * Vierstellige Jahreszahl
     * Beispiele: 1999 oder 2003
     */
    mpdate._functions.Y = date => {
        return date.getFullYear();
    };
    /**
     * Jahreszahl, zweistellig
     * Beispiele: 99 oder 03
     */
    mpdate._functions.y = date => {
        var year = date.getFullYear().toString();
        return year.substr(year.length - 2, 2);
    };
    // #endregion
    // #region Uhrzeit
    /**
     * Kleingeschrieben: Ante meridiem (Vormittag) und Post meridiem (Nachmittag)
     * am oder pm
     */
    mpdate._functions.a = date => {
        if (date.getHours() > 12) {
            return i18n("pm", "mpdate");
        }
        return i18n("am", "mpdate");
    };
    /**
     * Großgeschrieben: Ante meridiem (Vormittag) und Post meridiem (Nachmittag)
     * AM oder PM
     */
    mpdate._functions.A = date => {
        if (date.getHours() > 12) {
            return i18n("PM", "mpdate");
        }
        return i18n("AM", "mpdate");
    };
    /**
     * Swatch-Internet-Zeit
     * 000 - 999
     */
    mpdate._functions.B = () => {
        console.error("date(): B is currently not supported");
        return "B";
    };
    /**
     * Stunde im 12-Stunden-Format, ohne führende Nullen
     * 1 bis 12
     */
    mpdate._functions.g = date => {
        return date.getHours() > 12 ? date.getHours() - 11 : date.getHours() + 1;
    };
    /**
     * Stunde im 24-Stunden-Format, ohne führende Nullen
     * 0 bis 23
     */
    mpdate._functions.G = date => {
        return date.getHours() + 1;
    };
    /**
     * Stunde im 12-Stunden-Format, mit führenden Nullen
     * 01 bis 12
     */
    mpdate._functions.h = date => {
        return leadingZero(date.getHours() > 12 ? date.getHours() - 11 : date.getHours() + 1);
    };
    /**
     * Stunde im 24-Stunden-Format, mit führenden Nullen
     * 00 bis 23
     */
    mpdate._functions.H = date => {
        return leadingZero(date.getHours() + 1);
    };
    /**
     * Minuten, mit führenden Nullen
     * 00 bis 59
     */
    mpdate._functions.i = date => {
        return leadingZero(date.getMinutes());
    };
    /**
     * Sekunden, mit führenden Nullen
     * 00 bis 59
     */
    mpdate._functions.s = date => {
        return leadingZero(date.getSeconds());
    };
    /**
     * Mikrosekunden (hinzugefügt in PHP 5.2.2). Beachten Sie, dass date() immer die Ausgabe 000000 erzeugen wird, da es einen Integer als Parameter erhält, wohingegen DateTime::format() Mikrosekunden unterstützt, wenn DateTime mit Mikrosekunden erzeugt wurde.
     * Beispiel: 654321
     */
    mpdate._functions.u = date => {
        return date.getMilliseconds();
    };
    /**
     * Millisekunden (hinzugefügt in PHP 7.0.0). Es gelten die selben Anmerkungen wie für u.
     * Example: 654
     */
    mpdate._functions.v = date => {
        return date.getMilliseconds();
    };
    // #endregion
    // #region Zeitzone
    mpdate._functions.e = () => {
        console.error("date(): e is currently not supported");
        return "e";
    };
    /**
     * Fällt ein Datum in die Sommerzeit
     * 1 bei Sommerzeit, ansonsten 0.
     */
    mpdate._functions.I = () => {
        console.error("date(): I is currently not supported");
        return "I";
    };
    /**
     * Zeitunterschied zur Greenwich time (GMT) in Stunden
     * Beispiel: +0200
     */
    mpdate._functions.O = () => {
        console.error("date(): O is currently not supported");
        return "O";
    };
    /**
     * Zeitunterschied zur Greenwich time (GMT) in Stunden mit Doppelpunkt zwischen Stunden und Minuten (hinzugefügt in PHP 5.1.3)
     * Beispiel: +02:00
     */
    mpdate._functions.P = () => {
        console.error("date(): P is currently not supported");
        return "P";
    };
    /**
     * Abkürzung der Zeitzone
     * Beispiele: EST, MDT ...
     */
    mpdate._functions.T = () => {
        console.error("date(): T is currently not supported");
        return "T";
    };
    /**
     * Offset der Zeitzone in Sekunden. Der Offset für Zeitzonen westlich von UTC ist immer negativ und für Zeitzonen östlich von UTC immer positiv.
     * -43200 bis 50400
     */
    mpdate._functions.Z = () => {
        console.error("date(): Z is currently not supported");
        return "Z";
    };
    // #endregion
    // #region Vollständige(s) Datum/Uhrzeit
    /**
     * ISO 8601 Datum (hinzugefügt in PHP 5)
     * 2004-02-12T15:19:21+00:00
     */
    mpdate._functions.c = () => {
        console.error("date(): c is currently not supported");
        return "c";
    };
    /**
     * Gemäß » RFC 2822 formatiertes Datum
     * Beispiel: Thu, 21 Dec 2000 16:01:07 +0200
     */
    mpdate._functions.r = () => {
        console.error("date(): r is currently not supported");
        return "r";
    };
    /**
     * Sekunden seit Beginn der UNIX-Epoche (January 1 1970 00:00:00 GMT)
     * Siehe auch time()
     */
    mpdate._functions.U = date => {
        return date.getTime();
    };
    //#endregion
})(mpdate || (mpdate = {}));
class MPIDBPromise {
    constructor(promise) {
        this.#idb = promise;
    }
    #idb;
    then(onfulfilled, onrejected) {
        this.#idb.then(onfulfilled, onrejected);
        return new MPIDBPromise((async () => await this.#idb)());
    }
    catch(onrejected) {
        this.#idb.catch(onrejected);
        return new MPIDBPromise((async () => await this.#idb)());
    }
    finally(onfinally) {
        this.#idb.finally(onfinally);
        return new MPIDBPromise((async () => await this.#idb)());
    }
    async add(args) {
        return (await this.#idb).add(args);
    }
    async count(args) {
        // @ts-expect-error
        return (await this.#idb).count(args);
    }
    async delete(args) {
        // @ts-expect-error
        return (await this.#idb).delete(args);
    }
    async get(args) {
        // @ts-expect-error
        return (await this.#idb).get(args);
    }
    async getKey(args) {
        // @ts-expect-error
        return (await this.#idb).getKey(args);
    }
    async index(objectStoreName, index) {
        return (await this.#idb).index(objectStoreName, index);
    }
    async objectStore(objectStoreName) {
        return (await this.#idb).objectStore(objectStoreName);
    }
    async openCursor(args, mode, callback) {
        // @ts-expect-error
        return (await this.#idb).openCursor(args, mode, callback);
    }
    async put(args) {
        return (await this.#idb).put(args);
    }
}
class MPIDB {
    constructor(indexedDB) {
        this[Symbol.toStringTag] = "MPIDB";
        this.#index = (objectStoreName, indexName, mode) => {
            return this.#objectStore(objectStoreName, mode).index(indexName);
        };
        this.#objectStore = (objectStoreName, mode) => {
            return this.#idb.transaction(objectStoreName, mode).objectStore(objectStoreName);
        };
        this.#openCursor = (args, mode, callback) => {
            return new Promise(async (resolve, reject) => {
                let request = ("indexName" in args && typeof args.indexName == "string"
                    ? this.#index(args.objectStoreName, args.indexName, mode)
                    : this.#objectStore(args.objectStoreName, mode)).openCursor("key" in args ? args.key : null, "direction" in args && typeof args.direction == "string" ? args.direction : "next");
                if ("limit" in args && typeof args.limit == "number" && args.limit > 0) {
                    let counts = 0;
                    let limit = args.limit;
                    request.addEventListener("success", "ranges" in args && args.ranges.length > 0
                        ? async () => {
                            let cursor = request.result;
                            counts++;
                            if (cursor) {
                                if (counts < limit &&
                                    args.ranges.filter(range => range.includes(cursor.value)).length > 0) {
                                    await callback(cursor);
                                }
                                cursor.continue();
                            }
                            else {
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
                            }
                            else {
                                resolve();
                            }
                        });
                }
                else {
                    request.addEventListener("success", "ranges" in args && args.ranges.length > 0
                        ? async () => {
                            let cursor = request.result;
                            if (cursor) {
                                if (args.ranges.filter(range => range.includes(cursor.value)).length > 0) {
                                    await callback(cursor);
                                }
                                cursor.continue();
                            }
                            else {
                                resolve();
                            }
                        }
                        : async () => {
                            let cursor = request.result;
                            if (cursor) {
                                await callback(cursor);
                                cursor.continue();
                            }
                            else {
                                resolve();
                            }
                        });
                }
                request.addEventListener("error", () => {
                    reject(request.error);
                });
            });
        };
        this.#awaitEvent = (target, resolveType, rejectType) => {
            return new Promise(function (resolve, reject) {
                function resolveCallback(event) {
                    resolve(event);
                    target.removeEventListener(resolveType, resolveCallback);
                    target.removeEventListener(rejectType, rejectCallback);
                }
                function rejectCallback(event) {
                    reject(event);
                    target.removeEventListener(resolveType, resolveCallback);
                    target.removeEventListener(rejectType, rejectCallback);
                }
                target.addEventListener(resolveType, resolveCallback, { once: true });
                target.addEventListener(rejectType, rejectCallback, { once: true });
            });
        };
        this.#idb = indexedDB;
        this.#name = indexedDB.name;
        this.#version = indexedDB.version;
        this.#objectStoreNames = indexedDB.objectStoreNames;
        this.#state = "open";
        this.#idb.addEventListener("abort", () => this.#state = "aborted");
        this.#idb.addEventListener("close", () => this.#state = "closed");
    }
    static open(name, version = null, objectStores = null) {
        return new MPIDBPromise(new Promise((resolve, reject) => {
            let request = version ? indexedDB.open(name, version) : indexedDB.open(name);
            request.addEventListener("success", () => resolve(new MPIDB(request.result)));
            if (objectStores) {
                request.addEventListener("upgradeneeded", () => {
                    let idb = request.result;
                    let objectStoreNames = Object.keys(objectStores).map(objectStoreName => {
                        let objectStoreDefinition = objectStores[objectStoreName];
                        let objectStore = null;
                        if (idb.objectStoreNames.contains(objectStoreName)) {
                            let oldObjectStore = idb.transaction(objectStoreName, "readonly").objectStore(objectStoreName);
                            if (oldObjectStore.autoIncrement != objectStoreDefinition.autoIncrement ||
                                oldObjectStore.keyPath != objectStoreDefinition.keyPath) {
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
                                if (oldIndex.keyPath !== indexDefinition.keyPath &&
                                    oldIndex.multiEntry !== indexDefinition.multiEntry &&
                                    oldIndex.unique !== indexDefinition.unique) {
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
    #idb;
    #name;
    #version;
    #objectStoreNames;
    #state;
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
    #index;
    #objectStore;
    #openCursor;
    #awaitEvent;
    // async add<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; record: Init[O]["Records"]; }): Promise<MPIDBValidKey>;
    // async add<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; keys?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]; records: Init[O]["Records"][]; }): Promise<MPIDBValidKey[]>;
    async add(args) {
        let objectStore = this.#objectStore(args.objectStoreName, "readwrite");
        if ("keys" in args && args.keys.length == args.records.length) {
            let i = 0;
            let l = args.records.length;
            let keys = [];
            for (i; i < l; i++) {
                keys.push((await this.#awaitEvent(objectStore.add(args.records[i], args.keys[i]), "success", "error")).target.result);
            }
            return keys;
        }
        else if ("records" in args) {
            let i = 0;
            let l = args.records.length;
            let keys = [];
            for (i; i < l; i++) {
                keys.push((await this.#awaitEvent(objectStore.add(args.records[i]), "success", "error")).target.result);
            }
            return keys;
        }
        else if ("key" in args) {
            return (await this.#awaitEvent(objectStore.add(args.record, args.key), "success", "error")).target.result;
        }
        else {
            return (await this.#awaitEvent(objectStore.add(args.record), "success", "error")).target.result;
        }
    }
    async count(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = 0;
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && void results++
                : () => void results++);
            return results;
        }
        else {
            return (await this.#awaitEvent(("indexName" in args && typeof args.indexName == "string"
                ? this.#index(args.objectStoreName, args.indexName, "readonly")
                : this.#objectStore(args.objectStoreName, "readonly")).count("key" in args ? args.key : null), "success", "error")).target.result;
        }
    }
    async delete(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function") ||
            ("indexName" in args && typeof args.indexName == "string")) {
            await this.#openCursor(args, "readwrite", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && await this.#awaitEvent(cursor.delete(), "success", "error")
                : async (cursor) => void await this.#awaitEvent(cursor.delete(), "success", "error"));
        }
        else {
            let objectStore = this.#objectStore(args.objectStoreName, "readwrite");
            let request;
            if ("key" in args) {
                request = objectStore.delete(args.key);
            }
            else {
                request = objectStore.clear();
            }
            await this.#awaitEvent(request, "success", "error");
        }
        return null;
    }
    async get(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = [];
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && results.push(cursor.value)
                : cursor => void results.push(cursor.value));
            return results;
        }
        else {
            return (await this.#awaitEvent(("indexName" in args && typeof args.indexName == "string"
                ? this.#index(args.objectStoreName, args.indexName, "readonly")
                : this.#objectStore(args.objectStoreName, "readonly")).getAll("key" in args ? args.key : null, "limit" in args ? args.limit : 0), "success", "error")).target.result;
        }
    }
    async getKey(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = [];
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && results.push(cursor.key)
                : cursor => void results.push(cursor.key));
            return results;
        }
        else {
            return (await this.#awaitEvent(("indexName" in args && typeof args.indexName == "string"
                ? this.#index(args.objectStoreName, args.indexName, "readonly")
                : this.#objectStore(args.objectStoreName, "readonly")).getAllKeys("key" in args ? args.key : null, "limit" in args ? args.limit : 0), "success", "error")).target.result;
        }
    }
    index(objectStoreName, index) {
        return new MPIDBIndex(this.#index(objectStoreName, index, "readonly"));
    }
    objectStore(objectStoreName) {
        return new MPIDBObjectStore(this.#objectStore(objectStoreName, "readonly"));
    }
    async openCursor(args, mode, callback) {
        await this.#openCursor(args, mode, "cursor" in args && typeof args.cursor == "function"
            ? async (cursor) => await args.cursor(cursor.value) && await callback(cursor)
            : async (cursor) => void await callback(cursor));
        return null;
    }
    // async put<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; key?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>; record: Init[O]["Records"]; }): Promise<MPIDBValidKey>;
    // async put<O extends Extract<keyof Init, string>>(args: { objectStoreName: O; keys?: MPIDBKeyPathToType<Init[O]["KeyPath"], Init[O]["Records"]>[]; records: Init[O]["Records"][]; }): Promise<MPIDBValidKey[]>;
    // async put<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; key?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>; record: Init[O]["Records"]; }): Promise<MPIDBValidKey>;
    // async put<O extends Extract<keyof Init, string>, I extends Extract<keyof Init[O]["Indices"], string>>(args: { objectStoreName: O; indexName: I; keys?: MPIDBKeyPathToType<Init[O]["Indices"][I], Init[O]["Records"]>[]; records: Init[O]["Records"][]; }): Promise<MPIDBValidKey[]>;
    async put(args) {
        let objectStore = this.#objectStore(args.objectStoreName, "readwrite");
        console.warn("Support for updating by indexName is missing");
        if ("keys" in args && args.keys.length == args.records.length) {
            let i = 0;
            let l = args.records.length;
            let keys = [];
            for (i; i < l; i++) {
                keys.push((await this.#awaitEvent(objectStore.put(args.records[i], args.keys[i]), "success", "error")).target.result);
            }
            return keys;
        }
        else if ("records" in args) {
            let i = 0;
            let l = args.records.length;
            let keys = [];
            for (i; i < l; i++) {
                keys.push((await this.#awaitEvent(objectStore.put(args.records[i]), "success", "error")).target.result);
            }
            return keys;
        }
        else if ("key" in args) {
            return (await this.#awaitEvent(objectStore.put(args.record, args.key), "success", "error")).target.result;
        }
        else {
            return (await this.#awaitEvent(objectStore.put(args.record), "success", "error")).target.result;
        }
    }
}
class MPIDBIndex {
    constructor(index) {
        this[Symbol.toStringTag] = "MPIDBIndex";
        this.#index = (mode) => {
            let objectStore = this.#idb.transaction(this.#objectStoreName, mode).objectStore(this.#objectStoreName);
            this.#objectStoreIndexNames = objectStore.indexNames;
            return objectStore.index(this.#name);
        };
        this.#openCursor = (args, mode, callback) => {
            return new Promise(async (resolve, reject) => {
                let request = (this.#index(mode)).openCursor("key" in args ? args.key : null, "direction" in args && typeof args.direction == "string" ? args.direction : "next");
                if ("limit" in args && typeof args.limit == "number" && args.limit > 0) {
                    let counts = 0;
                    let limit = args.limit;
                    request.addEventListener("success", "ranges" in args && args.ranges.length > 0
                        ? async () => {
                            let cursor = request.result;
                            counts++;
                            if (cursor) {
                                if (counts < limit &&
                                    args.ranges.filter(range => range.includes(cursor.value)).length > 0) {
                                    await callback(cursor);
                                }
                                cursor.continue();
                            }
                            else {
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
                            }
                            else {
                                resolve();
                            }
                        });
                }
                else {
                    request.addEventListener("success", "ranges" in args && args.ranges.length > 0
                        ? async () => {
                            let cursor = request.result;
                            if (cursor) {
                                if (args.ranges.filter(range => range.includes(cursor.value)).length > 0) {
                                    await callback(cursor);
                                }
                                cursor.continue();
                            }
                            else {
                                resolve();
                            }
                        }
                        : async () => {
                            let cursor = request.result;
                            if (cursor) {
                                await callback(cursor);
                                cursor.continue();
                            }
                            else {
                                resolve();
                            }
                        });
                }
                request.addEventListener("error", () => {
                    reject(request.error);
                });
            });
        };
        this.#awaitEvent = (target, resolveType, rejectType) => {
            return new Promise(function (resolve, reject) {
                function resolveCallback(event) {
                    resolve(event);
                    target.removeEventListener(resolveType, resolveCallback);
                    target.removeEventListener(rejectType, rejectCallback);
                }
                function rejectCallback(event) {
                    reject(event);
                    target.removeEventListener(resolveType, resolveCallback);
                    target.removeEventListener(rejectType, rejectCallback);
                }
                target.addEventListener(resolveType, resolveCallback, { once: true });
                target.addEventListener(rejectType, rejectCallback, { once: true });
            });
        };
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
    #idb;
    #name;
    #keyPath;
    #multiEntry;
    #unique;
    #objectStoreName;
    #objectStoreAutoIncrement;
    #objectStoreKeyPath;
    #objectStoreIndexNames;
    #databaseName;
    #databaseVersion;
    #databaseObjectStoreNames;
    #state;
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
    #index;
    #openCursor;
    #awaitEvent;
    async count(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = 0;
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && void results++
                : () => void results++);
            return results;
        }
        else {
            return (await this.#awaitEvent(this.#index("readonly").count("key" in args ? args.key : null), "success", "error")).target.result;
        }
    }
    async delete(args) {
        await this.#openCursor(args, "readwrite", "cursor" in args && typeof args.cursor == "function"
            ? async (cursor) => await args.cursor(cursor.value) && await this.#awaitEvent(cursor.delete(), "success", "error")
            : async (cursor) => void await this.#awaitEvent(cursor.delete(), "success", "error"));
        return null;
    }
    async get(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = [];
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && results.push(cursor.value)
                : cursor => void results.push(cursor.value));
            return results;
        }
        else {
            return (await this.#awaitEvent(this.#index("readonly").getAll("key" in args ? args.key : null, "limit" in args ? args.limit : 0), "success", "error")).target.result;
        }
    }
    async getKey(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = [];
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && results.push(cursor.key)
                : cursor => void results.push(cursor.key));
            return results;
        }
        else {
            return (await this.#awaitEvent(this.#index("readonly").getAllKeys("key" in args ? args.key : null, "limit" in args ? args.limit : 0), "success", "error")).target.result;
        }
    }
    async openCursor(args, mode, callback) {
        await this.#openCursor(args, mode, "cursor" in args && typeof args.cursor == "function"
            ? async (cursor) => await args.cursor(cursor.value) && await callback(cursor)
            : async (cursor) => void await callback(cursor));
        return null;
    }
}
class MPIDBKeyRanges {
    constructor() {
        this.#ranges = new Map();
    }
    #ranges;
    // lowerBound(keyPath: string, lower: MPIDBValidRecord, lowerOpen?: boolean): this;
    lowerBound(keyPath, lower, lowerOpen = false) {
        this.#ranges.set(keyPath, IDBKeyRange.lowerBound(lower, lowerOpen));
        return this;
    }
    // upperBound(keyPath: string, upper: MPIDBValidRecord, upperOpen?: boolean): this;
    upperBound(keyPath, upper, upperOpen = false) {
        this.#ranges.set(keyPath, IDBKeyRange.upperBound(upper, upperOpen));
        return this;
    }
    // bound(keyPath: string, lower: MPIDBValidRecord, upper: MPIDBValidRecord, lowerOpen?: boolean, upperOpen?: boolean): this;
    bound(keyPath, lower, upper, lowerOpen = false, upperOpen = false) {
        this.#ranges.set(keyPath, IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen));
        return this;
    }
    // only(keyPath: string, value: MPIDBValidRecord, multiple?: false): this;
    // only(keyPath: string, values: MPIDBValidRecord[], multiple: true): this;
    only(keyPath, values, multiple = false) {
        this.#ranges.set(keyPath, {
            only: (multiple ? values : [values]),
            includes(key) {
                return this.only.indexOf(key) > -1;
            }
        });
        return this;
    }
    // custom(keyPath: string, callbackfn: (key: MPIDBValidRecord, keyPath: string) => boolean): this;
    custom(keyPath, callbackfn) {
        this.#ranges.set(keyPath, { includes: callbackfn });
        return this;
    }
    get rangesCount() {
        return this.#ranges.size;
    }
    ranges() {
        return this.#ranges.values();
    }
    // forEach(callbackfn: (range: MPIDBKeyRange, keyPath: string, ranges: MPIDBKeyRanges<R>) => void, thisArg?: any): void;
    forEach(callbackfn, thisArg = this) {
        this.#ranges.forEach((range, keyPath) => callbackfn.call(thisArg, range, keyPath, this));
    }
    *[Symbol.iterator]() {
        return this.#ranges.values();
    }
    keyPathToValue(record, keyPath, baseKeyPath = keyPath) {
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
    includes(record) {
        for (let [keyPath, range] of this.#ranges) {
            try {
                if (!range.includes(this.keyPathToValue(record, keyPath), keyPath)) {
                    return false;
                }
            }
            catch (e) {
                if (e instanceof DOMException && e.name == "KeyPath does not match MPIDBValidRecord's structure") {
                    return false;
                }
                throw e;
            }
        }
        return true;
    }
}
class MPIDBObjectStore {
    constructor(objectStore) {
        this[Symbol.toStringTag] = "MPIDBObjectStore";
        this.#index = (indexName, mode) => {
            return this.#objectStore(mode).index(indexName);
        };
        this.#objectStore = (mode) => {
            let objectStore = this.#idb.transaction(this.#name, mode).objectStore(this.#name);
            this.#indexNames = objectStore.indexNames;
            return objectStore;
        };
        this.#openCursor = (args, mode, callback) => {
            return new Promise(async (resolve, reject) => {
                let request = ("indexName" in args && typeof args.indexName == "string"
                    ? this.#index(args.indexName, mode)
                    : this.#objectStore(mode)).openCursor("key" in args ? args.key : null, "direction" in args && typeof args.direction == "string" ? args.direction : "next");
                if ("limit" in args && typeof args.limit == "number" && args.limit > 0) {
                    let counts = 0;
                    let limit = args.limit;
                    request.addEventListener("success", "ranges" in args && args.ranges.length > 0
                        ? async () => {
                            let cursor = request.result;
                            counts++;
                            if (cursor) {
                                if (counts < limit &&
                                    args.ranges.filter(range => range.includes(cursor.value)).length > 0) {
                                    await callback(cursor);
                                }
                                cursor.continue();
                            }
                            else {
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
                            }
                            else {
                                resolve();
                            }
                        });
                }
                else {
                    request.addEventListener("success", "ranges" in args && args.ranges.length > 0
                        ? async () => {
                            let cursor = request.result;
                            if (cursor) {
                                if (args.ranges.filter(range => range.includes(cursor.value)).length > 0) {
                                    await callback(cursor);
                                }
                                cursor.continue();
                            }
                            else {
                                resolve();
                            }
                        }
                        : async () => {
                            let cursor = request.result;
                            if (cursor) {
                                await callback(cursor);
                                cursor.continue();
                            }
                            else {
                                resolve();
                            }
                        });
                }
                request.addEventListener("error", () => {
                    reject(request.error);
                });
            });
        };
        this.#awaitEvent = (target, resolveType, rejectType) => {
            return new Promise(function (resolve, reject) {
                function resolveCallback(event) {
                    resolve(event);
                    target.removeEventListener(resolveType, resolveCallback);
                    target.removeEventListener(rejectType, rejectCallback);
                }
                function rejectCallback(event) {
                    reject(event);
                    target.removeEventListener(resolveType, resolveCallback);
                    target.removeEventListener(rejectType, rejectCallback);
                }
                target.addEventListener(resolveType, resolveCallback, { once: true });
                target.addEventListener(rejectType, rejectCallback, { once: true });
            });
        };
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
    #idb;
    #name;
    #autoIncrement;
    #keyPath;
    #indexNames;
    #databaseName;
    #databaseVersion;
    #databaseObjectStoreNames;
    #state;
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
    #index;
    #objectStore;
    #openCursor;
    #awaitEvent;
    async add(args) {
        let objectStore = this.#objectStore("readwrite");
        if ("keys" in args && args.keys.length == args.records.length) {
            let i = 0;
            let l = args.records.length;
            let keys = [];
            for (i; i < l; i++) {
                keys.push((await this.#awaitEvent(objectStore.add(args.records[i], args.keys[i]), "success", "error")).target.result);
            }
            return keys;
        }
        else if ("records" in args) {
            let i = 0;
            let l = args.records.length;
            let keys = [];
            for (i; i < l; i++) {
                keys.push((await this.#awaitEvent(objectStore.add(args.records[i]), "success", "error")).target.result);
            }
            return keys;
        }
        else if ("key" in args) {
            return (await this.#awaitEvent(objectStore.add(args.record, args.key), "success", "error")).target.result;
        }
        else {
            return (await this.#awaitEvent(objectStore.add(args.record), "success", "error")).target.result;
        }
    }
    async count(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = 0;
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && void results++
                : () => void results++);
            return results;
        }
        else {
            return (await this.#awaitEvent(("indexName" in args && typeof args.indexName == "string"
                ? this.#index(args.indexName, "readonly")
                : this.#objectStore("readonly")).count("key" in args ? args.key : null), "success", "error")).target.result;
        }
    }
    async delete(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function") ||
            ("indexName" in args && typeof args.indexName == "string")) {
            await this.#openCursor(args, "readwrite", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && await this.#awaitEvent(cursor.delete(), "success", "error")
                : async (cursor) => void await this.#awaitEvent(cursor.delete(), "success", "error"));
        }
        else {
            let objectStore = this.#objectStore("readwrite");
            let request;
            if ("key" in args) {
                request = objectStore.delete(args.key);
            }
            else {
                request = objectStore.clear();
            }
            await this.#awaitEvent(request, "success", "error");
        }
        return null;
    }
    async get(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = [];
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && results.push(cursor.value)
                : cursor => void results.push(cursor.value));
            return results;
        }
        else {
            return (await this.#awaitEvent(("indexName" in args && typeof args.indexName == "string"
                ? this.#index(args.indexName, "readonly")
                : this.#objectStore("readonly")).getAll("key" in args ? args.key : null, "limit" in args ? args.limit : 0), "success", "error")).target.result;
        }
    }
    async getKey(args) {
        if (("ranges" in args && args.ranges.length > 0) ||
            ("cursor" in args && typeof args.cursor == "function")) {
            let results = [];
            await this.#openCursor(args, "readonly", "cursor" in args && typeof args.cursor == "function"
                ? async (cursor) => await args.cursor(cursor.value) && results.push(cursor.key)
                : cursor => void results.push(cursor.key));
            return results;
        }
        else {
            return (await this.#awaitEvent(("indexName" in args && typeof args.indexName == "string"
                ? this.#index(args.indexName, "readonly")
                : this.#objectStore("readonly")).getAllKeys("key" in args ? args.key : null, "limit" in args ? args.limit : 0), "success", "error")).target.result;
        }
    }
    index(index) {
        return new MPIDBIndex(this.#index(index, "readonly"));
    }
    async openCursor(args, mode, callback) {
        await this.#openCursor(args, mode, "cursor" in args && typeof args.cursor == "function"
            ? async (cursor) => await args.cursor(cursor.value) && await callback(cursor)
            : async (cursor) => void await callback(cursor));
        return null;
    }
    async put(args) {
        let objectStore = this.#objectStore("readwrite");
        if ("keys" in args && args.keys.length == args.records.length) {
            let i = 0;
            let l = args.records.length;
            let keys = [];
            for (i; i < l; i++) {
                keys.push((await this.#awaitEvent(objectStore.add(args.records[i], args.keys[i]), "success", "error")).target.result);
            }
            return keys;
        }
        else if ("records" in args) {
            let i = 0;
            let l = args.records.length;
            let keys = [];
            for (i; i < l; i++) {
                keys.push((await this.#awaitEvent(objectStore.add(args.records[i]), "success", "error")).target.result);
            }
            return keys;
        }
        else if ("key" in args) {
            return (await this.#awaitEvent(objectStore.add(args.record, args.key), "success", "error")).target.result;
        }
        else {
            return (await this.#awaitEvent(objectStore.add(args.record), "success", "error")).target.result;
        }
    }
}
/// <reference path="helper.ts" />
/// <reference path="mpidbopenpromise.ts" />
/// <reference path="mpidb.ts" />
/// <reference path="mpidbindex.ts" />
/// <reference path="mpidbkeyranges.ts" />
/// <reference path="mpidbobjectstore.ts" />
class ServerEvent extends Event {
    constructor(type, eventInitDict) {
        super(type, eventInitDict);
        this.#group = eventInitDict.group || null;
        this.#data = eventInitDict.data || null;
    }
    #group;
    get group() {
        return this.#group;
    }
    #data;
    get data() {
        return this.#data;
    }
    /** @deprecated */
    initServerEvent(type, bubbles, cancelable, group, data) {
        super.initEvent(type, bubbles, cancelable);
        this.#group = group;
        this.#data = data;
    }
}
class Server extends EventTarget {
    constructor() {
        super();
        this.#cacheName = location.href;
        this.#scope = registration.scope.replace(/\/$/, "");
        this.#regex_safe_scope = this.#scope.escape(String.ESCAPE_REGEXP, "\\");
        this.#online = navigator.onLine;
        this.#idb = MPIDB.open(location.href, 1, {
            settings: {
                name: "settings",
                autoIncrement: false,
                keyPath: "key",
                indices: {}
            },
            routes: {
                name: "routes",
                autoIncrement: true,
                keyPath: null,
                indices: {
                    by_priority: { name: "by_priority", keyPath: "priority", multiEntry: false, unique: false },
                    by_string: { name: "by_string", keyPath: "string", multiEntry: false, unique: false },
                    by_key: { name: "by_key", keyPath: "key", multiEntry: false, unique: false },
                    by_function: { name: "by_function", keyPath: "function", multiEntry: false, unique: false },
                    by_storage: { name: "by_storage", keyPath: "storage", multiEntry: false, unique: false }
                }
            },
            log: {
                name: "log",
                autoIncrement: true,
                keyPath: "id",
                indices: {
                    by_type: { name: "by_type", keyPath: "type", multiEntry: false, unique: false }
                }
            },
            assets: {
                name: "assets",
                keyPath: "id",
                autoIncrement: false,
                indices: {}
            }
        });
        this.#loadedScripts = new Map([
            [null, null]
        ]);
        this.#loadScript = async (id) => {
            if (!this.#loadedScripts.has(id)) {
                let assets = await this.#idb.get({
                    objectStoreName: "assets",
                    key: id
                });
                if (assets.length > 0) {
                    let blob = assets[0].blob;
                    if (/(text|application)\/javascript/.test(blob.type)) {
                        let result = await eval.call(self, await blob.text());
                        this.#loadedScripts.set(id, result);
                    }
                    else {
                        throw new DOMException(`Failed to load script: ${id}\nScripts mime type is not supported.`, `UnsupportedMimeType`);
                    }
                }
                else {
                    throw new DOMException(`Failed to load script: ${id}\nScript not found.`, `FileNotFound`);
                }
            }
            return this.#loadedScripts.get(id);
        };
        this.#settings = new Map();
        this.#settingsListenerMap = new Map();
        this.#log = async (type, message, stack) => {
            await this.#idb.put({
                objectStoreName: "log",
                record: {
                    timestamp: Date.now(),
                    type,
                    message,
                    stack
                }
            });
        };
        this.#responseFunctions = new Map();
        this.#ononline = null;
        this.#onoffline = null;
        this.#onconnected = null;
        this.#ondisconnected = null;
        this.#onbeforeinstall = null;
        this.#oninstall = null;
        this.#onafterinstall = null;
        this.#onbeforeupdate = null;
        this.#onupdate = null;
        this.#onafterupdate = null;
        this.#onbeforeactivate = null;
        this.#onactivate = null;
        this.#onafteractivate = null;
        this.#onbeforefetch = null;
        this.#onfetch = null;
        this.#onafterfetch = null;
        this.#onbeforestart = null;
        this.#onstart = null;
        this.#onafterstart = null;
        this.#onbeforemessage = null;
        this.#onmessage = null;
        this.#onaftermessage = null;
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
            }
            else {
                if (navigator.onLine != this.#online) {
                    this.#online = navigator.onLine;
                    this.dispatchEvent(new ServerEvent(this.#online ? "online" : "offline", { cancelable: false, group: "network", data: null }));
                }
            }
        });
        navigator.connection.addEventListener("change", () => {
            if (!this.getSetting("offline-mode") &&
                navigator.onLine != this.#online) {
                this.#online = navigator.onLine;
                this.dispatchEvent(new ServerEvent(this.#online ? "online" : "offline", { cancelable: false, group: "network", data: null }));
            }
        });
        addEventListener("install", event => event.waitUntil(this.install()));
        addEventListener("message", event => event.waitUntil(this.message(event.data, event.source)));
        addEventListener("activate", event => event.waitUntil(this.activate()));
        addEventListener("fetch", event => event.respondWith(this.fetch(event.request)));
        let _resolve;
        this.#start = new Promise(resolve => _resolve = resolve);
        this.#start.resolve = _resolve;
        this.ready = (async () => {
            this.#idb = await this.#idb;
            await Promise.all((await this.#idb.get({ objectStoreName: "settings" })).map(async (record) => {
                this.#settings.set(record.key, record.value);
                if (this.#settingsListenerMap.has(record.key)) {
                    await this.#settingsListenerMap.get(record.key)(record.value, record.value);
                }
            }));
            await this.#idb.put({
                objectStoreName: "routes",
                record: {
                    priority: 0,
                    type: "string",
                    string: this.#scope + "/serviceworker.js",
                    ignoreCase: true,
                    storage: "cache",
                    key: (this.#scope + "/serviceworker.js")
                }
            });
            let promises = [];
            this.dispatchEvent(new ServerEvent("beforestart", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
            await Promise.all(promises);
            await this.#start;
            this.dispatchEvent(new ServerEvent("afterstart", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
            await Promise.all(promises);
            return this;
        })();
        this.registerResponseFunction("redirect", {}, (_request, _files, args) => {
            return new Response("", {
                headers: {
                    Location: args[0]
                },
                status: 302,
                statusText: "Found"
            });
        });
    }
    #version;
    #cacheName;
    #scope;
    #regex_safe_scope;
    #online;
    #idb;
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
    #start;
    #loadedScripts;
    #loadScript;
    async install() {
        console.log("server called 'install'", { this: this });
        let promises = [];
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
        console.log("server finished 'install'", { this: this });
    }
    async update() {
        console.log("server called 'update'", { this: this });
        let promises = [];
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
            await Promise.all((await this.#idb.get({
                objectStoreName: "routes",
                indexName: "by_storage",
                key: "cache",
            })).map((route) => cache.add(route.key)));
            await Promise.all((await this.#idb.get({
                objectStoreName: "routes",
                indexName: "by_storage",
                key: "static",
            })).map(async (route) => {
                if (route.key.startsWith("local://")) {
                    return;
                }
                await this.registerAsset(route.key, await (await globalThis.fetch(route.key)).blob());
            }));
            (await caches.open(this.#cacheName)).add(location.href);
            await this.registerAsset("local://null", new Blob(["server.log('script local://null loaded');"], { type: "application/javascript" }));
            this.log("Dateien erfolgreich in den Cache geladen");
            this.dispatchEvent(new ServerEvent("afterupdate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
            await Promise.all(promises);
            console.log("server finished 'update'", { this: this });
            return true;
        }
        catch (e) {
            this.error(e.message, e.stack);
            console.error("server failed 'update'", { this: this, error: e });
            return false;
        }
    }
    async activate() {
        console.log("server called 'activate'", { this: this });
        let promises = [];
        this.dispatchEvent(new ServerEvent("beforeactivate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
        await Promise.all(promises);
        promises.splice(0, promises.length);
        let response = await (await caches.open(this.#cacheName)).match(location.href);
        this.#version = response ? mpdate("Y.md.Hi", response.headers.get("Date")) : "Failed to get version.";
        await this.ready;
        this.dispatchEvent(new ServerEvent("activate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
        await Promise.all(promises);
        promises.splice(0, promises.length);
        await clients.claim();
        this.log("Serviceworker erfolgreich aktiviert (Version: " + this.#version + ")");
        this.dispatchEvent(new ServerEvent("afteractivate", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
        await Promise.all(promises);
        console.log("server finished 'activate'", { this: this });
    }
    async start() {
        console.log("server called 'start'", { this: this });
        let promises = [];
        this.dispatchEvent(new ServerEvent("start", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
        await Promise.all(promises);
        this.#start.resolve(null);
        console.log("server finished 'start'", { this: this });
    }
    async fetch(input, init) {
        // console.log("server called 'fetch'", { server, routes: this.#routes, arguments });
        let response = null;
        let respondWithResponse = null;
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
            let routes = await this.#idb.get({
                objectStoreName: "routes",
                async cursor(route) {
                    return (route.type == "string" && ((route.ignoreCase && route.string.toLowerCase() == request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1").toLowerCase()) ||
                        (!route.ignoreCase && route.string == request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1")))) || (route.type == "regexp" && route.regexp.test(request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1")));
                }
            });
            if (routes.length < 0) {
                throw "File not cached: " + request.url;
            }
            response = null;
            let index = routes.length;
            let hasError = false;
            while (response === null &&
                index > 0) {
                index--;
                let route = routes[index];
                if (route.storage == "cache") {
                    response = await (await caches.open(this.#cacheName)).match(route.key);
                    if (!response) {
                        this.error(`File not cached: '${request.url}'`, `Redirected to cache: '${route.key}'.`);
                        hasError = true;
                        response = null;
                    }
                }
                else if (route.storage == "static") {
                    let assets = await this.#idb.get({ objectStoreName: "assets", key: route.key });
                    if (assets.length > 0) {
                        response = new Response(assets[0].blob);
                    }
                    else {
                        this.error(`File not stored: '${request.url}'`, `Redirected to indexedDB: '${route.key}'.`);
                        hasError = true;
                    }
                }
                else if (route.storage == "dynamic") {
                    await this.#loadScript(route.script).catch((e) => {
                        this.error(e.message, e.stack);
                        hasError = true;
                    });
                    if (this.#responseFunctions.has(route.function)) {
                        try {
                            let files = {};
                            let responseFunctionDefinition = this.#responseFunctions.get(route.function);
                            Object.keys(responseFunctionDefinition.assets).map(key => {
                                files[key] = new MPCacheResponse(responseFunctionDefinition.assets[key]);
                            });
                            response = await responseFunctionDefinition.responseFunction(request, files, route.arguments);
                        }
                        catch (error) {
                            this.error(error);
                            hasError = true;
                            response = null;
                        }
                        ;
                    }
                    else {
                        this.error(`Failed to execute response function for '${request.url}'`, `Redirected to function '${route.function}' in script '${route.script}'.`);
                        hasError = true;
                    }
                }
                else {
                    this.error(`Unknown storage type: '${route.storage}'`);
                    hasError = true;
                }
            }
            if (response) {
                if (hasError) {
                    let route = routes[index];
                    if (route.storage == "dynamic") {
                        this.log(`File served with function`, `Redirected to function '${route.function}' in script '${route.script}'.`);
                    }
                    else {
                        this.log(`File served as ${route.storage}`, `Redirected to ${route.storage == "cache" ? "cache" : "indexedDB"}: '${route.key}'.`);
                    }
                }
            }
            else {
                if (hasError) {
                    response = await this.errorResponse("Error 500: Internal Server Error\nSee log for more info", {
                        status: 500,
                        statusText: "Internal Server Error"
                    });
                }
                else {
                    response = await this.errorResponse("Error 404: Not found\nSee log for more info", {
                        status: 404,
                        statusText: "Not Found."
                    });
                }
            }
        }
        catch (error) {
            this.error(error);
            response = await this.errorResponse(error, {
                status: 500,
                statusText: "Internal Server Error",
            });
        }
        this.dispatchEvent(new ServerEvent("afterfetch", { cancelable: false, group: "fetch", data: { url: typeof input == "string" ? input : input.url, request, response, respondWith(r) { respondWithResponse = r; } } }));
        respondWithResponse && (response = (await respondWithResponse).clone());
        return response;
    }
    async message(message, source) {
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
    #settings;
    #settingsListenerMap;
    getSetting(key) {
        return this.#settings.get(key);
    }
    async setSetting(key, value) {
        let old_value = this.#settings.get(key);
        this.#settings.set(key, value);
        if (this.#settingsListenerMap.has(key)) {
            await this.#settingsListenerMap.get(key)(old_value, value);
        }
        await this.#idb.put({ objectStoreName: "settings", record: { key, value } });
    }
    #log;
    async log(message, stack = null) {
        console.log(message, stack);
        await this.#log("log", message, stack);
    }
    async warn(message, stack = null) {
        console.warn(message, stack);
        await this.#log("warn", message, stack);
    }
    async error(message, stack = null) {
        console.error(message, stack);
        await this.#log("error", message, stack);
    }
    async clearLog() {
        await this.#idb.delete({
            objectStoreName: "log"
        });
        this.#log("clear", "Das Protokoll wurde erfolgreich gelöscht", null);
        console.clear();
    }
    async getLog(types = {
        log: true,
        warn: true,
        error: true
    }) {
        if (types.log && types.warn && types.error) {
            return this.#idb.get({
                objectStoreName: "log"
            });
        }
        else {
            let type_array = [];
            types.log && type_array.push("log");
            types.warn && type_array.push("warn");
            types.error && type_array.push("error");
            return this.#idb.get({
                objectStoreName: "log",
                ranges: [new MPIDBKeyRanges().only("type", type_array, true)]
            });
        }
    }
    #responseFunctions;
    async registerResponseFunction(id, assets, responseFunction) {
        await Promise.all(Object.values(assets).map(async (asset) => {
            if (asset.startsWith("local://")) {
                return;
            }
            if ((await this.#idb.count({ objectStoreName: "assets", key: asset })) == 0) {
                this.registerAsset(asset, await (await globalThis.fetch(asset)).blob());
            }
        }));
        this.#responseFunctions.set(id, {
            assets: assets,
            responseFunction
        });
    }
    async errorResponse(error, responseInit = {
        headers: {
            "Content-Type": "text/plain"
        },
        status: 500,
        statusText: "Internal Server Error"
    }) {
        return new Response(error, responseInit);
    }
    async registerRoute(route) {
        await this.#idb.add({ objectStoreName: "routes", record: route });
    }
    async registerAsset(id, blob) {
        await this.#idb.put({ objectStoreName: "assets", record: { id, blob } });
        await this.registerRoute({
            priority: 1,
            type: "string",
            string: id,
            ignoreCase: true,
            storage: "static",
            key: id
        });
    }
    async registerRedirection(routeSelector, destination) {
        await this.#idb.add({
            objectStoreName: "routes",
            record: Object.assign({
                storage: "dynamic",
                priority: 0,
                script: "local://null",
                function: "redirect",
                files: {},
                arguments: [destination]
            }, routeSelector)
        });
    }
    #ononline;
    get ononline() {
        return this.#ononline;
    }
    set ononline(value) {
        if (this.#ononline) {
            this.removeEventListener("online", this.#ononline);
        }
        if (typeof value == "function") {
            this.#ononline = value;
            this.addEventListener("online", value);
        }
        else {
            this.#ononline = null;
        }
    }
    #onoffline;
    get onoffline() {
        return this.#onoffline;
    }
    set onoffline(value) {
        if (this.#onoffline) {
            this.removeEventListener("offline", this.#onoffline);
        }
        if (typeof value == "function") {
            this.#onoffline = value;
            this.addEventListener("offline", value);
        }
        else {
            this.#onoffline = null;
        }
    }
    #onconnected;
    get onconnected() {
        return this.#onconnected;
    }
    set onconnected(value) {
        if (this.#onconnected) {
            this.removeEventListener("connected", this.#onconnected);
        }
        if (typeof value == "function") {
            this.#onconnected = value;
            this.addEventListener("connected", value);
        }
        else {
            this.#onconnected = null;
        }
    }
    #ondisconnected;
    get ondisconnected() {
        return this.#ondisconnected;
    }
    set ondisconnected(value) {
        if (this.#ondisconnected) {
            this.removeEventListener("disconnected", this.#ondisconnected);
        }
        if (typeof value == "function") {
            this.#ondisconnected = value;
            this.addEventListener("disconnected", value);
        }
        else {
            this.#ondisconnected = null;
        }
    }
    #onbeforeinstall;
    get onbeforeinstall() {
        return this.#onbeforeinstall;
    }
    set onbeforeinstall(value) {
        if (this.#onbeforeinstall) {
            this.removeEventListener("beforeinstall", this.#onbeforeinstall);
        }
        if (typeof value == "function") {
            this.#onbeforeinstall = value;
            this.addEventListener("beforeinstall", value);
        }
        else {
            this.#onbeforeinstall = null;
        }
    }
    #oninstall;
    get oninstall() {
        return this.#oninstall;
    }
    set oninstall(value) {
        if (this.#oninstall) {
            this.removeEventListener("install", this.#oninstall);
        }
        if (typeof value == "function") {
            this.#oninstall = value;
            this.addEventListener("install", value);
        }
        else {
            this.#oninstall = null;
        }
    }
    #onafterinstall;
    get onafterinstall() {
        return this.#onafterinstall;
    }
    set onafterinstall(value) {
        if (this.#onafterinstall) {
            this.removeEventListener("afterinstall", this.#onafterinstall);
        }
        if (typeof value == "function") {
            this.#onafterinstall = value;
            this.addEventListener("afterinstall", value);
        }
        else {
            this.#onafterinstall = null;
        }
    }
    #onbeforeupdate;
    get onbeforeupdate() {
        return this.#onbeforeupdate;
    }
    set onbeforeupdate(value) {
        if (this.#onbeforeupdate) {
            this.removeEventListener("beforeupdate", this.#onbeforeupdate);
        }
        if (typeof value == "function") {
            this.#onbeforeupdate = value;
            this.addEventListener("beforeupdate", value);
        }
        else {
            this.#onbeforeupdate = null;
        }
    }
    #onupdate;
    get onupdate() {
        return this.#onupdate;
    }
    set onupdate(value) {
        if (this.#onupdate) {
            this.removeEventListener("update", this.#onupdate);
        }
        if (typeof value == "function") {
            this.#onupdate = value;
            this.addEventListener("update", value);
        }
        else {
            this.#onupdate = null;
        }
    }
    #onafterupdate;
    get onafterupdate() {
        return this.#onafterupdate;
    }
    set onafterupdate(value) {
        if (this.#onafterupdate) {
            this.removeEventListener("afterupdate", this.#onafterupdate);
        }
        if (typeof value == "function") {
            this.#onafterupdate = value;
            this.addEventListener("afterupdate", value);
        }
        else {
            this.#onafterupdate = null;
        }
    }
    #onbeforeactivate;
    get onbeforeactivate() {
        return this.#onbeforeactivate;
    }
    set onbeforeactivate(value) {
        if (this.#onbeforeactivate) {
            this.removeEventListener("beforeactivate", this.#onbeforeactivate);
        }
        if (typeof value == "function") {
            this.#onbeforeactivate = value;
            this.addEventListener("beforeactivate", value);
        }
        else {
            this.#onbeforeactivate = null;
        }
    }
    #onactivate;
    get onactivate() {
        return this.#onactivate;
    }
    set onactivate(value) {
        if (this.#onactivate) {
            this.removeEventListener("activate", this.#onactivate);
        }
        if (typeof value == "function") {
            this.#onactivate = value;
            this.addEventListener("activate", value);
        }
        else {
            this.#onactivate = null;
        }
    }
    #onafteractivate;
    get onafteractivate() {
        return this.#onafteractivate;
    }
    set onafteractivate(value) {
        if (this.#onafteractivate) {
            this.removeEventListener("afteractivate", this.#onafteractivate);
        }
        if (typeof value == "function") {
            this.#onafteractivate = value;
            this.addEventListener("afteractivate", value);
        }
        else {
            this.#onafteractivate = null;
        }
    }
    #onbeforefetch;
    get onbeforefetch() {
        return this.#onbeforefetch;
    }
    set onbeforefetch(value) {
        if (this.#onbeforefetch) {
            this.removeEventListener("beforefetch", this.#onbeforefetch);
        }
        if (typeof value == "function") {
            this.#onbeforefetch = value;
            this.addEventListener("beforefetch", value);
        }
        else {
            this.#onbeforefetch = null;
        }
    }
    #onfetch;
    get onfetch() {
        return this.#onfetch;
    }
    set onfetch(value) {
        if (this.#onfetch) {
            this.removeEventListener("fetch", this.#onfetch);
        }
        if (typeof value == "function") {
            this.#onfetch = value;
            this.addEventListener("fetch", value);
        }
        else {
            this.#onfetch = null;
        }
    }
    #onafterfetch;
    get onafterfetch() {
        return this.#onafterfetch;
    }
    set onafterfetch(value) {
        if (this.#onafterfetch) {
            this.removeEventListener("afterfetch", this.#onafterfetch);
        }
        if (typeof value == "function") {
            this.#onafterfetch = value;
            this.addEventListener("afterfetch", value);
        }
        else {
            this.#onafterfetch = null;
        }
    }
    #onbeforestart;
    get onbeforestart() {
        return this.#onbeforestart;
    }
    set onbeforestart(value) {
        if (this.#onbeforestart) {
            this.removeEventListener("beforestart", this.#onbeforestart);
        }
        if (typeof value == "function") {
            this.#onbeforestart = value;
            this.addEventListener("beforestart", value);
        }
        else {
            this.#onbeforestart = null;
        }
    }
    #onstart;
    get onstart() {
        return this.#onstart;
    }
    set onstart(value) {
        if (this.#onstart) {
            this.removeEventListener("start", this.#onstart);
        }
        if (typeof value == "function") {
            this.#onstart = value;
            this.addEventListener("start", value);
        }
        else {
            this.#onstart = null;
        }
    }
    #onafterstart;
    get onafterstart() {
        return this.#onafterstart;
    }
    set onafterstart(value) {
        if (this.#onafterstart) {
            this.removeEventListener("afterstart", this.#onafterstart);
        }
        if (typeof value == "function") {
            this.#onafterstart = value;
            this.addEventListener("afterstart", value);
        }
        else {
            this.#onafterstart = null;
        }
    }
    #onbeforemessage;
    get onbeforemessage() {
        return this.#onbeforemessage;
    }
    set onbeforemessage(value) {
        if (this.#onbeforemessage) {
            this.removeEventListener("beforemessage", this.#onbeforemessage);
        }
        if (typeof value == "function") {
            this.#onbeforemessage = value;
            this.addEventListener("beforemessage", value);
        }
        else {
            this.#onbeforemessage = null;
        }
    }
    #onmessage;
    get onmessage() {
        return this.#onmessage;
    }
    set onmessage(value) {
        if (this.#onmessage) {
            this.removeEventListener("message", this.#onmessage);
        }
        if (typeof value == "function") {
            this.#onmessage = value;
            this.addEventListener("message", value);
        }
        else {
            this.#onmessage = null;
        }
    }
    #onaftermessage;
    get onaftermessage() {
        return this.#onaftermessage;
    }
    set onaftermessage(value) {
        if (this.#onaftermessage) {
            this.removeEventListener("aftermessage", this.#onaftermessage);
        }
        if (typeof value == "function") {
            this.#onaftermessage = value;
            this.addEventListener("aftermessage", value);
        }
        else {
            this.#onaftermessage = null;
        }
    }
}
Server.server = new Server();
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference path="serviceworker.d.ts" />
/// <reference path="helper.ts" />
/// <reference path="../../libs/mpcacheresponse/index.ts" />
/// <reference path="../../libs/mpdate/index.ts" />
/// <reference path="../../libs/mpidb/index.ts" />
/// <reference path="serverevent.ts" />
/// <reference path="server.ts" />
// const DEBUG_MODE = "online";
const server = new Server();
/// <reference path="server/index.ts" />
// server.setSetting("site-title", "ServiceWorkerServer");
server.setSetting("theme-color", "#000000");
server.setSetting("copyright", "\u00a9 " + new Date().getFullYear() + " MPDieckmann.");
// server.setSetting("server-icon", Server.APP_SCOPE + "/client/png/index/${p}/${w}-${h}.png");
// server.setSetting("access-token", "default-access");
// server.setSetting("id", "default");
server.start();
/// <reference path="config.ts" />
/// <reference path="../../server/index.ts" />
class Scope {
    constructor(request, data = {}) {
        this.GET = {};
        this.POST = {};
        this.REQUEST = {};
        this.#status = 200;
        this.statusText = "OK";
        this.#headers = new Headers({
            "Content-Type": "text/html;charset=utf8"
        });
        this.site_title = "";
        this.page_title = "";
        this.#styles = {};
        this.#scripts = {};
        this.#menus = {};
        this.#toasts = [];
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
     * Convert special characters to HTML entities
     *
     * @param string The string being converted.
     * @return The converted string.
     */
    static htmlspecialchars(string) {
        return string.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    }
    #status;
    get status() {
        return this.#status;
    }
    set status(value) {
        if (value > 100 && value < 600) {
            this.#status = value;
        }
    }
    #headers;
    get headers() {
        return this.#headers;
    }
    set headers(value) {
        if (value instanceof Headers) {
            this.#headers = value;
        }
        else {
            this.#headers = new Headers(value);
        }
    }
    /**
     * Füllt den Template-String mit Daten
     *
     * @param template Der Template-String
     */
    async build(template) {
        if (template instanceof MPCacheResponse) {
            template = await template.text();
        }
        let matches = template.match(/\{\{ (generate_[A-Za-z0-9_]+)\(([A-Za-z0-9_, \-+]*)\) \}\}/g);
        if (matches) {
            for (let value of matches) {
                let match = /\{\{ (generate_[A-Za-z0-9_]+)\(([A-Za-z0-9_, \-+]*)\) \}\}/.exec(value);
                if (typeof this[match[1]] == "function") {
                    let pattern = match[0];
                    let args = match[2].split(",").map(a => a.trim());
                    let replacement = await this[match[1]].apply(this, args);
                    template = template.replace(pattern, replacement);
                }
            }
        }
        return template;
    }
    async toResponse(template) {
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
    build_menu(menu, options = {}) {
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
    #styles;
    /**
     * Fügt ein Stylesheet hinzu oder ändert ein bestehendes
     *
     * @param data Das zu benutzende Daten-Array
     * @param id ID des Stylesheets
     * @param href URL zum Stylesheet
     * @param media Media Informationen
     * @param type Typ des Stylesheets
     */
    add_style(id, href, media = "all,screen,handheld,print", type = "text/css") {
        this.#styles[id] = { id, href: href instanceof MPCacheResponse ? href.url : href, media, type };
    }
    /**
     * Löscht ein zuvor hinzugefügtes Stylesheet
     *
     * @param data Das zu benutzende Daten-Array
     * @param id ID des Stylesheets
     */
    remove_style(id) {
        delete this.#styles[id];
    }
    #scripts;
    /**
     * Fügt ein Skript hinzu
     *
     * @param data Das zu benutzende Daten-Array
     * @param id ID des Skripts
     * @param src URL zum Skript
     * @param type Typ des Skripts
     * @param position Gibt an, an welcher Position das Sktip eingefügt werden soll
     */
    add_script(id, src, type = "text/javascript", position = "head") {
        this.#scripts[id] = { id, src: src instanceof MPCacheResponse ? src.url : src, type, position };
    }
    /**
     * Löscht ein zuvor hinzugefügtes Skript
     *
     * @param id ID des Skripts
     */
    remove_script(id) {
        delete this.#scripts[id];
    }
    #menus;
    add_menu_item(path, label, href, submenu = this.#menus) {
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
        }
        else {
            submenu[id] = { label, href, submenu: {} };
        }
    }
    #toasts;
    /**
     * Zeigt eine Nachrichtenblase für eine kurze Dauer an
     *
     * @param message Nachricht
     * @param delay Anzeigedauer
     * @param color Hintergrundfarbe
     */
    toast(message, delay = 1000, color = "#000") {
        this.#toasts.push([message, delay, color]);
    }
    /**
     * Gibt die Value des Daten-Arrays an einem Index aus
     *
     * @param index Index des in data
     * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
     */
    generate_value(index, escape) {
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
    generate_setting(key, escape) {
        return this.generate_value.call({ data: { setting: String(Server.server.getSetting(key)) } }, "setting", escape);
    }
    /**
     * Gibt die Version des Servers zurück
     *
     * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
     */
    generate_version(escape) {
        return this.generate_value.call({ data: { version: "Version: " + Server.server.version + (Server.server.online ? " (Online)" : " (Offline)") } }, "version", escape);
    }
    /**
     * Gibt die Copyright-Zeichenfolge des Servers zurück
     *
     * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
     */
    generate_copyright(escape) {
        return this.generate_value.call({ data: { copyright: Server.server.getSetting("copyright") } }, "copyright", escape);
    }
    /**
     * Gibt die Version des Servers zurück
     *
     * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
     */
    generate_url(url = "", escape = "url") {
        return this.generate_value.call({ data: { url: Server.server.scope + url } }, "url", escape);
    }
    /**
     *
     * @param hidden
     * @returns
     */
    generate_offline_switch(hidden) {
        return `<input type="checkbox" name="switch_offline_mode" class="switch_offline_mode" onclick="navigator.serviceWorker.controller.postMessage({type:&quot;set-setting&quot;,property:&quot;offline-mode&quot;,value:this.checked})" ${Server.server.getSetting("offline-mode") ? ' checked=""' : ""}${hidden == "true" ? "" : ' hidden="'}/>`;
    }
    /**
     * Gibt den Inhalt des &lt;title&gt;-Tags aus
     *
     * @param mode full | page | site
     * @return Inhalt des &lt;title&gt;-Tags
     */
    generate_title(mode) {
        switch (mode) {
            case "page":
                return Scope.htmlspecialchars(this.page_title);
            case "site":
                return Scope.htmlspecialchars(this.site_title);
            case "full":
            default:
                if (this.page_title) {
                    return Scope.htmlspecialchars(this.page_title + " | " + this.site_title);
                }
                else {
                    return Scope.htmlspecialchars(this.site_title);
                }
        }
    }
    /**
     * Gibt die Stylesheets als &lt;link&gt;-Tags aus
     *
     * @return &lt;link&gt;-Tags
     */
    generate_styles() {
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
    generate_scripts(position = "head") {
        let html = "";
        for (let index in this.#scripts) {
            let script = this.#scripts[index];
            if (script.position == position) {
                html += "<script id=\"" + Scope.htmlspecialchars(script.id) + "\" src=\"" + Scope.htmlspecialchars(script.src) + "\" type=\"" + Scope.htmlspecialchars(script.type) + "\"></script>";
            }
        }
        ;
        return html;
    }
    /**
     * Gibt ein Menü aus
     *
     * @param data Daten-Array der build-Funktion
     * @param index Index des Menüs
     * @return
     */
    generate_menu(index) {
        if (index in this.#menus) {
            return this.build_menu(this.#menus[index].submenu);
        }
        else {
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
    async generate_log_badge(type, hide_empty = "false") {
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
/// <reference path="../config.ts" />
/// <reference path="../plugins/scope/index.ts" />
server.registerRoute({
    priority: 2,
    type: "string",
    string: server.scope + "/debug",
    ignoreCase: true,
    storage: "dynamic",
    script: "local://null",
    function: server.scope + "/debug",
    arguments: []
});
server.registerResponseFunction(server.scope + "/debug", {
    "mpc.css": server.scope + "/client/css/mpc.css",
    "main.css": server.scope + "/client/css/main.css",
    "print.css": server.scope + "/client/css/print.css",
    "debug.css": server.scope + "/client/css/debug.css",
    "main.js": server.scope + "/client/js/main.js",
    "layout.html": server.scope + "/client/html/layout.html"
}, async (request, files, args) => {
    let scope = new Scope(request);
    scope.add_style("mpc-css", files["mpc.css"]);
    scope.add_style("main-css", files["main.css"]);
    scope.add_style("print-css", files["print.css"], "print");
    scope.add_style("debug-css", files["debug.css"]);
    scope.add_script("main-js", files["main.js"]);
    let main = "";
    if (scope.GET.clear_logs == "1") {
        await server.clearLog();
    }
    function expand_property(props, prop, prefix = "", is_prototype = false) {
        if (!props.counters) {
            props.counters = new Map();
        }
        if (typeof prop == "function" ||
            typeof prop == "object" && prop !== null) {
            if (!is_prototype && props.has(prop)) {
                return `<div class="value-non-primitive">${prefix}<span class="value type-${typeof prop}"><a href="#${Scope.htmlspecialchars(encodeURIComponent(props.get(prop)))}">${props.get(prop)}</a></span></div>`;
            }
            let obj_id;
            if (typeof prop == "function") {
                obj_id = Scope.htmlspecialchars(prop.toString().split(" ", 1)[0] == "class" ? "class" : "function") + " " + Scope.htmlspecialchars(prop.name);
                if (!props.has(prop)) {
                    let count = props.counters.get(obj_id) || 0;
                    props.counters.set(obj_id, ++count);
                    obj_id += `#${count}(${Scope.htmlspecialchars(prop.length)} argument${prop.length == 1 ? "" : "s"})`;
                    props.set(prop, obj_id);
                }
            }
            else {
                obj_id = Object.prototype.toString.call(prop).replace(/^\[object (.*)\]$/, "$1");
                if (!props.has(prop)) {
                    let count = props.counters.get(obj_id) || 0;
                    props.counters.set(obj_id, ++count);
                    obj_id += "#" + count;
                    props.set(prop, obj_id);
                }
            }
            return `<details class="value-non-primitive" id="${Scope.htmlspecialchars(encodeURIComponent(props.get(prop)))}"><summary>${prefix}<span class="value type-${typeof prop}">${obj_id}</span></summary>${[Object.getOwnPropertyNames(prop), Object.getOwnPropertySymbols(prop)].flat().map(key => {
                let desc = Object.getOwnPropertyDescriptor(prop, key);
                let html = "";
                if (typeof desc.get == "function") {
                    html += `<div class="property-${desc.enumerable ? "" : "non-"}enumerable">${expand_property(props, desc.get, `<span class="property-key"><span class="property-descriptor">get</span> ${Scope.htmlspecialchars(key.toString())}</span>: `)}</div>`;
                }
                if (typeof desc.set == "function") {
                    html += `<div class="property-${desc.enumerable ? "" : "non-"}enumerable">${expand_property(props, desc.set, `<span class="property-key"><span class="property-descriptor">set</span> ${Scope.htmlspecialchars(key.toString())}</span>: `)}</div>`;
                }
                if (typeof desc.get != "function" &&
                    typeof desc.set != "function") {
                    html += `<div class="property-${desc.enumerable ? "" : "non-"}enumerable">${expand_property(props, desc.value, `<span class="property-key">${desc.writable ? "" : `<span class="property-descriptor">readonly</span> `}${Scope.htmlspecialchars(key.toString())}</span>: `)}</div>`;
                }
                return html;
            }).join("") + `<div class="property-non-enumerable">${expand_property(props, Object.getPrototypeOf(prop), `<span class="property-key"><span class="property-descriptor">[[Prototype]]:</span></span> `, true)}`}</details>`;
        }
        else {
            return `<div class="value-primitive">${prefix}<span class="value type-${typeof prop}">${Scope.htmlspecialchars("" + prop)}</span></div>`;
        }
    }
    main += `<div class="server"><h2>Server</h2>${expand_property(new Map(), server)}</div>`;
    main += `<div class="log">
  <h2>Log</h2>
  <input type="checkbox" id="hide_log" hidden />
  <input type="checkbox" id="hide_warn" hidden />
  <input type="checkbox" id="hide_error" hidden />
  ${(await server.getLog()).map(entry => {
        if (entry.stack) {
            return `<details class="log-${Scope.htmlspecialchars("" + entry.type)}">
      <summary><span class="timestamp">${Scope.htmlspecialchars(mpdate("d.m.Y h:i:s", entry.timestamp))}</span> ${expand_property(new Map(), entry.message)}</summary>
      ${expand_property(new Map(), entry.stack)}
    </details>`;
        }
        return `<div class="log-${Scope.htmlspecialchars("" + entry.type)}"><span class="timestamp">${Scope.htmlspecialchars(mpdate("d.m.Y h:i:s", entry.timestamp))}</span> ${Scope.htmlspecialchars("" + entry.message)}</div>`;
    }).join("\n")}
  <div class="sticky-footer">
    <a class="mpc-button" href="${server.scope}/debug?clear_logs=1">Alles l&ouml;schen</a>
    <label class="mpc-button" for="hide_log">Log ${await scope.generate_log_badge("log")}</label>
    <label class="mpc-button" for="hide_warn">Warnungen ${await scope.generate_log_badge("warn")}</label>
    <label class="mpc-button" for="hide_error">Fehler ${await scope.generate_log_badge("error")}</label>
  </div>
  </div>`;
    scope.page_title = "Server Log";
    scope.data = { main };
    return scope.toResponse(files["layout.html"]);
});
/// <reference path="../config.ts" />
server.registerRoute({
    priority: 2,
    type: "regexp",
    regexp: new RegExp("^" + server.regex_safe_scope + "\\/(index(.[a-z0-9]+)?)?$", "g"),
    storage: "dynamic",
    script: "local://null",
    function: server.scope + "/index.html",
    arguments: []
});
server.registerResponseFunction(server.scope + "/index.html", {
    "mpc.css": server.scope + "/client/css/mpc.css",
    "main.css": server.scope + "/client/css/main.css",
    "print.css": server.scope + "/client/css/print.css",
    "main.js": server.scope + "/client/js/main.js",
    "layout.html": server.scope + "/client/html/layout.html"
}, async (request, files, args) => {
    let scope = new Scope(request);
    scope.add_style("mpc-css", files["mpc.css"]);
    scope.add_style("main-css", files["main.css"]);
    scope.add_style("print-css", files["print.css"], "print");
    scope.add_script("main-js", files["main.js"]);
    scope.page_title = "Startseite";
    scope.data = {
        main: ``,
    };
    return new Response(await scope.build(files["layout.html"]), scope);
});
/// <reference path="../config.ts" />
server.registerRedirection({
    priority: 1,
    type: "regexp",
    regexp: new RegExp("^" + server.regex_safe_scope + "/install(.[a-z0-9]+)?$", "i")
}, "/");
/// <reference path="../config.ts" />
server.registerRoute({
    priority: 0,
    type: "string",
    string: server.scope + "/manifest.webmanifest",
    ignoreCase: true,
    storage: "dynamic",
    script: "local://null",
    function: server.scope + "/manifest.webmanifest",
    arguments: []
});
server.registerResponseFunction(server.scope + "/manifest.webmanifest", {}, (request, files, args) => {
    let manifest = {
        name: server.getSetting("site-title"),
        short_name: server.getSetting("site-title"),
        start_url: server.scope + "/",
        display: "standalone",
        background_color: server.getSetting("theme-color"),
        theme_color: server.getSetting("theme-color"),
        description: server.getSetting("site-title") + "\n" + server.getSetting("copyright"),
        lang: "de-DE",
        orientation: "natural",
        icons: [],
        shortcuts: []
    };
    // let logged_in = server.is_logged_in();
    // Server.ICON_SIZES.forEach(size => {
    //   let [width, height] = size.split("x");
    //   Server.ICON_PURPOSES.forEach(purpose => {
    //     manifest.icons.push({
    //       src: Server.APP_SCOPE + "/client/png/index/${p}/${w}-${h}.png".replace("${p}", purpose).replace("${w}", width).replace("${h}", height),
    //       sizes: size,
    //       type: "image/png",
    //       purpose: purpose
    //     });
    //   });
    // });
    // logged_in && server.iterateRoutes((route, pathname) => {
    //   if (route == "cache") {
    //     return;
    //   }
    //   if (route.is_shortcut) {
    //     manifest.shortcuts.push({
    //       name: route.label,
    //       url: pathname,
    //       icons: route.icon ? Server.ICON_SIZES.map(size => {
    //         let [width, height] = size.split("x");
    //         return Server.ICON_PURPOSES.map(purpose => {
    //           return route.icon.replace("${p}", purpose).replace("${w}", width).replace("${h}", height);
    //         });
    //       }).flat() : manifest.icons
    //     });
    //   }
    // });
    return new Response(JSON.stringify(manifest));
});
//# sourceMappingURL=serviceworker.js.map