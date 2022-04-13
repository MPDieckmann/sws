/// <reference path="../../server/index.ts" />

abstract class LoginInterface extends EventTarget {
  public abstract isLoggedIn(): boolean | PromiseLike<boolean>;
  public abstract login(): PromiseLike<boolean>;
  public abstract logout(): PromiseLike<boolean>;

  #onbeforelogin: (this: this, ev: LoginInterfaceEventMap["beforelogin"]) => any = null;
  get onbeforelogin() {
    return this.#onbeforelogin;
  }
  set onbeforelogin(value: (this: this, ev: LoginInterfaceEventMap["beforelogin"]) => any) {
    if (this.#onbeforelogin) {
      this.removeEventListener("beforelogin", this.#onbeforelogin);
    }
    if (typeof value == "function") {
      this.#onbeforelogin = value;
      this.addEventListener("beforelogin", value);
    } else {
      this.#onbeforelogin = null;
    }
  }
  #onlogin: (this: this, ev: LoginInterfaceEventMap["login"]) => any = null;
  get onlogin() {
    return this.#onlogin;
  }
  set onlogin(value: (this: this, ev: LoginInterfaceEventMap["login"]) => any) {
    if (this.#onlogin) {
      this.removeEventListener("login", this.#onlogin);
    }
    if (typeof value == "function") {
      this.#onlogin = value;
      this.addEventListener("login", value);
    } else {
      this.#onlogin = null;
    }
  }
  #onafterlogin: (this: this, ev: LoginInterfaceEventMap["afterlogin"]) => any = null;
  get onafterlogin() {
    return this.#onafterlogin;
  }
  set onafterlogin(value: (this: this, ev: LoginInterfaceEventMap["afterlogin"]) => any) {
    if (this.#onafterlogin) {
      this.removeEventListener("afterlogin", this.#onafterlogin);
    }
    if (typeof value == "function") {
      this.#onafterlogin = value;
      this.addEventListener("afterlogin", value);
    } else {
      this.#onafterlogin = null;
    }
  }

  #onbeforelogout: (this: this, ev: LoginInterfaceEventMap["beforelogout"]) => any = null;
  get onbeforelogout() {
    return this.#onbeforelogout;
  }
  set onbeforelogout(value: (this: this, ev: LoginInterfaceEventMap["beforelogout"]) => any) {
    if (this.#onbeforelogout) {
      this.removeEventListener("beforelogout", this.#onbeforelogout);
    }
    if (typeof value == "function") {
      this.#onbeforelogout = value;
      this.addEventListener("beforelogout", value);
    } else {
      this.#onbeforelogout = null;
    }
  }
  #onlogout: (this: this, ev: LoginInterfaceEventMap["logout"]) => any = null;
  get onlogout() {
    return this.#onlogout;
  }
  set onlogout(value: (this: this, ev: LoginInterfaceEventMap["logout"]) => any) {
    if (this.#onlogout) {
      this.removeEventListener("logout", this.#onlogout);
    }
    if (typeof value == "function") {
      this.#onlogout = value;
      this.addEventListener("logout", value);
    } else {
      this.#onlogout = null;
    }
  }
  #onafterlogout: (this: this, ev: LoginInterfaceEventMap["afterlogout"]) => any = null;
  get onafterlogout() {
    return this.#onafterlogout;
  }
  set onafterlogout(value: (this: this, ev: LoginInterfaceEventMap["afterlogout"]) => any) {
    if (this.#onafterlogout) {
      this.removeEventListener("afterlogout", this.#onafterlogout);
    }
    if (typeof value == "function") {
      this.#onafterlogout = value;
      this.addEventListener("afterlogout", value);
    } else {
      this.#onafterlogout = null;
    }
  }
}

interface LoginInterface {
  addEventListener<K extends keyof LoginInterfaceEventMap>(type: K, listener: (this: this, ev: LoginInterfaceEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: (this: this, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener<K extends keyof LoginInterfaceEventMap>(type: K, listener: (this: this, ev: LoginInterfaceEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: (this: this, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  awaitEventListener<SK extends keyof LoginInterfaceEventMap, EK extends keyof LoginInterfaceEventMap>(resolve_type: SK, reject_type?: EK): Promise<LoginInterfaceEventMap[SK]>;
  awaitEventListener<EK extends keyof LoginInterfaceEventMap>(resolve_type: string, reject_type?: EK): Promise<Event>;
  awaitEventListener<SK extends keyof LoginInterfaceEventMap>(resolve_type: SK, reject_type?: string): Promise<LoginInterfaceEventMap[SK]>;
  awaitEventListener(resolve_type: string, reject_type?: string): Promise<Event>;
}

interface LoginInterfaceEventMap {
  beforelogin: ServerEvent<"login">;
  login: ServerEvent<"login">;
  afterlogin: ServerEvent<"login">;
  
  beforelogout: ServerEvent<"logout">;
  logout: ServerEvent<"logout">;
  afterlogout: ServerEvent<"logout">;
}

interface ServerEventGroupMap {
  "login": {
    await(promise: PromiseLike<any>): void;
  }
  "logout": {
    await(promise: PromiseLike<any>): void;
  }
}
