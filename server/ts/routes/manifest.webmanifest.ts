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

interface ServerSettingsMap {
  "theme-color": string;
  "site-title": string;
}
