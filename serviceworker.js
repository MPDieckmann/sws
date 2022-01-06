/// <reference no-default-lib="true" />
/// <reference path="index.ts" />
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
EventTarget.prototype.awaitEventListener = function awaitEventListener(resolve_type, reject_type = "error") {
    return new Promise((resolve, reject) => {
        let resolveCallback = (event) => {
            resolve(event);
            this.removeEventListener(resolve_type, resolveCallback);
            this.removeEventListener(reject_type, rejectCallback);
        };
        let rejectCallback = (event) => {
            reject(event);
            this.removeEventListener(resolve_type, resolveCallback);
            this.removeEventListener(reject_type, rejectCallback);
        };
        this.addEventListener(resolve_type, resolveCallback, { once: true });
        this.addEventListener(reject_type, rejectCallback, { once: true });
    });
};
/**
 * replace i18n, if it is not available
 */
// @ts-ignore
let i18n = self.i18n || ((text) => text.toString());
/**
 * Formatiert ein(e) angegebene(s) Ortszeit/Datum gemäß PHP 7
 * @param {string} string die Zeichenfolge, die umgewandelt wird
 * @param {number | string | Date} timestamp der zu verwendende Zeitpunkt
 * @return {string}
 */
function date(string, timestamp = new Date) {
    var d = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
    var escaped = false;
    return string.split("").map(string => {
        if (!escaped && string == "\\") {
            escaped = true;
            return "";
        }
        else if (!escaped && string in date._functions) {
            return date._functions[string](d).toString();
        }
        else {
            escaped = false;
            return string;
        }
    }).join("");
}
(function (date_1) {
    /**
     * Überprüft, ob eine Zeichenkette ein gültiges Datum (nach dem angegebenen Datumsformat) darstellt
     *
     * @param date_string Die zu überprüfende Zeichenkette
     * @param format Das Datumsformat
     */
    function isValid(date_string, format = "Y-m-d") {
        return date(format, date_string) == date_string;
    }
    date_1.isValid = isValid;
    /**
     * Diese Zeichenfolgen werden von `date()` benutzt um die Wochentage darzustellen
     *
     * Sie werden von `i18n(weekdays[i] , "mpc-date")` übersetzt
     */
    date_1.weekdays = [
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
     * Sie werden von `i18n(months[i] , "mpc-date")` übersetzt
     */
    date_1.months = [
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
    date_1.time = time;
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
    date_1._functions = Object.create(null);
    /**
     * Tag des Monats, 2-stellig mit führender Null
     * 01 bis 31
     */
    date_1._functions.d = date => {
        return leadingZero(date.getDate());
    };
    /**
     * Wochentag, gekürzt auf drei Buchstaben
     * Mon bis Sun
     */
    date_1._functions.D = date => {
        return i18n(date_1.weekdays[date.getDay()], "mpc-date").substr(0, 3);
    };
    /**
     * Tag des Monats ohne führende Nullen
     * 1 bis 31
     */
    date_1._functions.j = date => {
        return date.getDate();
    };
    /**
     * Ausgeschriebener Wochentag
     * Sunday bis Saturday
     */
    date_1._functions.l = date => {
        return i18n(date_1.weekdays[date.getDay()], "mpc-date");
    };
    /**
     * Numerische Repräsentation des Wochentages gemäß ISO-8601 (in PHP 5.1.0 hinzugefügt)
     * 1 (für Montag) bis 7 (für Sonntag)
     */
    date_1._functions.N = date => {
        return date.getDay() == 0 ? 7 : date.getDay();
    };
    /**
     * Anhang der englischen Aufzählung für einen Monatstag, zwei Zeichen
     * st, nd, rd oder th
     * Zur Verwendung mit j empfohlen.
     */
    date_1._functions.S = date => {
        switch (date.getDate()) {
            case 1:
                return i18n("st", "mpc-date");
            case 2:
                return i18n("nd", "mpc-date");
            case 3:
                return i18n("rd", "mpc-date");
            default:
                return i18n("th", "mpc-date");
        }
    };
    /**
     * Numerischer Tag einer Woche
     * 0 (für Sonntag) bis 6 (für Samstag)
     */
    date_1._functions.w = date => {
        return 7 == date.getDay() ? 0 : date.getDay();
    };
    /**
     * Der Tag des Jahres (von 0 beginnend)
     * 0 bis 366
     */
    date_1._functions.z = date => {
        return Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 864e5).toString();
    };
    // #endregion
    // #region Woche
    /**
     * Der Tag des Jahres (von 0 beginnend)
     * Beispiel: 42 (die 42. Woche im Jahr)
     */
    date_1._functions.W = date => {
        var tmp_date = new Date(date.getTime() + 864e5 * (3 - (date.getDay() + 6) % 7));
        return Math.floor(1.5 + (tmp_date.getTime() - new Date(new Date(tmp_date.getFullYear(), 0, 4).getTime() + 864e5 * (3 - (new Date(tmp_date.getFullYear(), 0, 4).getDay() + 6) % 7)).getTime()) / 864e5 / 7);
    };
    // #endregion
    // #region Monat
    /**
     * Monat als ganzes Wort, wie January oder March
     * January bis December
     */
    date_1._functions.F = date => {
        return i18n(date_1.months[date.getMonth()], "mpc-date");
    };
    /**
     * Monat als Zahl, mit führenden Nullen
     * 01 bis 12
     */
    date_1._functions.m = date => {
        return leadingZero(date.getMonth() + 1);
    };
    /**
     * Monatsname mit drei Buchstaben
     * Jan bis Dec
     */
    date_1._functions.M = date => {
        return i18n(date_1.months[date.getMonth()], "mpc-date").substr(0, 3);
    };
    /**
     * Monatszahl, ohne führende Nullen
     * 1 bis 12
     */
    date_1._functions.n = date => {
        return date.getMonth() + 1;
    };
    /**
     * Anzahl der Tage des angegebenen Monats
     * 28 bis 31
     */
    date_1._functions.t = date => {
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
    date_1._functions.L = date => {
        return date.getFullYear() % 4 == 0 && date.getFullYear() % 100 != 0 ? 1 : 0;
    };
    /**
     * Jahreszahl der Kalenderwoche gemäß ISO-8601. Dies ergibt den gleichen Wert wie Y, außer wenn die ISO-Kalenderwoche (W) zum vorhergehenden oder nächsten Jahr gehört, wobei dann jenes Jahr verwendet wird (in PHP 5.1.0 hinzugefügt).
     * Beispiele: 1999 oder 2003
     */
    date_1._functions.o = date => {
        var tmp_d = new Date(date.toISOString());
        tmp_d.setDate(date.getDate() - (date.getDay() == 0 ? 7 : date.getDay()) + 1);
        return tmp_d.getFullYear();
    };
    /**
     * Vierstellige Jahreszahl
     * Beispiele: 1999 oder 2003
     */
    date_1._functions.Y = date => {
        return date.getFullYear();
    };
    /**
     * Jahreszahl, zweistellig
     * Beispiele: 99 oder 03
     */
    date_1._functions.y = date => {
        var year = date.getFullYear().toString();
        return year.substr(year.length - 2, 2);
    };
    // #endregion
    // #region Uhrzeit
    /**
     * Kleingeschrieben: Ante meridiem (Vormittag) und Post meridiem (Nachmittag)
     * am oder pm
     */
    date_1._functions.a = date => {
        if (date.getHours() > 12) {
            return i18n("pm", "mpc-date");
        }
        return i18n("am", "mpc-date");
    };
    /**
     * Großgeschrieben: Ante meridiem (Vormittag) und Post meridiem (Nachmittag)
     * AM oder PM
     */
    date_1._functions.A = date => {
        if (date.getHours() > 12) {
            return i18n("PM", "mpc-date");
        }
        return i18n("AM", "mpc-date");
    };
    /**
     * Swatch-Internet-Zeit
     * 000 - 999
     */
    date_1._functions.B = () => {
        server.error("date(): B is currently not supported");
        return "B";
    };
    /**
     * Stunde im 12-Stunden-Format, ohne führende Nullen
     * 1 bis 12
     */
    date_1._functions.g = date => {
        return date.getHours() > 12 ? date.getHours() - 11 : date.getHours() + 1;
    };
    /**
     * Stunde im 24-Stunden-Format, ohne führende Nullen
     * 0 bis 23
     */
    date_1._functions.G = date => {
        return date.getHours() + 1;
    };
    /**
     * Stunde im 12-Stunden-Format, mit führenden Nullen
     * 01 bis 12
     */
    date_1._functions.h = date => {
        return leadingZero(date.getHours() > 12 ? date.getHours() - 11 : date.getHours() + 1);
    };
    /**
     * Stunde im 24-Stunden-Format, mit führenden Nullen
     * 00 bis 23
     */
    date_1._functions.H = date => {
        return leadingZero(date.getHours() + 1);
    };
    /**
     * Minuten, mit führenden Nullen
     * 00 bis 59
     */
    date_1._functions.i = date => {
        return leadingZero(date.getMinutes());
    };
    /**
     * Sekunden, mit führenden Nullen
     * 00 bis 59
     */
    date_1._functions.s = date => {
        return leadingZero(date.getSeconds());
    };
    /**
     * Mikrosekunden (hinzugefügt in PHP 5.2.2). Beachten Sie, dass date() immer die Ausgabe 000000 erzeugen wird, da es einen Integer als Parameter erhält, wohingegen DateTime::format() Mikrosekunden unterstützt, wenn DateTime mit Mikrosekunden erzeugt wurde.
     * Beispiel: 654321
     */
    date_1._functions.u = date => {
        return date.getMilliseconds();
    };
    /**
     * Millisekunden (hinzugefügt in PHP 7.0.0). Es gelten die selben Anmerkungen wie für u.
     * Example: 654
     */
    date_1._functions.v = date => {
        return date.getMilliseconds();
    };
    // #endregion
    // #region Zeitzone
    date_1._functions.e = () => {
        server.error("date(): e is currently not supported");
        return "e";
    };
    /**
     * Fällt ein Datum in die Sommerzeit
     * 1 bei Sommerzeit, ansonsten 0.
     */
    date_1._functions.I = () => {
        server.error("date(): I is currently not supported");
        return "I";
    };
    /**
     * Zeitunterschied zur Greenwich time (GMT) in Stunden
     * Beispiel: +0200
     */
    date_1._functions.O = () => {
        server.error("date(): O is currently not supported");
        return "O";
    };
    /**
     * Zeitunterschied zur Greenwich time (GMT) in Stunden mit Doppelpunkt zwischen Stunden und Minuten (hinzugefügt in PHP 5.1.3)
     * Beispiel: +02:00
     */
    date_1._functions.P = () => {
        server.error("date(): P is currently not supported");
        return "P";
    };
    /**
     * Abkürzung der Zeitzone
     * Beispiele: EST, MDT ...
     */
    date_1._functions.T = () => {
        server.error("date(): T is currently not supported");
        return "T";
    };
    /**
     * Offset der Zeitzone in Sekunden. Der Offset für Zeitzonen westlich von UTC ist immer negativ und für Zeitzonen östlich von UTC immer positiv.
     * -43200 bis 50400
     */
    date_1._functions.Z = () => {
        server.error("date(): Z is currently not supported");
        return "Z";
    };
    // #endregion
    // #region Vollständige(s) Datum/Uhrzeit
    /**
     * ISO 8601 Datum (hinzugefügt in PHP 5)
     * 2004-02-12T15:19:21+00:00
     */
    date_1._functions.c = () => {
        server.error("date(): c is currently not supported");
        return "c";
    };
    /**
     * Gemäß » RFC 2822 formatiertes Datum
     * Beispiel: Thu, 21 Dec 2000 16:01:07 +0200
     */
    date_1._functions.r = () => {
        server.error("date(): r is currently not supported");
        return "r";
    };
    /**
     * Sekunden seit Beginn der UNIX-Epoche (January 1 1970 00:00:00 GMT)
     * Siehe auch time()
     */
    date_1._functions.U = date => {
        return date.getTime();
    };
    //#endregion
})(date || (date = {}));
/// <reference no-default-lib="true" />
/// <reference path="index.ts" />
class IndexedDB extends EventTarget {
    [Symbol.toStringTag] = "IndexedDB";
    static STATE_CLOSED = 0;
    static STATE_UPGRADING = 1;
    static STATE_IDLE = 2;
    static STATE_OPERATING = 4;
    STATE_CLOSED = IndexedDB.STATE_CLOSED;
    STATE_UPGRADING = IndexedDB.STATE_UPGRADING;
    STATE_IDLE = IndexedDB.STATE_IDLE;
    STATE_OPERATING = IndexedDB.STATE_OPERATING;
    #idb;
    #state = this.STATE_CLOSED;
    #queue = [];
    #ready;
    #name;
    #version;
    get ready() {
        return this.#ready;
    }
    get state() {
        return this.#state;
    }
    get name() {
        return this.#name;
    }
    get version() {
        return this.#version;
    }
    constructor(name, version, objectStoreDefinitions) {
        super();
        this.#name = name;
        this.#version = version;
        this.#ready = new Promise((resolve, reject) => {
            let request = indexedDB.open(name, version);
            request.addEventListener("success", () => {
                this.#version = request.result.version;
                this.#idb = request.result;
                this.dispatchEvent(new IndexedDBEvent("statechange", {
                    cancelable: false,
                    function: "statechange",
                    arguments: null,
                    result: this.STATE_IDLE
                }));
                this.#state = this.STATE_IDLE;
                this.dispatchEvent(new IndexedDBEvent("success", {
                    cancelable: false,
                    function: "open",
                    arguments: {
                        name,
                        version,
                        objectStoreDefinitions: objectStoreDefinitions
                    },
                    result: request.result
                }));
                this.#dequeue();
                resolve(this);
            });
            request.addEventListener("upgradeneeded", () => {
                this.#version = request.result.version;
                this.dispatchEvent(new IndexedDBEvent("statechange", {
                    cancelable: false,
                    function: "statechange",
                    arguments: null,
                    result: this.STATE_UPGRADING
                }));
                this.#state = this.STATE_UPGRADING;
                this.dispatchEvent(new IndexedDBEvent("upgradeneeded", {
                    cancelable: false,
                    function: "open",
                    arguments: {
                        name,
                        version,
                        objectStoreDefinitions: objectStoreDefinitions
                    },
                    result: request.result
                }));
                Object.keys(objectStoreDefinitions).forEach(objectStoreName => {
                    let objectStoreDefinition = objectStoreDefinitions[objectStoreName];
                    let objectStore = request.result.createObjectStore(objectStoreDefinition.name, objectStoreDefinition);
                    objectStoreDefinition.indices.forEach(index => {
                        objectStore.createIndex(index.name, index.keyPath, index);
                    });
                });
            });
            request.addEventListener("error", () => {
                this.dispatchEvent(new IndexedDBEvent("error", {
                    cancelable: false,
                    function: "open",
                    arguments: {
                        name,
                        version,
                        objectStoreDefinitions: objectStoreDefinitions
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
                this.dispatchEvent(new IndexedDBEvent("blocked", {
                    cancelable: false,
                    function: "open",
                    arguments: {
                        name,
                        version,
                        objectStoreDefinitions: objectStoreDefinitions
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
            let task;
            while (task = this.#queue.shift()) {
                try {
                    await task();
                }
                catch (error) {
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
    #add(objectStoreName, record) {
        return new Promise(async (resolve, reject) => {
            await this.#ready;
            let request = this.#idb.transaction([objectStoreName], "readwrite").objectStore(objectStoreName).add(record);
            request.addEventListener("success", () => {
                this.dispatchEvent(new IndexedDBEvent("success", {
                    cancelable: false,
                    function: "add",
                    arguments: {
                        objectStoreName,
                        record,
                    },
                    result: request.result
                }));
                resolve(request.result);
            });
            request.addEventListener("error", () => {
                this.dispatchEvent(new IndexedDBEvent("error", {
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
    #put(objectStoreName, record) {
        return new Promise(async (resolve, reject) => {
            await this.#ready;
            let request = this.#idb.transaction([objectStoreName], "readwrite").objectStore(objectStoreName).put(record);
            request.addEventListener("success", () => {
                this.dispatchEvent(new IndexedDBEvent("success", {
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
                this.dispatchEvent(new IndexedDBEvent("error", {
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
    #get(objectStoreName, query) {
        let results = [];
        return this.#cursor(objectStoreName, "readonly", typeof query == "function" ? async (cursor) => {
            if (await query(cursor.value)) {
                results.push(cursor.value);
            }
        } : cursor => {
            if (this.#record_matches_query(cursor.value, query)) {
                results.push(cursor.value);
            }
        }).then(() => {
            this.dispatchEvent(new IndexedDBEvent("success", {
                cancelable: false,
                function: "get",
                arguments: {
                    objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                result: results
            }));
            return results;
        }, reason => {
            this.dispatchEvent(new IndexedDBEvent("error", {
                cancelable: false,
                function: "get",
                arguments: {
                    objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                error: reason
            }));
            throw reason;
        });
    }
    #getAll(objectStoreName) {
        return new Promise(async (resolve, reject) => {
            await this.#ready;
            let request = this.#idb.transaction([objectStoreName], "readonly").objectStore(objectStoreName).getAll();
            request.addEventListener("success", () => {
                this.dispatchEvent(new IndexedDBEvent("success", {
                    cancelable: false,
                    function: "get",
                    arguments: {
                        objectStoreName,
                        callback: null,
                        query: null
                    },
                    result: request.result
                }));
                resolve(request.result);
            });
            request.addEventListener("error", () => {
                this.dispatchEvent(new IndexedDBEvent("error", {
                    cancelable: false,
                    function: "get",
                    arguments: {
                        objectStoreName,
                        callback: null,
                        query: null
                    },
                    error: request.error
                }));
                reject(request.error);
            });
        });
    }
    #count(objectStoreName, query) {
        let results = 0;
        return this.#cursor(objectStoreName, "readonly", typeof query == "function" ? async (cursor) => {
            if (await query(cursor.value)) {
                results++;
            }
        } : cursor => {
            if (this.#record_matches_query(cursor.value, query)) {
                results++;
            }
        }).then(() => {
            this.dispatchEvent(new IndexedDBEvent("success", {
                cancelable: false,
                function: "count",
                arguments: {
                    objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                result: results
            }));
            return results;
        }, reason => {
            this.dispatchEvent(new IndexedDBEvent("error", {
                cancelable: false,
                function: "count",
                arguments: {
                    objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                error: reason
            }));
            throw reason;
        });
    }
    #countAll(objectStoreName) {
        return new Promise(async (resolve, reject) => {
            await this.#ready;
            let request = this.#idb.transaction([objectStoreName]).objectStore(objectStoreName).count();
            request.addEventListener("success", () => {
                this.dispatchEvent(new IndexedDBEvent("success", {
                    cancelable: false,
                    function: "count",
                    arguments: {
                        objectStoreName,
                        callback: null,
                        query: null
                    },
                    result: request.result
                }));
                resolve(request.result);
            });
            request.addEventListener("error", () => {
                this.dispatchEvent(new IndexedDBEvent("error", {
                    cancelable: false,
                    function: "count",
                    arguments: {
                        objectStoreName,
                        callback: null,
                        query: null
                    },
                    error: request.error
                }));
                reject(request.error);
            });
        });
    }
    #delete(objectStoreName, query) {
        return this.#cursor(objectStoreName, "readwrite", typeof query == "function" ? async (cursor) => {
            if (await query(cursor.value)) {
                await new Promise((resolve, reject) => {
                    let request = cursor.delete();
                    request.addEventListener("success", () => {
                        resolve();
                    });
                    request.addEventListener("error", () => reject(request.error));
                });
            }
        } : async (cursor) => {
            if (this.#record_matches_query(cursor.value, query)) {
                await new Promise((resolve, reject) => {
                    let request = cursor.delete();
                    request.addEventListener("success", () => {
                        resolve();
                    });
                    request.addEventListener("error", () => reject(request.error));
                });
            }
        }).then(() => {
            this.dispatchEvent(new IndexedDBEvent("success", {
                cancelable: false,
                function: "delete",
                arguments: {
                    objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                result: null
            }));
            return null;
        }, reason => {
            this.dispatchEvent(new IndexedDBEvent("error", {
                cancelable: false,
                function: "delete",
                arguments: {
                    objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                error: reason
            }));
            throw reason;
        });
    }
    #deleteAll(objectStoreName) {
        return new Promise(async (resolve, reject) => {
            await this.#ready;
            let request = this.#idb.transaction([objectStoreName], "readwrite").objectStore(objectStoreName).clear();
            request.addEventListener("success", () => {
                this.dispatchEvent(new IndexedDBEvent("success", {
                    cancelable: false,
                    function: "delete",
                    arguments: {
                        objectStoreName,
                        callback: null,
                        query: null
                    },
                    result: request.result
                }));
                resolve(request.result);
            });
            request.addEventListener("error", () => {
                this.dispatchEvent(new IndexedDBEvent("error", {
                    cancelable: false,
                    function: "delete",
                    arguments: {
                        objectStoreName,
                        callback: null,
                        query: null
                    },
                    error: request.error
                }));
                reject(request.error);
            });
        });
    }
    #cursor(objectStoreName, mode, callback) {
        return new Promise(async (resolve, reject) => {
            await this.#ready;
            let request = this.#idb.transaction([objectStoreName], mode).objectStore(objectStoreName).openCursor();
            request.addEventListener("success", async () => {
                let cursor = request.result;
                if (cursor) {
                    await callback(cursor);
                    cursor.continue();
                }
                else {
                    resolve();
                }
            });
            request.addEventListener("error", () => {
                reject(request.error);
            });
        });
    }
    #record_matches_query(record, query) {
        if (query) {
            let property;
            for (property in query) {
                if (typeof query[property] != typeof record[property] &&
                    typeof query[property] == "object" &&
                    query[property]) {
                    if (query[property] instanceof RegExp &&
                        !query[property].test(record[property])) {
                        return false;
                    }
                    else if (query[property] instanceof Array &&
                        query[property].length == 2 &&
                        record[property] < query[property][0] ||
                        record[property] > query[property][1]) {
                        return false;
                    }
                }
                else if (record[property] != query[property]) {
                    return false;
                }
            }
        }
        return true;
    }
    add(objectStoreName, record) {
        return new Promise((resolve, reject) => {
            this.#queue.push(() => this.#add(objectStoreName, record).then(resolve, reject));
            this.#dequeue();
        });
    }
    put(objectStoreName, record) {
        return new Promise((resolve, reject) => {
            this.#queue.push(() => this.#put(objectStoreName, record).then(resolve, reject));
            this.#dequeue();
        });
    }
    get(objectStoreName, query = null) {
        return new Promise((resolve, reject) => {
            if (query) {
                this.#queue.push(() => this.#get(objectStoreName, query).then(resolve, reject));
            }
            else {
                this.#queue.push(() => this.#getAll(objectStoreName).then(resolve, reject));
            }
            this.#dequeue();
        });
    }
    delete(objectStoreName, query = null) {
        return new Promise((resolve, reject) => {
            if (query) {
                this.#queue.push(() => this.#delete(objectStoreName, query).then(resolve, reject));
            }
            else {
                this.#queue.push(() => this.#deleteAll(objectStoreName).then(resolve, reject));
            }
            this.#dequeue();
        });
    }
    count(objectStoreName, query = null) {
        return new Promise((resolve, reject) => {
            if (query) {
                this.#queue.push(() => this.#count(objectStoreName, query).then(resolve, reject));
            }
            else {
                this.#queue.push(() => this.#countAll(objectStoreName).then(resolve, reject));
            }
            this.#dequeue();
        });
    }
    index(objectStoreName, index, mode = "readonly") {
        return new IndexedDBIndex(this.#idb.transaction([objectStoreName], mode).objectStore(objectStoreName).index(index));
    }
    #staticEvents = new Map();
    get onsuccess() {
        return this.#staticEvents.get("success") || null;
    }
    set onsuccess(value) {
        if (this.#staticEvents.has("success")) {
            this.removeEventListener("success", this.#staticEvents.get("success"));
        }
        if (typeof value == "function") {
            this.#staticEvents.set("success", value);
            this.addEventListener("success", value);
        }
        else {
            this.#staticEvents.delete("success");
        }
    }
    get onerror() {
        return this.#staticEvents.get("error") || null;
    }
    set onerror(value) {
        if (this.#staticEvents.has("error")) {
            this.removeEventListener("error", this.#staticEvents.get("error"));
        }
        if (typeof value == "function") {
            this.#staticEvents.set("error", value);
            this.addEventListener("error", value);
        }
        else {
            this.#staticEvents.delete("error");
        }
    }
    get onblocked() {
        return this.#staticEvents.get("blocked") || null;
    }
    set onblocked(value) {
        if (this.#staticEvents.has("blocked")) {
            this.removeEventListener("blocked", this.#staticEvents.get("blocked"));
        }
        if (typeof value == "function") {
            this.#staticEvents.set("blocked", value);
            this.addEventListener("blocked", value);
        }
        else {
            this.#staticEvents.delete("blocked");
        }
    }
    get onstatechange() {
        return this.#staticEvents.get("statechange") || null;
    }
    set onstatechange(value) {
        if (this.#staticEvents.has("statechange")) {
            this.removeEventListener("statechange", this.#staticEvents.get("statechange"));
        }
        if (typeof value == "function") {
            this.#staticEvents.set("statechange", value);
            this.addEventListener("statechange", value);
        }
        else {
            this.#staticEvents.delete("statechange");
        }
    }
}
/// <reference no-default-lib="true" />
/// <reference path="index.ts" />
class IndexedDBIndex extends EventTarget {
    [Symbol.toStringTag] = "IndexedDBIndex";
    STATE_CLOSED = 0;
    STATE_UPGRADING = 1;
    STATE_IDLE = 2;
    STATE_OPERATING = 4;
    #index;
    #state = this.STATE_CLOSED;
    #queue = [];
    async #ready() {
        if (this.#state == this.STATE_CLOSED) {
            this.#index = this.#index.objectStore.transaction.db.transaction([this.#index.objectStore.name], this.#index.objectStore.transaction.mode).objectStore(this.#index.objectStore.name).index(this.#index.name);
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
    get mode() {
        return this.#index.objectStore.transaction.mode;
    }
    constructor(index) {
        super();
        this.#index = index;
        this.#index.objectStore.transaction.addEventListener("complete", () => {
            if (this.#state == this.STATE_OPERATING) {
                this.#index = this.#index.objectStore.transaction.db.transaction([this.#index.objectStore.name], this.#index.objectStore.transaction.mode).objectStore(this.#index.objectStore.name).index(this.#index.name);
            }
            else {
                this.dispatchEvent(new IndexedDBEvent("statechange", {
                    cancelable: false,
                    function: "statechange",
                    arguments: null,
                    result: this.STATE_CLOSED
                }));
                this.#state = this.STATE_CLOSED;
                // console.log("IndexedDBIndex: closed");
            }
        });
        this.#index.objectStore.transaction.addEventListener("abort", () => {
            this.dispatchEvent(new IndexedDBEvent("statechange", {
                cancelable: false,
                function: "statechange",
                arguments: null,
                result: this.STATE_CLOSED
            }));
            this.#state = this.STATE_CLOSED;
            // console.log("IndexedDBIndex: closed");
        });
        this.dispatchEvent(new IndexedDBEvent("statechange", {
            cancelable: false,
            function: "statechange",
            arguments: null,
            result: this.STATE_IDLE
        }));
        this.#state = this.STATE_IDLE;
        // console.log("IndexedDBIndex: idle");
    }
    async #dequeue() {
        await this.#ready();
        if (this.#state == this.STATE_IDLE && this.#queue.length > 0) {
            this.dispatchEvent(new IndexedDBEvent("statechange", {
                cancelable: false,
                function: "statechange",
                arguments: null,
                result: this.STATE_OPERATING
            }));
            this.#state = this.STATE_OPERATING;
            // console.log("IndexedDBIndex: operating");
            let task;
            while (this.#state == this.STATE_OPERATING && (task = this.#queue.shift())) {
                try {
                    await task();
                }
                catch (error) {
                    console.error(error);
                }
            }
            if (this.#state == this.STATE_OPERATING) {
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
    }
    #get(query) {
        let results = [];
        return this.#cursor(typeof query == "function" ? async (cursor) => {
            if (await query(cursor.value)) {
                results.push(cursor.value);
            }
        } : cursor => {
            if (this.#record_matches_query(cursor.value, query)) {
                results.push(cursor.value);
            }
        }).then(() => {
            this.dispatchEvent(new IndexedDBEvent("success", {
                cancelable: false,
                function: "get",
                arguments: {
                    objectStoreName: this.objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                result: results
            }));
            return results;
        }, reason => {
            this.dispatchEvent(new IndexedDBEvent("error", {
                cancelable: false,
                function: "get",
                arguments: {
                    objectStoreName: this.objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                error: reason
            }));
            throw reason;
        });
    }
    #getAll() {
        return new Promise(async (resolve, reject) => {
            await this.#ready();
            let request = this.#index.getAll();
            request.addEventListener("success", () => {
                this.dispatchEvent(new IndexedDBEvent("success", {
                    cancelable: false,
                    function: "get",
                    arguments: {
                        objectStoreName: this.objectStoreName,
                        callback: null,
                        query: null
                    },
                    result: request.result
                }));
                resolve(request.result);
            });
            request.addEventListener("error", () => {
                this.dispatchEvent(new IndexedDBEvent("error", {
                    cancelable: false,
                    function: "get",
                    arguments: {
                        objectStoreName: this.objectStoreName,
                        callback: null,
                        query: null
                    },
                    error: request.error
                }));
                reject(request.error);
            });
        });
    }
    #count(query) {
        let results = 0;
        return this.#cursor(typeof query == "function" ? async (cursor) => {
            if (await query(cursor.value)) {
                results++;
            }
        } : cursor => {
            if (this.#record_matches_query(cursor.value, query)) {
                results++;
            }
        }).then(() => {
            this.dispatchEvent(new IndexedDBEvent("success", {
                cancelable: false,
                function: "count",
                arguments: {
                    objectStoreName: this.objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                result: results
            }));
            return results;
        }, reason => {
            this.dispatchEvent(new IndexedDBEvent("error", {
                cancelable: false,
                function: "count",
                arguments: {
                    objectStoreName: this.objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                error: reason
            }));
            throw reason;
        });
    }
    #countAll() {
        return new Promise(async (resolve, reject) => {
            await this.#ready();
            let request = this.#index.count();
            request.addEventListener("success", () => {
                this.dispatchEvent(new IndexedDBEvent("success", {
                    cancelable: false,
                    function: "count",
                    arguments: {
                        objectStoreName: this.objectStoreName,
                        callback: null,
                        query: null
                    },
                    result: request.result
                }));
                resolve(request.result);
            });
            request.addEventListener("error", () => {
                this.dispatchEvent(new IndexedDBEvent("error", {
                    cancelable: false,
                    function: "count",
                    arguments: {
                        objectStoreName: this.objectStoreName,
                        callback: null,
                        query: null
                    },
                    error: request.error
                }));
                reject(request.error);
            });
        });
    }
    #delete(query) {
        return this.#cursor(typeof query == "function" ? async (cursor) => {
            if (await query(cursor.value)) {
                await new Promise((resolve, reject) => {
                    let request = cursor.delete();
                    request.addEventListener("success", () => {
                        resolve();
                    });
                    request.addEventListener("error", () => reject(request.error));
                });
            }
        } : async (cursor) => {
            if (this.#record_matches_query(cursor.value, query)) {
                await new Promise((resolve, reject) => {
                    let request = cursor.delete();
                    request.addEventListener("success", () => {
                        resolve();
                    });
                    request.addEventListener("error", () => reject(request.error));
                });
            }
        }).then(() => {
            this.dispatchEvent(new IndexedDBEvent("success", {
                cancelable: false,
                function: "delete",
                arguments: {
                    objectStoreName: this.objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                result: null
            }));
            return null;
        }, reason => {
            this.dispatchEvent(new IndexedDBEvent("error", {
                cancelable: false,
                function: "delete",
                arguments: {
                    objectStoreName: this.objectStoreName,
                    callback: typeof query == "function" ? query : null,
                    query: typeof query == "function" ? null : query
                },
                error: reason
            }));
            throw reason;
        });
    }
    #deleteAll() {
        return this.#cursor(async (cursor) => {
            await new Promise((resolve, reject) => {
                let request = cursor.delete();
                request.addEventListener("success", () => {
                    resolve();
                });
                request.addEventListener("error", () => reject(request.error));
            });
        }).then(() => {
            this.dispatchEvent(new IndexedDBEvent("success", {
                cancelable: false,
                function: "delete",
                arguments: {
                    objectStoreName: this.objectStoreName,
                    callback: null,
                    query: null
                },
                result: null
            }));
            return null;
        }, reason => {
            this.dispatchEvent(new IndexedDBEvent("error", {
                cancelable: false,
                function: "delete",
                arguments: {
                    objectStoreName: this.objectStoreName,
                    callback: null,
                    query: null
                },
                error: reason
            }));
            throw reason;
        });
    }
    #cursor(callback) {
        return new Promise(async (resolve, reject) => {
            await this.#ready();
            let request = this.#index.openCursor();
            request.addEventListener("success", () => {
                let cursor = request.result;
                if (cursor) {
                    callback(cursor);
                    cursor.continue();
                }
                else {
                    resolve();
                }
            });
            request.addEventListener("error", () => {
                reject(request.error);
            });
        });
    }
    #record_matches_query(record, query) {
        if (query) {
            let property;
            for (property in query) {
                if (typeof query[property] != typeof record[property] &&
                    typeof query[property] == "object" &&
                    query[property]) {
                    if (query[property] instanceof RegExp &&
                        !query[property].test(record[property])) {
                        return false;
                    }
                    else if (query[property] instanceof Array &&
                        query[property].length == 2 &&
                        record[property] < query[property][0] ||
                        record[property] > query[property][1]) {
                        return false;
                    }
                }
                else if (record[property] != query[property]) {
                    return false;
                }
            }
        }
        return true;
    }
    get(query = null) {
        return new Promise((resolve, reject) => {
            if (query) {
                this.#queue.push(() => this.#get(query).then(resolve, reject));
            }
            else {
                this.#queue.push(() => this.#getAll().then(resolve, reject));
            }
            this.#dequeue();
        });
    }
    count(query = null) {
        return new Promise((resolve, reject) => {
            if (query) {
                this.#queue.push(() => this.#count(query).then(resolve, reject));
            }
            else {
                this.#queue.push(() => this.#countAll().then(resolve, reject));
            }
            this.#dequeue();
        });
    }
    delete(query = null) {
        if (this.#index.objectStore.transaction.mode != "readwrite") {
            return Promise.reject(new DOMException(`Failed to execute 'delete' on '${this.constructor.name}': The record may not be deleted inside a read-only transaction.`, "ReadOnlyError"));
        }
        return new Promise((resolve, reject) => {
            if (query) {
                this.#queue.push(() => this.#delete(query).then(resolve, reject));
            }
            else {
                this.#queue.push(() => this.#deleteAll().then(resolve, reject));
            }
            this.#dequeue();
        });
    }
    #staticEvents = new Map();
    get onsuccess() {
        return this.#staticEvents.get("success") || null;
    }
    set onsuccess(value) {
        if (this.#staticEvents.has("success")) {
            this.removeEventListener("success", this.#staticEvents.get("success"));
        }
        if (typeof value == "function") {
            this.#staticEvents.set("success", value);
            this.addEventListener("success", value);
        }
        else {
            this.#staticEvents.delete("success");
        }
    }
    get onerror() {
        return this.#staticEvents.get("error") || null;
    }
    set onerror(value) {
        if (this.#staticEvents.has("error")) {
            this.removeEventListener("error", this.#staticEvents.get("error"));
        }
        if (typeof value == "function") {
            this.#staticEvents.set("error", value);
            this.addEventListener("error", value);
        }
        else {
            this.#staticEvents.delete("error");
        }
    }
}
/// <reference no-default-lib="true" />
/// <reference path="index.ts" />
class IndexedDBEvent extends Event {
    [Symbol.toStringTag] = "IndexedDBEvent";
    function;
    arguments;
    result;
    error;
    constructor(type, eventInitDict) {
        super(type, eventInitDict);
        this.function = eventInitDict.function || null;
        this.arguments = eventInitDict.arguments || null;
        this.result = eventInitDict.result || null;
        this.error = eventInitDict.error || null;
    }
}
/// <reference no-default-lib="true" />
/// <reference path="index.ts" />
class ServerEvent extends Event {
    [Symbol.toStringTag] = "ServerEvent";
    #group;
    get group() {
        return this.#group;
    }
    #data;
    get data() {
        return this.#data;
    }
    constructor(type, eventInitDict) {
        super(type, eventInitDict);
        this.#group = eventInitDict.group || null;
        this.#data = eventInitDict.data || null;
    }
    /** @deprecated */
    initServerEvent(type, bubbles, cancelable, group, data) {
        super.initEvent(type, bubbles, cancelable);
        this.#group = group;
        this.#data = data;
    }
}
/// <reference no-default-lib="true" />
/// <reference path="index.ts" />
class Server extends EventTarget {
    [Symbol.toStringTag] = "Server";
    static server = new Server();
    #version;
    #cacheName = "ServerCache-20211226";
    #scope = registration.scope.replace(/\/$/, "");
    #regex_safe_scope = this.#scope.escape(String.ESCAPE_REGEXP, "\\");
    #online = navigator.onLine;
    #idb = new IndexedDB("Server", 1, {
        settings: {
            name: "settings",
            autoIncrement: false,
            keyPath: "key",
            indices: []
        },
        routes: {
            name: "routes",
            autoIncrement: true,
            indices: [
                { name: "by_priority", keyPath: "priority", multiEntry: false, unique: false },
                { name: "by_string", keyPath: "string", multiEntry: false, unique: false },
                { name: "by_key", keyPath: "key", multiEntry: false, unique: false },
                { name: "by_function", keyPath: "function", multiEntry: false, unique: false }
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
    ready;
    #start;
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
            await Promise.all((await this.#idb.get("settings")).map(async (record) => {
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
                key: (this.#scope + "/serviceworker.js")
            });
            let promises = [];
            this.dispatchEvent(new ServerEvent("beforestart", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
            await Promise.all(promises);
            await this.#idb.ready;
            await this.#start;
            this.dispatchEvent(new ServerEvent("afterstart", { cancelable: false, group: "start", data: { await(promise) { promises.push(promise); } } }));
            await Promise.all(promises);
            return this;
        })();
        this.registerResponseFunction("redirect", {}, (request, files, args) => {
            return new Response("", {
                headers: {
                    Location: args[0]
                },
                status: 302,
                statusText: "Found"
            });
        });
    }
    #loadedScripts = new Map([
        [null, null]
    ]);
    async #loadScript(id) {
        if (!this.#loadedScripts.has(id)) {
            let assets = await this.#idb.get("assets", { id });
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
    }
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
            await Promise.all((await this.#idb.get("routes", { storage: "cache" })).map((route) => cache.add(route.key)));
            await Promise.all((await this.#idb.get("routes", { storage: "static" })).map(async (route) => {
                if (route.key.startsWith("local://")) {
                    return;
                }
                await this.registerAsset(route.key, await (await globalThis.fetch(route.key)).blob());
            }));
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
            let routes = await this.#idb.get("routes", async (route) => ((route.type == "string" && ((route.ignoreCase && route.string.toLowerCase() == request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1").toLowerCase()) ||
                (!route.ignoreCase && route.string == request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1")))) || (route.type == "regexp" && route.regexp.test(request.url.replace(/^([^\?\#]*)[\?\#].*$/, "$1")))));
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
                    let assets = await this.#idb.get("assets", { id: route.key });
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
                                files[key] = new CacheResponse(responseFunctionDefinition.assets[key]);
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
    #settings = new Map();
    #settingsListenerMap = new Map();
    getSetting(key) {
        return this.#settings.get(key);
    }
    async setSetting(key, value) {
        let old_value = this.#settings.get(key);
        this.#settings.set(key, value);
        if (this.#settingsListenerMap.has(key)) {
            await this.#settingsListenerMap.get(key)(old_value, value);
        }
        await this.#idb.put("settings", { key, value });
    }
    async #log(type, message, stack) {
        await this.#idb.put("log", {
            timestamp: Date.now(),
            type,
            message,
            stack
        });
    }
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
        await this.#idb.delete("log");
        this.#log("clear", "Das Protokoll wurde erfolgreich gelöscht", null);
        console.clear();
    }
    async getLog(types = {
        log: true,
        warn: true,
        error: true
    }) {
        if (types.log && types.warn && types.error) {
            return this.#idb.get("log");
        }
        else {
            let type_array = [];
            types.log && type_array.push("log");
            types.warn && type_array.push("warn");
            types.error && type_array.push("error");
            return this.#idb.get("log", {
                type: new RegExp("^(" + type_array.join("|") + ")$")
            });
        }
    }
    #responseFunctions = new Map();
    async registerResponseFunction(id, assets, responseFunction) {
        await Promise.all(Object.values(assets).map(async (asset) => {
            if (asset.startsWith("local://")) {
                return;
            }
            if ((await this.#idb.count("assets", { id: asset })) == 0) {
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
        await this.#idb.add("routes", route);
    }
    async registerAsset(id, blob) {
        await this.#idb.put("assets", { id, blob });
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
        await this.#idb.add("routes", Object.assign({
            storage: "dynamic",
            priority: 0,
            script: "local://null",
            function: "redirect",
            files: {},
            arguments: [destination]
        }, routeSelector));
    }
    #ononline = null;
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
    #onoffline = null;
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
    #onconnected = null;
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
    #ondisconnected = null;
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
    #onbeforeinstall = null;
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
    #oninstall = null;
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
    #onafterinstall = null;
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
    #onbeforeupdate = null;
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
    #onupdate = null;
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
    #onafterupdate = null;
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
    #onbeforeactivate = null;
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
    #onactivate = null;
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
    #onafteractivate = null;
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
    #onbeforefetch = null;
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
    #onfetch = null;
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
    #onafterfetch = null;
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
    #onbeforestart = null;
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
    #onstart = null;
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
    #onafterstart = null;
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
    #onbeforemessage = null;
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
    #onmessage = null;
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
    #onaftermessage = null;
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
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference path="serviceworker.d.ts" />
/// <reference path="helper.ts" />
/// <reference path="cacheresponse.ts" />
/// <reference path="indexeddb.ts" />
/// <reference path="indexeddbindex.ts" />
/// <reference path="indexeddbevent.ts" />
/// <reference path="serverevent.ts" />
/// <reference path="server.ts" />
// const DEBUG_MODE = "online";
const server = new Server();
/// <reference no-default-lib="true" />
/// <reference path="index.ts" />
class CacheResponse {
    [Symbol.toStringTag] = "CacheResponse";
    #response = null;
    #arrayBuffer;
    #blob;
    #formData;
    #json;
    #text;
    #url;
    constructor(url) {
        this.#url = url;
    }
    get url() {
        return this.#url;
    }
    async #getResponse() {
        if (this.#response == null) {
            this.#response = await server.fetch(this.url) || new Response(null, {
                status: 404,
                statusText: "File not cached: " + this.url
            });
        }
    }
    async arrayBuffer() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#arrayBuffer) {
            this.#arrayBuffer = await this.#response.arrayBuffer();
        }
        return this.#arrayBuffer;
    }
    async blob() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#blob) {
            this.#blob = await this.#response.blob();
        }
        return this.#blob;
    }
    async formData() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#formData) {
            this.#formData = await this.#response.formData();
        }
        return this.#formData;
    }
    async json() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#json) {
            this.#json = await this.#response.json();
        }
        return this.#json;
    }
    async text() {
        if (this.#response == null) {
            await this.#getResponse();
        }
        if (!this.#text) {
            this.#text = await this.#response.text();
        }
        return this.#text;
    }
    clone() {
        return new CacheResponse(this.#url);
    }
}
/// <reference no-default-lib="true" />
/// <reference path="server/index.ts" />
// server.setSetting("site-title", "ServiceWorkerServer");
// server.setSetting("theme-color", "#000000");
server.setSetting("copyright", "\u00a9 " + new Date().getFullYear() + " MPDieckmann.");
// server.setSetting("server-icon", Server.APP_SCOPE + "/client/png/index/${p}/${w}-${h}.png");
// server.setSetting("access-token", "default-access");
// server.setSetting("id", "default");
server.start();
/// <reference no-default-lib="true" />
/// <reference path="config.ts" />
/// <reference no-default-lib="true" />
/// <reference path="../server/server.ts" />
class Scope {
    [Symbol.toStringTag] = "Scope";
    GET = {};
    POST = {};
    REQUEST = {};
    url;
    ready;
    request;
    #status = 200;
    get status() {
        return this.#status;
    }
    set status(value) {
        if (value > 100 && value < 600) {
            this.#status = value;
        }
    }
    statusText = "OK";
    #headers = new Headers({
        "Content-Type": "text/html;charset=utf8"
    });
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
    site_title = "";
    page_title = "";
    data;
    constructor(request, data = {}) {
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
     * Füllt den Template-String mit Daten
     *
     * @param template Der Template-String
     */
    async build(template) {
        if (template instanceof CacheResponse) {
            template = await template.text();
        }
        let matches = template.match(/\{\{ (generate_[a-z0-9_]+)\(([a-z0-9_, -+]*)\) \}\}/g);
        if (matches) {
            for (let value of matches) {
                let match = /\{\{ (generate_[a-z0-9_]+)\(([a-z0-9_, -+]*)\) \}\}/.exec(value);
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
        if (template instanceof CacheResponse) {
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
        let html = "<ul class=\"" + this.htmlspecialchars(options.menu_class) + "\">";
        for (let id in menu) {
            let item = menu[id];
            html += "<li class=\"" + this.htmlspecialchars(options.entry_class);
            if ("submenu" in item && Object.keys(item.submenu).length > 0) {
                html += " has-submenu";
            }
            let url = new URL(new Request(item.href).url);
            if (this.url.origin + this.url.pathname == url.origin + url.pathname) {
                html += " selected";
            }
            html += "\" id=\"" + this.htmlspecialchars(options.id_prefix + id) + "_item\"><a href=\"" + this.htmlspecialchars(item.href) + "\" id=\"" + this.htmlspecialchars(id) + "\">" + this.htmlspecialchars(item.label) + "</a>";
            if ("submenu" in item && Object.keys(item.submenu).length > 0) {
                html += this.build_menu(item.submenu, Object.assign({
                    id_prefix: this.htmlspecialchars("id_prefix" in options ? options.id_prefix + "-" + id + "-" : id + "-"),
                    menu_class: options.submenu_class,
                }, options));
            }
            html += "</li>";
        }
        html += "</ul>";
        return html;
    }
    /**
     * Convert special characters to HTML entities
     *
     * @param string The string being converted.
     * @return The converted string.
     */
    htmlspecialchars(string) {
        return string.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    }
    #styles = {};
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
        this.#styles[id] = { id, href: href instanceof CacheResponse ? href.url : href, media, type };
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
    #scripts = {};
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
        this.#scripts[id] = { id, src: src instanceof CacheResponse ? src.url : src, type, position };
    }
    /**
     * Löscht ein zuvor hinzugefügtes Skript
     *
     * @param id ID des Skripts
     */
    remove_script(id) {
        delete this.#scripts[id];
    }
    #menus = {};
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
    #toasts = [];
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
                return this.htmlspecialchars(String(this.data[index]));
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
     * Gibt die Version des Servers zurück
     *
     * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
     */
    generate_version(escape) {
        return this.generate_value.call({ version: "Version: " + server.version + (server.online ? " (Online)" : " (Offline)") }, "version", escape);
    }
    /**
     * Gibt die Copyright-Zeichenfolge des Servers zurück
     *
     * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
     */
    generate_copyright(escape) {
        return this.generate_value.call({ copyright: server.getSetting("copyright") }, "copyright", escape);
    }
    /**
     * Gibt die Version des Servers zurück
     *
     * @param escape Gibt an, wie die Zeichenfolge formatiert werden soll
     */
    generate_url(url = "", escape = "url") {
        return this.generate_value.call({ url: server.scope + url }, "url", escape);
    }
    /**
     *
     * @param hidden
     * @returns
     */
    generate_offline_switch(hidden) {
        return `<input type="checkbox" name="switch_offline_mode" class="switch_offline_mode" onclick="navigator.serviceWorker.controller.postMessage({type:&quot;set-setting&quot;,property:&quot;offline-mode&quot;,value:this.checked})" ${server.getSetting("offline-mode") ? ' checked=""' : ""}${hidden == "true" ? "" : ' hidden="'}/>`;
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
                return this.htmlspecialchars(this.page_title);
            case "site":
                return this.htmlspecialchars(this.site_title);
            case "full":
            default:
                if (this.page_title) {
                    return this.htmlspecialchars(this.page_title + " | " + this.site_title);
                }
                else {
                    return this.htmlspecialchars(this.site_title);
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
            html += "<link id=\"" + this.htmlspecialchars(style.id) + "\" rel=\"stylesheet\" href=\"" + this.htmlspecialchars(style.href) + "\" media=\"" + this.htmlspecialchars(style.media) + "\" type=\"" + this.htmlspecialchars(style.type) + "\" />";
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
                html += "<script id=\"" + this.htmlspecialchars(script.id) + "\" src=\"" + this.htmlspecialchars(script.src) + "\" type=\"" + this.htmlspecialchars(script.type) + "\"></script>";
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
        let entries = await server.getLog(options);
        if (entries.length == 0 && hide_empty == "true") {
            return "";
        }
        return `<span class="${this.htmlspecialchars(type)}-badge">${this.htmlspecialchars("" + entries.length)}</span>`;
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
/// <reference no-default-lib="true" />
/// <reference path="../config.ts" />
/// <reference path="../plugins/scope.ts" />
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
                return `<div class="value-non-primitive">${prefix}<span class="value type-${typeof prop}"><a href="#${scope.htmlspecialchars(encodeURIComponent(props.get(prop)))}">${props.get(prop)}</a></span></div>`;
            }
            let obj_id;
            if (typeof prop == "function") {
                obj_id = scope.htmlspecialchars(prop.toString().split(" ", 1)[0] == "class" ? "class" : "function") + " " + scope.htmlspecialchars(prop.name);
                if (!props.has(prop)) {
                    let count = props.counters.get(obj_id) || 0;
                    props.counters.set(obj_id, ++count);
                    obj_id += `#${count}(${scope.htmlspecialchars(prop.length)} argument${prop.length == 1 ? "" : "s"})`;
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
            return `<details class="value-non-primitive" id="${scope.htmlspecialchars(encodeURIComponent(props.get(prop)))}"><summary>${prefix}<span class="value type-${typeof prop}">${obj_id}</span></summary>${[Object.getOwnPropertyNames(prop), Object.getOwnPropertySymbols(prop)].flat().map(key => {
                let desc = Object.getOwnPropertyDescriptor(prop, key);
                let html = "";
                if (typeof desc.get == "function") {
                    html += `<div class="property-${desc.enumerable ? "" : "non-"}enumerable">${expand_property(props, desc.get, `<span class="property-key"><span class="property-descriptor">get</span> ${scope.htmlspecialchars(key.toString())}</span>: `)}</div>`;
                }
                if (typeof desc.set == "function") {
                    html += `<div class="property-${desc.enumerable ? "" : "non-"}enumerable">${expand_property(props, desc.set, `<span class="property-key"><span class="property-descriptor">set</span> ${scope.htmlspecialchars(key.toString())}</span>: `)}</div>`;
                }
                if (typeof desc.get != "function" &&
                    typeof desc.set != "function") {
                    html += `<div class="property-${desc.enumerable ? "" : "non-"}enumerable">${expand_property(props, desc.value, `<span class="property-key">${desc.writable ? "" : `<span class="property-descriptor">readonly</span> `}${scope.htmlspecialchars(key.toString())}</span>: `)}</div>`;
                }
                return html;
            }).join("") + `<div class="property-non-enumerable">${expand_property(props, Object.getPrototypeOf(prop), `<span class="property-key"><span class="property-descriptor">[[Prototype]]:</span></span> `, true)}`}</details>`;
        }
        else {
            return `<div class="value-primitive">${prefix}<span class="value type-${typeof prop}">${scope.htmlspecialchars("" + prop)}</span></div>`;
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
            return `<details class="log-${scope.htmlspecialchars("" + entry.type)}">
      <summary><span class="timestamp">${scope.htmlspecialchars(date("d.m.Y h:i:s", entry.timestamp))}</span> ${expand_property(new Map(), entry.message)}</summary>
      ${expand_property(new Map(), entry.stack)}
    </details>`;
        }
        return `<div class="log-${scope.htmlspecialchars("" + entry.type)}"><span class="timestamp">${scope.htmlspecialchars(date("d.m.Y h:i:s", entry.timestamp))}</span> ${scope.htmlspecialchars("" + entry.message)}</div>`;
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
/// <reference no-default-lib="true" />
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
        main: `<ul>
<li><a href="/train">Trainieren</a></li>
<li><a href="/debug">Debug</a></li>
<li><a href="/list">Liste</a></li>
</ul>`,
    };
    return new Response(await scope.build(files["layout.html"]), scope);
});
/// <reference no-default-lib="true" />
/// <reference path="../config.ts" />
server.registerRedirection({
    priority: 1,
    type: "regexp",
    regexp: new RegExp("^" + server.regex_safe_scope + "/install(.[a-z0-9]+)?$", "i")
}, "/");
/// <reference no-default-lib="true" />
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