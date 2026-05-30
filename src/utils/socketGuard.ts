if (typeof window !== "undefined") {
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = String(event.reason || "");

      if (
        reason.includes("WebSocket closed without opened") ||
        reason.includes("WebSocket") ||
        reason.includes("closed") ||
        reason.includes("Connection closed")
      ) {
        console.warn("🥋 Harmless websocket rejection prevented");
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  window.addEventListener(
    "error",
    (e: any) => {
      if (
        e.message?.includes("WebSocket") ||
        e.message?.includes("closed") ||
        e.target instanceof WebSocket ||
        (e.error && e.error.message?.includes("WebSocket"))
      ) {
        console.warn("🥋 Harmless websocket connection error suppressed");
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );
}
