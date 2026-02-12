const { IPCServer } = require("../dist/server");

async function main() {
  let server = new IPCServer();

  await server.start()

  server.on("close:file", (foo, bar) => {
    console.log(foo.channel)
  })
}

main()
