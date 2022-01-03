/// <reference no-default-lib="true" />
/// <reference path="../config.ts" />

server.registerRedirection({
  type: "regexp",
  regexp: new RegExp("^" + server.regex_safe_scope + "/install(.[a-z0-9]+)?$", "i")
}, "/");
