class MPCacheResponse {
  [Symbol.toStringTag] = "MPCacheResponse";

  #response: Response = null;
  #arrayBuffer: ArrayBuffer;
  #blob: Blob;
  #formData: FormData;
  #json: any;
  #text: string;
  #url: `${"http" | "https"}://${string}`;
  constructor(url: `${"http" | "https"}://${string}`) {
    this.#url = url;
  }
  get url() {
    return this.#url;
  }
  #getResponse = async () => {
    if (this.#response === null) {
      this.#response = await fetch(this.url);
    }
  }
  async arrayBuffer(): Promise<ArrayBuffer> {
    if (this.#response == null) {
      await this.#getResponse();
    }
    if (!this.#arrayBuffer) {
      this.#arrayBuffer = await this.#response.clone().arrayBuffer();
    }
    return this.#arrayBuffer;
  }
  async blob(): Promise<Blob> {
    if (this.#response == null) {
      await this.#getResponse();
    }
    if (!this.#blob) {
      this.#blob = await this.#response.clone().blob();
    }
    return this.#blob;
  }
  async formData(): Promise<FormData> {
    if (this.#response == null) {
      await this.#getResponse();
    }
    if (!this.#formData) {
      this.#formData = await this.#response.clone().formData();
    }
    return this.#formData;
  }
  async json(): Promise<any> {
    if (this.#response == null) {
      await this.#getResponse();
    }
    if (!this.#json) {
      this.#json = await this.#response.clone().json();
    }
    return this.#json;
  }
  async text(): Promise<string> {
    if (this.#response == null) {
      await this.#getResponse();
    }
    if (!this.#text) {
      this.#text = await this.#response.clone().text();
    }
    return this.#text;
  }
  clone(): MPCacheResponse {
    return new MPCacheResponse(this.#url);
  }
}
