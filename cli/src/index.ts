import net from 'node:net';

const PORT = 3214;
const HOST = "127.0.0.1";

// Define available commands with proper typing
type CommandHandler = (args: string[]) => object;

const COMMANDS: Record<string, CommandHandler> = {
    ping: () => ({ type: 'ping', timestamp: Date.now() })
};

const client = net.createConnection({ port: PORT, host: HOST }, () => {
    console.error("Connected to server");
    console.error("Available commands: ping");
});

// Buffer for incomplete lines
let buffer = '';

process.stdin.on('data', (data) => {
    buffer += data.toString();

    // Process complete lines
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Parse command
        const parts = trimmed.split(/\s+/);
        // @ts-ignore
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        const handler = COMMANDS[cmd];
        if (handler) {
            const payload = handler(args);
            const message = JSON.stringify(payload) + '\n';
            client.write(message);
            console.error(`Sent: ${cmd}`);
        } else {
            console.error(`Unknown command: ${cmd}`);
            console.error("Available: ping");
        }
    }
});

process.stdin.on('end', () => {
    client.end();
});

// Handle responses from server
client.on('data', (data) => {
    process.stdout.write(data);
});

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