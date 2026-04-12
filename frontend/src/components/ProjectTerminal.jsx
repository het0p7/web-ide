import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import { WebglAddon } from "@xterm/addon-webgl";
import "@xterm/xterm/css/xterm.css";

const MAX_RECONNECT_ATTEMPTS = 6;
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function ProjectTerminal({ userId, projectId, onTreeUpdate, settings, onClear }) {
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const searchAddonRef = useRef(null);
  const webglAddonRef = useRef(null);
  const socketRef = useRef(null);
  const resizeHandlerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const onDataDisposableRef = useRef(null);

  const [status, setStatus] = useState("connecting"); // 'connecting' | 'connected' | 'reconnecting' | 'failed'
  const [reconnectCountdown, setReconnectCountdown] = useState(0);
  
  // Search Addon UI State
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchInputRef = useRef(null);

  // Focus input when search opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // ─── Clear Terminal (exposed via ref event) ───────────────────────
  useEffect(() => {
    const handleClear = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send("\x0C"); // form-feed clears the screen in bash
      } else if (terminalRef.current) {
        terminalRef.current.clear();
      }
    };
    window.addEventListener("terminal-clear", handleClear);
    return () => window.removeEventListener("terminal-clear", handleClear);
  }, []);

  // ─── Start Heartbeat ──────────────────────────────────────────────
  const startHeartbeat = useCallback(() => {
    clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "heartbeat" }));
      }
    }, HEARTBEAT_INTERVAL_MS);
  }, []);

  // ─── Connect WebSocket ────────────────────────────────────────────
  const connect = useCallback(async (term, fitAddon) => {
    if (isUnmountedRef.current) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/session/start`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg = data.error || `Server returned status ${res.status}`;
        term.writeln(`\r\n\x1b[31;1m✗ Session Error:\x1b[0m \x1b[31m${errMsg}\x1b[0m`);
        setStatus("failed");
        return; // Halt connection sequence
      }
    } catch (e) {
      term.writeln(`\r\n\x1b[31;1m✗ Network Error:\x1b[0m \x1b[31mCould not reach the server to start the session.\x1b[0m`);
      setStatus("failed");
      return;
    }

    const cols = term.cols > 10 ? term.cols : 80;
    const rows = term.rows > 5 ? term.rows : 24;

    const ws = new WebSocket(
      `/ws/terminal?userId=${userId}&projectId=${projectId}&cols=${cols}&rows=${rows}`
    );
    ws.binaryType = "arraybuffer";
    socketRef.current = ws;

    const resizeHandler = () => {
      if (!containerRef.current || containerRef.current.clientWidth === 0) return;
      try { fitAddon.fit(); } catch {}
      if (ws.readyState === WebSocket.OPEN && term.cols > 2) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    };
    resizeHandlerRef.current = resizeHandler;

    ws.onopen = () => {
      if (isUnmountedRef.current) { ws.close(); return; }
      setStatus("connected");
      reconnectAttemptsRef.current = 0;
      resizeHandler();
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        if (typeof event.data === "string" && event.data.startsWith("{")) {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "treeUpdate") {
            if (onTreeUpdate) onTreeUpdate();
            return;
          }
        }
      } catch {}
      if (event.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(event.data));
      } else {
        term.write(event.data);
      }
    };

    ws.onclose = () => {
      if (isUnmountedRef.current) return;
      clearInterval(heartbeatRef.current);

      const attempt = reconnectAttemptsRef.current;
      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        setStatus("failed");
        term.writeln("\r\n\x1b[31m✗ Could not reconnect after multiple attempts. Please reload the page.\x1b[0m");
        return;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      reconnectAttemptsRef.current += 1;
      setStatus("reconnecting");

      term.writeln(`\r\n\x1b[33m⟳ Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...\x1b[0m`);

      let remaining = Math.round(delay / 1000);
      setReconnectCountdown(remaining);
      const countdownInterval = setInterval(() => {
        remaining -= 1;
        setReconnectCountdown(remaining);
        if (remaining <= 0) clearInterval(countdownInterval);
      }, 1000);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isUnmountedRef.current) {
          term.writeln("\r\n\x1b[33m⟳ Reconnecting...\x1b[0m");
          connect(term, fitAddon);
        }
      }, delay);
    };

    ws.onerror = () => {};

    if (onDataDisposableRef.current) {
      onDataDisposableRef.current.dispose();
      onDataDisposableRef.current = null;
    }
    onDataDisposableRef.current = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    if (containerRef.current) {
      const ro = new ResizeObserver(() => requestAnimationFrame(resizeHandler));
      ro.observe(containerRef.current);
      resizeObserverRef.current = ro;
    }
    window.addEventListener("resize", resizeHandler);
  }, [userId, projectId, onTreeUpdate, startHeartbeat]);

  // ─── Init terminal once on mount ──────────────────────────────────
  useEffect(() => {
    isUnmountedRef.current = false;

    const fontSize = settings?.terminalFontSize || 14;
    const fontFamily = settings?.terminalFontFamily || "Menlo, Monaco, 'Courier New', monospace";
    const cursorStyle = settings?.cursorStyle || "block";
    const cursorBlink = settings?.cursorBlink !== false;

    const term = new Terminal({
      cursorBlink,
      cursorStyle,
      fontSize,
      fontFamily,
      convertEol: true,
      scrollback: 5000, // Massive scrollback buffer
      theme: {
        background: "#1e1e1e",
        foreground: "#cccccc",
        cursor: "#cccccc",
        selectionBackground: "#264f78",
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
        brightWhite: "#e5e5e5"
      },
    });

    // 1. Fit Addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 2. Web Links Addon (Clickable URLS)
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(webLinksAddon);

    // 3. Search Addon
    const searchAddon = new SearchAddon();
    term.loadAddon(searchAddon);
    searchAddonRef.current = searchAddon;

    term.open(containerRef.current);

    // 4. WebGL rendering for 60fps massive output parsing
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => webglAddon.dispose());
      term.loadAddon(webglAddon);
      webglAddonRef.current = webglAddon;
    } catch (e) {
      console.warn("WebGL addon could not be loaded. Falling back to DOM renderer.", e);
    }

    // Ctrl+F Interceptor
    term.attachCustomKeyEventHandler((e) => {
      // Keycode 'f' = 70. 
      if (e.key === "f" && (e.ctrlKey || e.metaKey) && e.type === "keydown") {
        e.preventDefault();
        setShowSearch(true);
        return false;
      }
      return true;
    });

    setTimeout(() => {
      try { fitAddon.fit(); } catch {}
      term.focus();
    }, 100);

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    connect(term, fitAddon);

    const handleTerminalInput = (e) => {
      const trySend = (retriesLeft) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(e.detail);
        } else if (retriesLeft > 0) {
          // Socket not ready yet (fetch still running, WS not created, or still CONNECTING)
          setTimeout(() => trySend(retriesLeft - 1), 200);
        }
      };
      trySend(30); // up to ~6s of retries, covering session/start fetch + WS handshake
    };
    window.addEventListener("terminal-input", handleTerminalInput);

    return () => {
      isUnmountedRef.current = true;

      window.removeEventListener("terminal-input", handleTerminalInput);
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      clearInterval(heartbeatRef.current);
      clearTimeout(reconnectTimeoutRef.current);
      if (onDataDisposableRef.current) {
        onDataDisposableRef.current.dispose();
      }

      if (socketRef.current) socketRef.current.close();
      if (webglAddonRef.current) webglAddonRef.current.dispose();
      if (searchAddonRef.current) searchAddonRef.current.dispose();
      if (terminalRef.current) terminalRef.current.dispose();

      fetch(`/api/projects/${projectId}/session/stop`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    };
  }, [userId, projectId]);

  useEffect(() => {
    const stopSession = () => {
      fetch(`/api/projects/${projectId}/session/stop`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", stopSession);
    return () => window.removeEventListener("beforeunload", stopSession);
  }, [projectId]);

  return (
    <div style={{ height: "100%", position: "relative", backgroundColor: "#1e1e1e" }}>
      <div
        ref={containerRef}
        style={{ position: "absolute", top: "8px", left: "12px", right: "0", bottom: "24px", overflow: "hidden" }}
      />

      {/* Terminal Search UI overlay */}
      {showSearch && (
        <div style={{
          position: "absolute",
          top: "8px",
          right: "24px",
          background: "#1e1e1e",
          border: "1px solid #3c3c3c",
          borderRadius: "6px",
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          zIndex: 20,
          boxShadow: "0 6px 16px rgba(0,0,0,0.6)"
        }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Find..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) searchAddonRef.current?.findPrevious(searchValue);
                else searchAddonRef.current?.findNext(searchValue);
              } else if (e.key === "Escape") {
                setShowSearch(false);
                terminalRef.current?.focus();
              }
            }}
            style={{
              background: "#2d2d2d",
              border: "1px solid #3c3c3c",
              color: "#e0e0e0",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              outline: "none",
              width: "160px"
            }}
          />
          <button 
            onClick={() => searchAddonRef.current?.findPrevious(searchValue)}
            style={{ background: "transparent", border: "none", color: "#ccc", cursor: "pointer", padding: "0 4px" }}
            title="Previous (Shift+Enter)"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M14 10.071l-6-6-6 6 1.071 1.071L8 6.214l4.929 4.928L14 10.071z"/>
            </svg>
          </button>
          <button 
            onClick={() => searchAddonRef.current?.findNext(searchValue)}
            style={{ background: "transparent", border: "none", color: "#ccc", cursor: "pointer", padding: "0 4px" }}
            title="Next (Enter)"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M2 5.929l6 6 6-6L12.929 4.858 8 9.786 3.071 4.858 2 5.929z"/>
            </svg>
          </button>
          <div style={{ width: "1px", height: "16px", background: "#444", margin: "0 2px" }} />
          <button 
            onClick={() => { setShowSearch(false); terminalRef.current?.focus(); }}
            style={{ background: "transparent", border: "none", color: "#ccc", cursor: "pointer", padding: "0 4px" }}
            title="Close (Esc)"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.146 4.146a.5.5 0 000 .708L7.293 8l-3.147 3.146a.5.5 0 00.708.708L8 8.707l3.146 3.147a.5.5 0 00.708-.708L8.707 8l3.147-3.146a.5.5 0 00-.708-.708L8 7.293 4.854 4.146a.5.5 0 00-.708 0z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Reconnecting overlay */}
      {(status === "reconnecting" || status === "connecting") && (
        <div style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          background: "rgba(0,0,0,0.85)",
          border: "1px solid rgba(34,211,238,0.3)",
          borderRadius: "8px",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          color: "#22d3ee",
          zIndex: 10,
        }}>
          <div style={{
            width: "10px", height: "10px", borderRadius: "50%",
            border: "2px solid rgba(34,211,238,0.3)",
            borderTopColor: "#22d3ee",
            animation: "spin 0.8s linear infinite",
          }} />
          {status === "connecting" ? "Starting session..." : `Reconnecting${reconnectCountdown > 0 ? ` in ${reconnectCountdown}s` : "..."}`}
        </div>
      )}

      {status === "failed" && (
        <div style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          background: "rgba(0,0,0,0.85)",
          border: "1px solid rgba(248,113,113,0.4)",
          borderRadius: "8px",
          padding: "8px 14px",
          fontSize: "12px",
          color: "#f87171",
          zIndex: 10,
        }}>
          ✗ Session lost — reload the page
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
