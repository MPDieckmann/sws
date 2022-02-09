/// <reference path="../server/index.ts" />

abstract class APIFetchInterface extends EventTarget {
  public abstract readonly API_VERSION: number;
  public abstract readonly API_SCOPE: string;
  public abstract readonly API_SCOPE_REGEXP: RegExp;
  public abstract is_connected(): PromiseLike<boolean>;
  protected abstract ping(): void | PromiseLike<void>;
  public abstract fetch(func: string, args?: any): PromiseLike<any>;

  #pinging: boolean = false;
  #connected: boolean = false;
  get connected() { return this.#connected; }
  get pinging() { return this.#pinging; }
  get online() { return Server.server.online; }
  #pingTimeout: number = 5000;
  get pingTimeout() {
    return this.#pingTimeout;
  }
  set pingTimeout(value: number) {
    if (value < 1000) {
      value = 1000;
    }
    this.#pingTimeout = value;
  }

  constructor() {
    super();

    Server.server.addEventListener("beforefetch", event => {
      if (this.API_SCOPE_REGEXP.test(event.data.url)) {
        event.data.respondWith(globalThis.fetch(event.data.request));
      }
    });

    Server.server.addEventListener("online", async () => {
      while (this.online && this.#pingTimeout) {
        if (this.#pinging) {
          await this.awaitEventListener("afterping");
          await this.#ping();
        } else {
          await this.#ping();
        }
        await new Promise(resolve => setTimeout(resolve, this.#pingTimeout));
      }
      if (!this.online && this.#connected) {
        this.#connected = false;
        this.dispatchEvent(new ServerEvent("disconnected", { cancelable: false, group: "network", data: null }));
      }
    });
  }

  async #ping() {
    if (!this.#pinging) {
      let promises: PromiseLike<void>[] = [];
      this.dispatchEvent(new ServerEvent("beforeping", { cancelable: false, group: "ping", data: { await(promise) { promises.push(promise); } } }));
      await Promise.all(promises);
      this.#pinging = true;

      let connected = await this.is_connected();
      if (connected != this.#connected) {
        if (connected) {
          this.#connected = true;
          this.dispatchEvent(new ServerEvent("connected", { cancelable: false, group: "network", data: null }));
        } else {
          this.#connected = false;
          this.dispatchEvent(new ServerEvent("disconnected", { cancelable: false, group: "network", data: null }));
        }
      }

      if (this.#connected) {
        promises = [];
        this.dispatchEvent(new ServerEvent("ping", { cancelable: false, group: "ping", data: { await(promise) { promises.push(promise); } } }));
        await this.ping();
        await Promise.all(promises);

        this.#pinging = false;
        promises = [];
        this.dispatchEvent(new ServerEvent("afterping", { cancelable: false, group: "ping", data: { await(promise) { promises.push(promise); } } }));
        await Promise.all(promises);
      } else {
        this.#pinging = false;
      }
    }
  }

  #onconnected: (this: this, ev: APIFetchInterfaceEventMap["connected"]) => any = null;
  get onconnected() {
    return this.#onconnected;
  }
  set onconnected(value: (this: this, ev: APIFetchInterfaceEventMap["connected"]) => any) {
    if (this.#onconnected) {
      this.removeEventListener("connected", this.#onconnected);
    }
    if (typeof value == "function") {
      this.#onconnected = value;
      this.addEventListener("connected", value);
    } else {
      this.#onconnected = null;
    }
  }
  #ondisconnected: (this: this, ev: APIFetchInterfaceEventMap["disconnected"]) => any = null;
  get ondisconnected() {
    return this.#ondisconnected;
  }
  set ondisconnected(value: (this: this, ev: APIFetchInterfaceEventMap["disconnected"]) => any) {
    if (this.#ondisconnected) {
      this.removeEventListener("disconnected", this.#ondisconnected);
    }
    if (typeof value == "function") {
      this.#ondisconnected = value;
      this.addEventListener("disconnected", value);
    } else {
      this.#ondisconnected = null;
    }
  }

  #onbeforefetch: (this: this, ev: APIFetchInterfaceEventMap["beforefetch"]) => any = null;
  get onbeforefetch() {
    return this.#onbeforefetch;
  }
  set onbeforefetch(value: (this: this, ev: APIFetchInterfaceEventMap["beforefetch"]) => any) {
    if (this.#onbeforefetch) {
      this.removeEventListener("beforefetch", this.#onbeforefetch);
    }
    if (typeof value == "function") {
      this.#onbeforefetch = value;
      this.addEventListener("beforefetch", value);
    } else {
      this.#onbeforefetch = null;
    }
  }
  #onfetch: (this: this, ev: APIFetchInterfaceEventMap["fetch"]) => any = null;
  get onfetch() {
    return this.#onfetch;
  }
  set onfetch(value: (this: this, ev: APIFetchInterfaceEventMap["fetch"]) => any) {
    if (this.#onfetch) {
      this.removeEventListener("fetch", this.#onfetch);
    }
    if (typeof value == "function") {
      this.#onfetch = value;
      this.addEventListener("fetch", value);
    } else {
      this.#onfetch = null;
    }
  }
  #onafterfetch: (this: this, ev: APIFetchInterfaceEventMap["afterfetch"]) => any = null;
  get onafterfetch() {
    return this.#onafterfetch;
  }
  set onafterfetch(value: (this: this, ev: APIFetchInterfaceEventMap["afterfetch"]) => any) {
    if (this.#onafterfetch) {
      this.removeEventListener("afterfetch", this.#onafterfetch);
    }
    if (typeof value == "function") {
      this.#onafterfetch = value;
      this.addEventListener("afterfetch", value);
    } else {
      this.#onafterfetch = null;
    }
  }

  #onbeforeping: (this: this, ev: APIFetchInterfaceEventMap["beforeping"]) => any = null;
  get onbeforeping() {
    return this.#onbeforeping;
  }
  set onbeforeping(value: (this: this, ev: APIFetchInterfaceEventMap["beforeping"]) => any) {
    if (this.#onbeforeping) {
      this.removeEventListener("beforeping", this.#onbeforeping);
    }
    if (typeof value == "function") {
      this.#onbeforeping = value;
      this.addEventListener("beforeping", value);
    } else {
      this.#onbeforeping = null;
    }
  }
  #onping: (this: this, ev: APIFetchInterfaceEventMap["ping"]) => any = null;
  get onping() {
    return this.#onping;
  }
  set onping(value: (this: this, ev: APIFetchInterfaceEventMap["ping"]) => any) {
    if (this.#onping) {
      this.removeEventListener("ping", this.#onping);
    }
    if (typeof value == "function") {
      this.#onping = value;
      this.addEventListener("ping", value);
    } else {
      this.#onping = null;
    }
  }
  #onafterping: (this: this, ev: APIFetchInterfaceEventMap["afterping"]) => any = null;
  get onafterping() {
    return this.#onafterping;
  }
  set onafterping(value: (this: this, ev: APIFetchInterfaceEventMap["afterping"]) => any) {
    if (this.#onafterping) {
      this.removeEventListener("afterping", this.#onafterping);
    }
    if (typeof value == "function") {
      this.#onafterping = value;
      this.addEventListener("afterping", value);
    } else {
      this.#onafterping = null;
    }
  }
}

interface APIFetchInterface {
  addEventListener<K extends keyof APIFetchInterfaceEventMap>(type: K, listener: (this: this, ev: APIFetchInterfaceEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: (this: this, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof APIFetchInterfaceEventMap>(type: K, listener: (this: this, ev: APIFetchInterfaceEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: (this: this, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  awaitEventListener<SK extends keyof APIFetchInterfaceEventMap, EK extends keyof APIFetchInterfaceEventMap>(resolve_type: SK, reject_type?: EK): Promise<APIFetchInterfaceEventMap[SK]>;
  awaitEventListener<EK extends keyof APIFetchInterfaceEventMap>(resolve_type: string, reject_type?: EK): Promise<Event>;
  awaitEventListener<SK extends keyof APIFetchInterfaceEventMap>(resolve_type: SK, reject_type?: string): Promise<APIFetchInterfaceEventMap[SK]>;
  awaitEventListener(resolve_type: string, reject_type?: string): Promise<Event>;
}

interface APIFetchInterfaceEventMap {
  connected: ServerEvent<"network">;
  disconnected: ServerEvent<"network">;

  beforefetch: ServerEvent<"fetch">;
  fetch: ServerEvent<"fetch">;
  afterfetch: ServerEvent<"fetch">;

  beforeping: ServerEvent<"ping">;
  ping: ServerEvent<"ping">;
  afterping: ServerEvent<"ping">;
}

interface ServerEventGroupMap {
  ping: {
    await(promise: PromiseLike<any>): void;
  };
}
