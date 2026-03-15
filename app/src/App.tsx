import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { DashboardPage } from "./pages/dashboard";
import { PromptPage } from "./pages/prompt";
import { EditorPage } from "./pages/editor";
import { ConfigurationPage } from "./pages/config";
import { RequireGuest } from "./providers/guest";
import { RequireConfig } from "./providers/config";
import { Toaster } from "sonner";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const checkForUpdates = async () => {
  const update = await check();
  if (update) {
    const yes = confirm(`Version ${update.version} is available. Install now?`);
    if (yes) {
      await update.downloadAndInstall();
      await relaunch();
    }
  }
}

const App = () => {
  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/config" element={<ConfigurationPage />} />
        </Route>
        <Route element={<RequireConfig />}>
          <Route path="/"       element={<DashboardPage />} />
          <Route path="/new"    element={<PromptPage />} />
          <Route path="/editor" element={<EditorPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);