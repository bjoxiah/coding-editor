import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  username:              string;
  api_url:               string;
  ws_url:                string;
  aws_access_key_id:     string;
  aws_secret_access_key: string;
  aws_region:            string;
  aws_bucket:            string;
}

export const InitialSettings: AppSettings = {
  username:              "",
  api_url:               "",
  ws_url:                "",
  aws_access_key_id:     "",
  aws_secret_access_key: "",
  aws_region:            "",
  aws_bucket:            "",
};

interface SettingsState {
  settings:   AppSettings;
  configured: boolean;
  checking:   boolean;
  saving:     boolean;
  loading:    boolean;
  error:      string;

  checkConfigured: () => Promise<void>;
  load:            () => Promise<void>;
  save:            (s: AppSettings) => Promise<void>;
  clear:           () => Promise<void>;
}


export const useSettings = create<SettingsState>((set) => ({
  settings:   InitialSettings,
  configured: false,
  checking:   true,
  saving:     false,
  loading:    false,
  error:      "",

  checkConfigured: async () => {
    set({ checking: true });
    try {
      const configured = await invoke<boolean>("has_settings");
      set({ configured, checking: false });
    } catch (e: any) {
      set({ checking: false, error: e?.toString() ?? "Failed to check config" });
    }
  },

  load: async () => {
    set({ loading: true, error: "" });
    try {
      const settings = await invoke<AppSettings>("load_settings");

      set({ settings, configured: true, loading: false });
    } catch (e: any) {
      const msg = e?.toString() ?? "Failed to load settings";
      set({ loading: false, error: msg });
    }
  },

  save: async (settings: AppSettings) => {
    set({ saving: true, error: "" });
    try {
      await invoke("save_settings", { settings });
      set({ settings, configured: true, saving: false });
    } catch (e: any) {
      const msg = e?.toString() ?? "Failed to save settings";
      set({ saving: false, error: msg });
      throw e;
    }
  },

  clear: async () => {
    try {
      await invoke("clear_settings");
      set({ settings: InitialSettings, configured: false, error: "" });
    } catch (e: any) {
      set({ error: e?.toString() ?? "Failed to clear settings" });
    }
  },
}));