abstract class MPExpanderBase extends EventTarget {
  readonly element = document.createElement("mpc-expander");
  readonly labelElement = document.createElement("mpc-expander-label");
  constructor(options: MPExpanderBaseInit) {
    super();
    this.element.appendChild(this.labelElement);
    this.labelElement.addEventListener("click", () => this.expanded = !this.element.hasAttribute("expanded"));

    if (typeof options.onexpandonce == "function") {
      this.addEventListener("expand", function expand(event) {
        if (!options.onexpand(<MPExpander>event.target)) {
          event.target.removeEventListener("expand", expand);
        }
      });
    }
    if (typeof options.onexpand == "function") {
      this.addEventListener("expand", () => options.onexpand(this));
    }
    if (typeof options.oncollapse == "function") {
      this.addEventListener("collapse", () => options.oncollapse(this));
    }
    if (
      typeof options.expanded == "boolean" ||
      options.expanded == "true" ||
      options.expanded == "false"
    ) {
      this.expanded = options.expanded;
    }
  }
  get expanded() {
    return this.element.hasAttribute("expanded");
  }
  set expanded(value: boolean | `${boolean}`) {
    if (value != this.expanded) {
      if (value === true || value === "true") {
        if (this.dispatchEvent(new Event("expand"))) {
          this.element.setAttribute("expanded", "");
        }
      } else {
        if (this.dispatchEvent(new Event("collapse"))) {
          this.element.removeAttribute("expand");
        }
      }
    }
  }
}

interface MPExpanderBaseInit {
  onexpand?: (expander: MPExpanderBase) => void | PromiseLike<void>;
  oncollapse?: (expander: MPExpanderBase) => void | PromiseLike<void>;
  onexpandonce?: (expander: MPExpanderBase) => void | PromiseLike<void>;
  expanded?: boolean | `${boolean}`;
}

class MPExpander extends MPExpanderBase {
  constructor(options: MPExpanderInit) {
    super(options);
    this.label = options.label || "MPExpander";
  }

  get label() {
    return this.labelElement.textContent;
  }
  set label(value: string) {
    this.labelElement.textContent = value;
  }
}

interface MPExpanderInit extends MPExpanderBaseInit {
  onexpand?: (expander: MPExpander) => void | PromiseLike<void>;
  oncollapse?: (expander: MPExpander) => void | PromiseLike<void>;
  onexpandonce?: (expander: MPExpander) => void | PromiseLike<void>;
  label: string;
}

class MPPropertyExpander<T> extends MPExpanderBase {
  #property: T;
  propertyNameElement = document.createElement("span");
  propertyValueElement = document.createElement("span");

  readonly type: ToTypeString<T>;

