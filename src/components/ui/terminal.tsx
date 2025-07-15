"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

interface TerminalProps {
  className?: string;
  onData?: (data: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  height?: number;
}

const Terminal: React.FC<TerminalProps> = ({
  className = "",
  onData,
  onConnect,
  onDisconnect,
  height = 400,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      console.log("Terminal: Window is undefined, skipping initialization");
      return;
    }

    let cleanup: (() => void) | undefined;

    const initializeTerminal = async () => {
      try {
        console.log("Terminal: Starting initialization...");
        // Dynamic import of xterm and socket.io-client
        console.log("Terminal: Loading dependencies...");
        const [{ Terminal: XTerm }, { FitAddon }, { io }] = await Promise.all([
          import("@xterm/xterm"),
          import("@xterm/addon-fit"),
          import("socket.io-client"),
        ]);

        console.log("Terminal: Dependencies loaded successfully");

        if (!terminalRef.current) {
          console.log("Terminal: terminalRef.current is null");
          return;
        }

        // Initialize xterm
        const terminal = new XTerm({
          theme: {
            background: "#000000",
            foreground: "#ffffff",
            cursor: "#ffffff",
            cursorAccent: "#000000",
            selectionBackground: "#ffffff44",
            black: "#000000",
            red: "#cd3131",
            green: "#0dbc79",
            yellow: "#e5e510",
            blue: "#2472c8",
            magenta: "#bc3fbc",
            cyan: "#11a8cd",
            white: "#e5e5e5",
            brightBlack: "#666666",
            brightRed: "#f14c4c",
            brightGreen: "#23d18b",
            brightYellow: "#f5f543",
            brightBlue: "#3b8eea",
            brightMagenta: "#d670d6",
            brightCyan: "#29b8db",
            brightWhite: "#ffffff",
          },
          fontFamily: '"Fira Code", "Courier New", monospace',
          fontSize: 14,
          fontWeight: "normal",
          lineHeight: 1.2,
          cursorBlink: true,
          cursorStyle: "block",
          scrollback: 1000,
          tabStopWidth: 4,
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);

        terminal.open(terminalRef.current);
        fitAddon.fit();

        // Initialize socket connection
        const socket = io({
          path: "/api/socketio",
          transports: ["websocket", "polling"],
        });

        socket.on("connect_error", (error: any) => {
          console.error("Terminal connection error:", error);
          terminal.writeln(
            "\\r\\n\\x1b[1;31m● Connection error: " +
              error.message +
              "\\x1b[0m\\r\\n"
          );
        });

        socket.on("connect", () => {
          console.log("Terminal connected to server");
          setIsConnected(true);
          onConnect?.();
          terminal.writeln(
            "\\r\\n\\x1b[1;32m● Connected to terminal\\x1b[0m\\r\\n"
          );
        });

        socket.on("disconnect", () => {
          console.log("Terminal disconnected from server");
          setIsConnected(false);
          onDisconnect?.();
          terminal.writeln(
            "\\r\\n\\x1b[1;31m● Disconnected from terminal\\x1b[0m\\r\\n"
          );
        });

        socket.on("output", (data: string) => {
          terminal.write(data);
          onData?.(data);
        });

        socket.on(
          "exit",
          ({ exitCode, signal }: { exitCode: number; signal: number }) => {
            terminal.writeln(
              `\\r\\n\\x1b[1;33m● Process exited with code ${exitCode}\\x1b[0m\\r\\n`
            );
          }
        );

        // Handle user input
        terminal.onData((data: string) => {
          if (socket.connected) {
            socket.emit("input", data);
          }
        });

        // Handle terminal resize
        const handleResize = () => {
          fitAddon.fit();
          if (socket.connected) {
            socket.emit("resize", {
              cols: terminal.cols,
              rows: terminal.rows,
            });
          }
        };

        // Fit terminal on window resize
        window.addEventListener("resize", handleResize);

        // Initial fit after a short delay to ensure proper sizing
        setTimeout(() => {
          handleResize();
        }, 100);

        cleanup = () => {
          window.removeEventListener("resize", handleResize);
          socket.disconnect();
          terminal.dispose();
        };

        setIsLoading(false);
        console.log("Terminal: Initialization completed successfully");
      } catch (err) {
        console.error("Failed to initialize terminal:", err);
        setError("Failed to load terminal: " + (err as Error).message);
        setIsLoading(false);
      }
    };

    initializeTerminal();

    return () => {
      cleanup?.();
    };
  }, [onData, onConnect, onDisconnect]);

  if (isLoading) {
    return (
      <div className={`terminal-container ${className}`}>
        <div className="flex items-center justify-between bg-gray-800 px-3 py-2 text-xs border-b border-border/50">
          <span className="text-gray-300 font-mono">Terminal</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-yellow-400">Loading...</span>
          </div>
        </div>
        <div
          style={{ height: `${height}px` }}
          className="w-full bg-black border border-border/50 flex items-center justify-center"
        >
          <div className="text-gray-400 text-sm">Loading terminal...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`terminal-container ${className}`}>
        <div className="flex items-center justify-between bg-gray-800 px-3 py-2 text-xs border-b border-border/50">
          <span className="text-gray-300 font-mono">Terminal</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-red-400">Error</span>
          </div>
        </div>
        <div
          style={{ height: `${height}px` }}
          className="w-full bg-black border border-border/50 flex items-center justify-center"
        >
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`terminal-container ${className}`}>
      <div className="flex items-center justify-between bg-gray-800 px-3 py-2 text-xs border-b border-border/50">
        <span className="text-gray-300 font-mono">Terminal</span>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-400" : "bg-red-400"
            }`}
          />
          <span
            className={`text-xs ${
              isConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
      <div
        ref={terminalRef}
        style={{ height: `${height}px` }}
        className="w-full bg-black border border-border/50"
      />
    </div>
  );
};

export default Terminal;
