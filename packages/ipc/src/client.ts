import { EventEmitter } from "node:stream";

export class IPCClient extends EventEmitter {
  constructor() {
    super();
  }

  async connect() {}

  async send(){

  }
}


let c = new IPCClient()

c.on("", () => {

})