  static createPropertyDescriptorList(property: any, sorted: boolean = true) {
    let properties: MPPropertyDescriptor[] = [];
    (<(string | symbol)[]>Object.getOwnPropertyNames(property)).concat(Object.getOwnPropertySymbols(property)).forEach(name => {
      let desc = Object.getOwnPropertyDescriptor(property, name);
      if (
        typeof desc.get == "function" ||
        typeof desc.set == "function"
      ) {
        properties.push({
          name,
          type: "get",
          enumerable: desc.enumerable,
          writable: desc.configurable,
          configurable: desc.configurable,
          value: desc.get
        });
        properties.push({
          name,
          type: "value",
          enumerable: desc.enumerable,
          writable: typeof desc.set == "function",
          configurable: desc.configurable,
          get: desc.get
        });
        properties.push({
          name,
          type: "set",
          enumerable: desc.enumerable,
          writable: desc.configurable,
          configurable: desc.configurable,
          value: desc.set
        });
      } else {
        properties.push({
          name,
          type: "value",
          enumerable: desc.enumerable,
          writable: desc.writable,
          configurable: desc.configurable,
          value: desc.value
        });
      }
    });
    let prototype = Object.getPrototypeOf(property);
    this.createPropertyDescriptorList(prototype, false).forEach(prop => {
      if (prop.type == "value" && typeof prop.get == "function") {
        properties.push(prop);
      }
    });
    properties.push({
      name: "[[Prototype]]",
      type: "internal",
      enumerable: true,
      writable: true,
      configurable: false,
      value: prototype
    });
    if (sorted) {
      properties.sort(this.PropertiesSorter);
    }
    return properties;
  }
  static PropertiesSorter(a: MPPropertyDescriptor, b: MPPropertyDescriptor) {
    if (typeof a.name == typeof b.name) {
      if (a.name == b.name) {
        if (a.type == b.type) {
          return 0;
        } else if (a.type == "value") {
          return -1;
        } else if (b.type == "value") {
          return 1;
        } else if (a.type == "get") {
          return -1;
        } else if (b.type == "get") {
          return 1;
        } else if (a.type == "set") {
          return -1;
        } else if (b.type == "set") {
          return 1;
        } else {
          return 1;
        }
      } else if (a.name.toString() > b.name.toString()) {
        return 1;
      } else {
        return -1;
      }
    } else if (typeof a.name == "symbol") {
      return 1;
    } else {
      return -1;
    }
  }
  constructor(options: MPPropertyExpanderInit<T>) {
    if (typeof options.onexpandonce != "function") {
      if (/function|regexp|iterable|object/.test(MPPropertyExpander.toTypeString(options.property))) {
        options.onexpandonce = () => {
          let properties = MPPropertyExpander.createPropertyDescriptorList(this.#property);
          properties.forEach(prop => {
            let options = <MPPropertyExpanderInit<any>>{
              descriptor: prop.type == "get" || prop.type == "set" ? prop.type : prop.writable ? "" : "readonly",
              enumerable: prop.enumerable,
              expanded: false,
              name: prop.name
            };

            if (typeof prop.get == "function") {
              options.property = null;
            } else {
              options.property = prop.value;
            }

            let expander = new MPPropertyExpander(options);
            if (typeof prop.get == "function") {
              expander.propertyValueElement.textContent = "(...)";
              expander.propertyValueElement.addEventListener("click", event => {
                event.preventDefault();
                try {
                  expander.#property = prop.get.call(this.#property);
                } catch (e) {
                  expander.#property = e;
                  expander.element.classList.add("error");
                }
              }, {
                once: true
              })
            }
            this.element.appendChild(expander.element);
          });
        }
      }
    }
    super(options);
    this.labelElement.appendChild(this.propertyNameElement);
    this.labelElement.appendChild(this.propertyValueElement);

    this.#property = options.property;
    this.name = "propertyName" in options && options.name ? options.name : null;
    this.descriptor = "descriptor" in options && options.descriptor ? options.descriptor : null;
    this.enumerable = "enumerable" in options && options.enumerable ? options.enumerable : true;
    // this.configurable = "configurable" in options && options.configurable ? options.configurable : false;
    this.type = MPPropertyExpander.toTypeString(this.#property);
  }

  get name() {
    return this.propertyNameElement.textContent;
  }

  set name(value: string) {
    this.propertyNameElement.textContent = value;
  }

  get descriptor() {
    return <"get" | "set" | "readonly">this.element.getAttribute("descriptor");
  }
  set descriptor(value: "get" | "set" | "readonly") {
    if (value) {
      this.element.setAttribute("descriptor", value);
    } else {
      this.element.removeAttribute("descriptor");
    }
  }

  get enumerable() {
    return this.element.hasAttribute("enumerable");
  }
  set enumerable(value: boolean | `${boolean}`) {
    if (value === true || value === "true") {
      this.element.setAttribute("enumerable", "");
    } else {
      this.element.removeAttribute("enumerable");
    }
  }

  // get configurable() {
  //   return this.element.hasAttribute("configurable");
  // }
  // set configurable(value: boolean | `${boolean}`) {
  //   if (value === true || value === "true") {
  //     this.element.setAttribute("configurable", "");
  //   } else {
  //     this.element.removeAttribute("configurable");
  //   }
  // }

  static toTypeString<T>(property: T): ToTypeString<T>;
  static toTypeString(property: any): string {
    switch (typeof property) {
      case "bigint":
        return "number";
      case "boolean":
      case "function":
      case "number":
      case "string":
      case "symbol":
        return typeof property;
      case "undefined":
        return "null";
      case "object":
        try {
          if (property === null) {
            return "null";
          } else if (property instanceof RegExp) {
            return "regexp"
          } else if (
            ("length" in property && typeof property.length == "number") ||
            ("size" in property && typeof property.size == "number") ||
            ("byteLength" in property && typeof property.byteLength == "number")
          ) {
            return "iterable";
          }
        } catch (e) { }
      default:
        return "object";
    }
  }
}

interface MPPropertyExpanderInit<T> extends MPExpanderBaseInit {
  onexpand?: (expander: MPPropertyExpander<T>) => void | PromiseLike<void>;
  oncollapse?: (expander: MPPropertyExpander<T>) => void | PromiseLike<void>;
  onexpandonce?: (expander: MPPropertyExpander<T>) => void | PromiseLike<void>;
  property?: T;
  get?: () => T | PromiseLike<T>;
  name?: string | null;
  descriptor?: "get" | "set" | "readonly" | null;
  enumerable?: boolean | `${boolean}`;
  // configurable?: boolean | `${boolean}`;
}

interface MPPropertyDescriptor {
  name: string | symbol;
  type: "get" | "set" | "value" | "internal",
  enumerable: boolean;
  writable: boolean;
  configurable: boolean;
  value?: any;
  get?(): any;
}

type ToTypeString<T> =
  T extends T & (null | undefined) ? "null" :
  T extends Function ? "function" :
  T extends number | bigint ? "number" :
  T extends string ? "string" :
  T extends RegExp ? "regexp" :
  T extends { length: number; } | { size: number; } | { byteLength: number; } ? "iterable" :
  T extends boolean ? "boolean" :
  T extends symbol ? "symbol" :
  "object";


class MPRemotePropertyExpander<T> extends MPExpanderBase {

}