import React from "react";
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


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Only reachable when NOT yet configured */}
        <Route element={<RequireGuest />}>
          <Route path="/config" element={<ConfigurationPage />} />
        </Route>

        {/* Only reachable when configured */}
        <Route element={<RequireConfig />}>
          <Route path="/"       element={<DashboardPage />} />
          <Route path="/new"    element={<PromptPage />} />
          <Route path="/editor" element={<EditorPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  </React.StrictMode>
);