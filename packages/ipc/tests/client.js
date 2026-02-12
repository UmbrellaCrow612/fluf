import { IPCClient } from "../dist/index.js";

async function main() {
  let client = new IPCClient();

  client.on("connect", () => {
    console.log("Connected to server");
  });

  client.on("disconnect", () => {
    console.log("disconnect to server");
  });

  client.on("error", (err) => {
    console.error("Error: ", err);
  });

  client.on("response", (res) => {
    console.log("Response ", JSON.stringify(res));
  });

  await client.connect();

  let res = await client.openFile(`C:\\dev\\fluf\\packages\\ipc`, "file-x");
  console.log("Res here ", JSON.stringify(res));

  let resTwo = await client.closeFile("C:\\dev\\fluf\\packages\\ipc", "file-x");
  console.log("Here two ", JSON.stringify(resTwo));

  setTimeout(async () => {
    await client.disconnect();
  }, 5000);
}

main();
