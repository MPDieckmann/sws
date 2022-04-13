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
  let scope = new Scope<"clear_logs">(request);

  scope.add_style("mpc-css", files["mpc.css"]);
  scope.add_style("main-css", files["main.css"]);
  scope.add_style("print-css", files["print.css"], "print");
  scope.add_style("debug-css", files["debug.css"]);
  scope.add_script("main-js", files["main.js"]);

  let main = "";

  if (scope.GET.clear_logs == "1") {
    await server.clearLog();
  }

  function expand_property(props: Map<object, string> & { counters?: Map<string, number> }, prop: any, prefix: string = "", is_prototype: boolean = false) {
    if (!props.counters) {
      props.counters = new Map();
    }
    if (
      typeof prop == "function" ||
      typeof prop == "object" && prop !== null
    ) {
      if (!is_prototype && props.has(prop)) {
        return `<div class="value-non-primitive">${prefix}<span class="value type-${typeof prop}"><a href="#${Scope.htmlspecialchars(encodeURIComponent(props.get(prop)))}">${props.get(prop)}</a></span></div>`;
      }
      let obj_id: string;
      if (typeof prop == "function") {
        obj_id = Scope.htmlspecialchars(prop.toString().split(" ", 1)[0] == "class" ? "class" : "function") + " " + Scope.htmlspecialchars(prop.name);
        if (!props.has(prop)) {
          let count = props.counters.get(obj_id) || 0;
          props.counters.set(obj_id, ++count);
          obj_id += `#${count}(${Scope.htmlspecialchars(prop.length)} argument${prop.length == 1 ? "" : "s"})`;
          props.set(prop, obj_id);
        }
      } else {
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
        if (
          typeof desc.get != "function" &&
          typeof desc.set != "function"
        ) {
          html += `<div class="property-${desc.enumerable ? "" : "non-"}enumerable">${expand_property(props, desc.value, `<span class="property-key">${desc.writable ? "" : `<span class="property-descriptor">readonly</span> `}${Scope.htmlspecialchars(key.toString())}</span>: `)}</div>`;
        }
        return html;
      }).join("") + `<div class="property-non-enumerable">${expand_property(props, Object.getPrototypeOf(prop), `<span class="property-key"><span class="property-descriptor">[[Prototype]]:</span></span> `, true)}`}</details>`;
    } else {
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
