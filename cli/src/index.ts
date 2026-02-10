import net from 'node:net';

const PORT = 3214;
const HOST = "127.0.0.1";

const client = net.createConnection({ port: PORT, host: HOST }, () => {
    console.error("Connected to server");
});

// Pipe stdin directly to socket
process.stdin.pipe(client);

// Pipe socket responses to stdout
client.pipe(process.stdout);

// Handle errors
client.on("error", (err) => {
    console.error("Connection error:", err.message);
    process.exit(1);
});

client.on("end", () => {
    console.error("Server closed connection");
    process.exit(0);
});

client.on("close", () => {
    process.stdin.end();
});