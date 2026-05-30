export function logWebSocketCreation(fileName: string) {
  console.log("WS CREATE", fileName);
}

export function safeCloseWebSocket(socket?: WebSocket | null, fileName: string = "unspecified") {
  // Caso seja código de desenvolvimento do Vite
  if (!import.meta.env.DEV) {
    return;
  }

  if (socket) {
    console.log("WS CLOSE", socket.readyState);
  }

  try {
    // Bloquear fechamento se não estiver aberto
    if (
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      socket.close();
    } else if (socket) {
      console.warn("[WebSocket Guard] Closed attempt blocked: readyState was " + socket.readyState);
    }
  } catch (error) {
    console.warn(
      '🥋 Safe WebSocket Guard prevented crash:',
      error
    );
  }
}

