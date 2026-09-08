import React from "react";
import ReactDOM from "react-dom/client";
import WebApp from "@twa-dev/sdk";
import "./style.css";
import App from "./App";
import { useStore } from "./store";

try {
  WebApp.ready();
  WebApp.expand();
  WebApp.enableClosingConfirmation();
} catch {
  // Running outside Telegram is supported.
}

void useStore.getState().hydrate();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);