import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { Index } from "./pages";
import { Header } from "./components/Layout/Header";
import { EditorProvider } from "./providers/EditorProvider";
import { SettingsModal } from "./components/Editor/SettingsModal";

function start() {
  // Global error handler to debug "Script error"
  (window as any).__capturedErrors = [];

  window.onerror = function (msg, url, line, col, error) {
    const errorInfo = {
      msg,
      url,
      line,
      col,
      error: error ? error.toString() : null,
    };
    console.error("Global onerror:", errorInfo);
    (window as any).__capturedErrors.push(errorInfo);
    return false;
  };
  window.addEventListener("unhandledrejection", (e) => {
    (window as any).__capturedErrors.push({
      type: "unhandledrejection",
      reason: e.reason,
    });
    console.error("Unhandled Rejection:", e.reason);
  });

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <BrowserRouter>
      <EditorProvider>
        <div className="flex flex-col h-screen overflow-hidden bg-[#1e1e1e]">
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
          </Routes>
          <SettingsModal />
        </div>
      </EditorProvider>
    </BrowserRouter>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
