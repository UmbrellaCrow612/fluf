import { EventEmitter } from "node:stream";


/**
 * Used as thw standard way for applications that want to communicate with fluf IPC API to use
 */
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
