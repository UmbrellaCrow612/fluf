const net = require("node:net")

const server = net.createServer((socket) => {
    console.log('Client connected:', socket.remoteAddress + ':' + socket.remotePort);

    socket.on('data', (data) => {
        console.log('Received:', data.toString());
        socket.write('Server received: ' + data);
    });

    socket.on('end', () => {
        console.log('Client disconnected');
    });

    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
});

const PORT = 3214;
const HOST = '127.0.0.1';  // ← Only accepts local connections

server.listen(PORT, HOST, () => {
    console.log(`Server listening on ${HOST}:${PORT}`);
});