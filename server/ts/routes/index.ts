/// <reference no-default-lib="true" />
/// <reference path="../config.ts" />

server.registerRoute({
  type: "regexp",
  regexp: new RegExp("^" + server.regex_safe_scope + "\\/(index(.[a-z0-9]+)?)?$", "g"),
  storage: "dynamic",
  script: null,
  function: server.scope + "/index.html",
  arguments: []
});

server.registerResponseFunction(server.scope + "/index.html", async (request, args) => {
  let files = {
    "mpc.css": new CacheResponse(server.scope + "/client/css/mpc.css"),
    "main.css": new CacheResponse(server.scope + "/client/css/main.css"),
    "print.css": new CacheResponse(server.scope + "/client/css/print.css"),
    "main.js": new CacheResponse(server.scope + "/client/js/main.js"),
    "layout.html": new CacheResponse(server.scope + "/client/html/layout.html")
  };
  let scope = new Scope(request);

  scope.add_style("mpc-css", this.files["mpc.css"]);
  scope.add_style("main-css", this.files["main.css"]);
  scope.add_style("print-css", this.files["print.css"], "print");
  scope.add_script("main-js", this.files["main.js"]);

  scope.page_title = "Startseite";
  scope.data = {
    main: `<ul>
<li><a href="/train">Trainieren</a></li>
<li><a href="/debug">Debug</a></li>
<li><a href="/list">Liste</a></li>
</ul>`,
  };

  return new Response(await this.build(files["layout.html"]), scope);
});
