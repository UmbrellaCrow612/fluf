const net = require("net");
const fs = require("fs");
const path = require("path");
const os = require("os");

const AUTH_FILE = path.join(os.tmpdir(), "myelectron-app.auth");

class SecureSocketClient {
  constructor() {
    this.socket = null;
    this.authenticated = false;
    this.messageId = 0;
    this.pending = new Map();
  }

  async connect() {
    // Read auth file
    if (!fs.existsSync(AUTH_FILE)) {
      throw new Error("Electron app not running (no auth file)");
    }
    
    const auth = JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"));
    
    // Verify PID is still running (basic check)
    try {
      process.kill(auth.pid, 0); // Signal 0 checks existence
    } catch (e) {
      throw new Error("Electron app not running (stale auth file)");
    }
    
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(auth.socketPath, () => {
        console.log("[CLI] Connected to socket");
        
        // Send auth immediately
        this.socket.write(JSON.stringify({ type: "auth", token: auth.token }) + "\n");
      });
      
      let buffer = "";
      
      this.socket.on("data", (data) => {
        buffer += data.toString();
        let lines = buffer.split("\n");
        buffer = lines.pop();
        
        for (const line of lines) {
          if (!line.trim()) continue;
          this.handleMessage(JSON.parse(line));
        }
      });
      
      this.socket.on("error", reject);
      
      // Wait for auth response
      const checkAuth = () => {
        if (this.authenticated) {
          resolve(this);
        } else if (this.authFailed) {
          reject(new Error("Authentication failed"));
        } else {
          setTimeout(checkAuth, 10);
        }
      };
      setTimeout(checkAuth, 10);
    });
  }

  handleMessage(msg) {
    if (msg.type === "auth") {
      this.authenticated = msg.success;
      this.authFailed = !msg.success;
      return;
    }
    
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      
      if (msg.type === "error") {
        reject(new Error(msg.error));
      } else {
        resolve(msg.result);
      }
    }
  }

  send(type, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.authenticated) {
        reject(new Error("Not authenticated"));
        return;
      }
      
      const id = ++this.messageId;
      this.pending.set(id, { resolve, reject });
      
      const message = { id, type, ...params };
      this.socket.write(JSON.stringify(message) + "\n");
      
      // Timeout
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error("Command timeout"));
        }
      }, 30000);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.end();
    }
  }
}

// CLI Commands
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const client = new SecureSocketClient();
  
  try {
    await client.connect();
    
    switch (command) {
      case "ping":
        const pong = await client.send("ping");
        console.log("Response:", pong);
        break;
        
      case "eval":
        const script = args.slice(1).join(" ");
        const result = await client.send("eval", { script });
        console.log("Result:", result);
        break;
        
      case "windows":
        const windows = await client.send("get-windows");
        console.log("Windows:", windows);
        break;
        
      case "reload":
        await client.send("reload");
        console.log("Reloaded");
        break;
        
      case "focus":
        await client.send("focus");
        console.log("Focused");
        break;
        
      case "screenshot":
        const img = await client.send("screenshot");
        fs.writeFileSync("screenshot.png", Buffer.from(img.data, "base64"));
        console.log("Screenshot saved");
        break;
        
      case "interactive":
        console.log("Interactive mode. Commands: ping, eval <code>, reload, focus, quit");
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", async (line) => {
          line = line.trim();
          if (line === "quit") {
            client.disconnect();
            process.exit(0);
          }
          
          const [cmd, ...rest] = line.split(" ");
          try {
            let result;
            if (cmd === "eval") {
              result = await client.send("eval", { script: rest.join(" ") });
            } else {
              result = await client.send(cmd);
            }
            console.log(">", result);
          } catch (e) {
            console.error("Error:", e.message);
          }
        });
        return; // Keep running
        
      default:
        console.log("Commands: ping, eval <code>, windows, reload, focus, screenshot, interactive");
    }
    
    client.disconnect();
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();