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

server.registerResponseFunction(
  server.scope + "/index.html",
  {
    "mpc.css": server.scope + "/client/css/mpc.css",
    "main.css": server.scope + "/client/css/main.css",
    "print.css": server.scope + "/client/css/print.css",
    "main.js": server.scope + "/client/js/main.js",
    "layout.html": server.scope + "/client/html/layout.html"
  },
  async (request, files, args) => {
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
  }
);
