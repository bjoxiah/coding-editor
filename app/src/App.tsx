import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { DashboardPage } from "./pages/dashboard";
import { PromptPage } from "./pages/prompt";
import { EditorPage } from "./pages/editor";
import { ConfigurationPage } from "./pages/config";
import { RequireGuest } from "./providers/guest";
import { RequireConfig } from "./providers/config";
import { toast, Toaster } from "sonner";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const checkForUpdates = async () => {
  // const update = await check();
  // if (update) {
    toast(`Version ${''} available`, {
      description: "A new update is ready to install.",
      action: {
        label: "Update now",
        onClick: async () => {
          // await update.downloadAndInstall();
          await relaunch();
        },
      },
      duration: Infinity,  // stays until user acts
    });
  // }
}

const App = () => {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

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