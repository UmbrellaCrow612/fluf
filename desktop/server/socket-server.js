const { app, BrowserWindow } = require("electron");
const net = require("net");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const os = require("os");
const { logger } = require("../logger");

// Security: Generate random auth token on each launch
const AUTH_TOKEN = crypto.randomBytes(32).toString("hex");
const SOCKET_PATH = getSocketPath();

function getSocketPath() {
  const tmpDir = os.tmpdir();
  const appName = "myelectron-app";
  
  if (process.platform === "win32") {
    // Windows named pipe
    return `\\\\.\\pipe\\${appName}-${process.pid}`;
  } else {
    // Unix domain socket
    return path.join(tmpDir, `${appName}.${process.pid}.sock`);
  }
}

function writeAuthFile() {
  const authData = {
    socketPath: SOCKET_PATH,
    token: AUTH_TOKEN,
    pid: process.pid,
    started: Date.now()
  };
  
  const authPath = path.join(os.tmpdir(), "myelectron-app.auth");
  fs.writeFileSync(authPath, JSON.stringify(authData), { mode: 0o600 }); // Restrictive permissions
  
  // Also print to stdout for parent process capture
  logger.info("[SOCKET_AUTH]" + JSON.stringify(authData));
  
  return authPath;
}

function createSocketServer() {
  const server = net.createServer((socket) => {
    logger.info("[Socket] Client connected");
    
    let authenticated = false;
    let buffer = "";
    
    socket.on("data", (data) => {
      buffer += data.toString();
      
      // Process complete lines
      let lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const message = JSON.parse(line);
          
          // First message must be auth
          if (!authenticated) {
            if (message.type === "auth" && message.token === AUTH_TOKEN) {
              authenticated = true;
              socket.write(JSON.stringify({ type: "auth", success: true }) + "\n");
              logger.info("[Socket] Client authenticated");
            } else {
              socket.write(JSON.stringify({ type: "auth", success: false }) + "\n");
              socket.end();
              logger.info("[Socket] Auth failed, disconnected");
            }
            continue;
          }
          
          // Handle authenticated commands
          handleCommand(message).then(result => {
            socket.write(JSON.stringify({ type: "response", id: message.id, result }) + "\n");
          }).catch(err => {
            socket.write(JSON.stringify({ type: "error", id: message.id, error: err.message }) + "\n");
          });
          
        } catch (e) {
          socket.write(JSON.stringify({ type: "error", error: "Invalid JSON" }) + "\n");
        }
      }
    });
    
    socket.on("error", (err) => {
      logger.info("[Socket] Error:", err.message);
    });
    
    socket.on("close", () => {
      logger.info("[Socket] Client disconnected");
    });
    
    // Timeout for auth
    setTimeout(() => {
      if (!authenticated && !socket.destroyed) {
        socket.end();
      }
    }, 5000);
  });

  // Cleanup old socket file if exists
  if (process.platform !== "win32" && fs.existsSync(SOCKET_PATH)) {
    try {
      fs.unlinkSync(SOCKET_PATH);
    } catch (e) {}
  }

  server.listen(SOCKET_PATH, () => {
    logger.info(`[Socket] Server listening on ${SOCKET_PATH}`);
    
    // Set restrictive permissions on Unix socket
    if (process.platform !== "win32") {
      fs.chmodSync(SOCKET_PATH, 0o600); // Only owner can read/write
    }
    
    writeAuthFile();
  });

  server.on("error", (err) => {
    logger.error("[Socket] Server error:", err);
  });

  return server;
}

/**
 * @param {any} command 
 */
async function handleCommand(command) {
  const { type, ...params } = command;
  
  switch (type) {
    case "ping":
      return { pong: true, time: Date.now() };
      
    case "window-command":
      // Your existing window logic
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) throw new Error("No window");
      win.webContents.send("socket-command", params);
      return { sent: true };
      
    case "eval":
      const win2 = BrowserWindow.getAllWindows()[0];
      if (!win2) throw new Error("No window");
      return await win2.webContents.executeJavaScript(params.script);
      
    case "get-windows":
      return BrowserWindow.getAllWindows().map(w => ({
        id: w.id,
        title: w.getTitle(),
        visible: w.isVisible()
      }));
      
    case "reload":
      const win3 = BrowserWindow.getAllWindows()[0];
      if (win3) win3.reload();
      return { reloaded: true };
      
    case "focus":
      const win4 = BrowserWindow.getAllWindows()[0];
      if (win4) {
        win4.focus();
        win4.show();
      }
      return { focused: true };
      
    case "screenshot":
      const win5 = BrowserWindow.getAllWindows()[0];
      if (!win5) throw new Error("No window");
      const img = await win5.webContents.capturePage();
      return { 
        data: img.toPNG().toString("base64"),
        size: img.getSize()
      };
      
    default:
      throw new Error(`Unknown command: ${type}`);
  }
}

module.exports = { createSocketServer, SOCKET_PATH, AUTH_TOKEN };