import { NextRequest } from "next/server";
import { Server } from "socket.io";
import { createServer } from "http";
import * as pty from "node-pty";

let io: Server | undefined;

export async function GET(req: NextRequest) {
  const res = new Response();

  // @ts-ignore - Adding socket.io to the response
  if (!res.socket?.server?.io) {
    console.log("Setting up Socket.IO server...");

    const httpServer = createServer();
    io = new Server(httpServer, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected to terminal:", socket.id);

      // Choose shell based on platform
      const shell = process.platform === "win32" ? "powershell.exe" : "bash";
      const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.cwd(), // Use project directory
        env: process.env,
      });

      console.log(`Spawned ${shell} process for socket ${socket.id}`);

      // Send data from terminal to client
      ptyProcess.onData((data: string) => {
        socket.emit("output", data);
      });

      // Handle exit
      ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(
          `Process exited with code ${exitCode} and signal ${signal}`
        );
        socket.emit("exit", { exitCode, signal });
      });

      // Receive input from client
      socket.on("input", (data: string) => {
        ptyProcess.write(data);
      });

      // Handle terminal resize
      socket.on("resize", ({ cols, rows }: { cols: number; rows: number }) => {
        ptyProcess.resize(cols, rows);
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        ptyProcess.kill();
      });
    });

    // @ts-ignore
    res.socket.server.io = io;
  }

  return new Response("Socket.IO server initialized", { status: 200 });
}
