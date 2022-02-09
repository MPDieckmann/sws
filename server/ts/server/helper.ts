Number.prototype.toFloatingString = function (this: number, decimals: number): string {
  let value: string = this.toString();
  if (decimals > 0) {
    let floatings = new Array(decimals).fill(0).join("");
    if (value.indexOf(".") > -1) {
      let split = value.split(".");
      if (split[1].length >= floatings.length) {
        return split[0] + "." + split[1].substr(0, floatings.length);
      } else {
        return value + floatings.substr(split[1].length);
      }
    } else {
      return value + "." + floatings;
    }
  } else {
    return value.split(".")[0];
  }
};

interface Number {
  toFloatingString(decimals: number): string;
}

String.prototype.toRegExp = function (this: string, flags: string = ""): RegExp {
  return new RegExp(this.replace(/([\\\/\[\]\{\}\?\*\+\.\^\$\(\)\:\=\!\|\,])/g, "\\$1"), flags);
}

String.prototype.escape = function (this: string, escapable: string = "", escapeWith: string) {
  return this.replace(new RegExp(escapable.replace(/([\\\/\[\]\{\}\?\*\+\.\^\$\(\)\:\=\!\|\,])/g, "\\$1"), "g"), escapeWith.replace(/([\\\/\[\]\{\}\?\*\+\.\^\$\(\)\:\=\!\|\,])/g, "\\$1") + "$1");
}

String.ESCAPE_REGEXP = "\\/[]{}?*+.^$():=!|,";

interface StringConstructor {
  ESCAPE_REGEXP: string;
}

interface String {
  toRegExp(flags?: string): RegExp;
  escape(escapable?: string, escapeChar?: string): string;
}
