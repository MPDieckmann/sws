/// <reference path="../config.ts" />

server.registerRedirection({
  priority: 1,
  type: "regexp",
  regexp: new RegExp("^" + server.regex_safe_scope + "/install(.[a-z0-9]+)?$", "i")
}, "/");
