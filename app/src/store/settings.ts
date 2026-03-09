import { create } from 'zustand';
import { isTauri, tauriInvoke } from '.';

export interface AppSettings {
	username: string;
	api_url: string;
	ws_url: string;
	aws_access_key_id: string;
	aws_secret_access_key: string;
	aws_region: string;
	aws_bucket: string;
}

export const InitialSettings: AppSettings = {
	username: '',
	api_url: '',
	ws_url: '',
	aws_access_key_id: '',
	aws_secret_access_key: '',
	aws_region: '',
	aws_bucket: '',
};


const STORAGE_KEY = 'app_settings';

// Browser fallbacks — mirror the Tauri command behaviour
const browserStorage = {
	has: (): boolean => {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return false;
		const s: AppSettings = JSON.parse(raw);
		return s.username.trim() !== '';
	},
	load: (): AppSettings => {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : { ...InitialSettings };
	},
	save: (settings: AppSettings) => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	},
	clear: () => {
		localStorage.removeItem(STORAGE_KEY);
	},
};


interface SettingsState {
	settings: AppSettings;
	configured: boolean;
	checking: boolean;
	saving: boolean;
	loading: boolean;
	error: string;

	checkConfigured: () => Promise<void>;
	load: () => Promise<void>;
	save: (s: AppSettings) => Promise<void>;
	clear: () => Promise<void>;
}

export const useSettings = create<SettingsState>((set) => ({
	settings: InitialSettings,
	configured: false,
	checking: true,
	saving: false,
	loading: false,
	error: '',

	checkConfigured: async () => {
		set({ checking: true });
		try {
			const configured = isTauri()
				? await tauriInvoke<boolean>('has_settings')
				: browserStorage.has();
			set({ configured, checking: false });
		} catch (e: any) {
			set({
				checking: false,
				error: e?.toString() ?? 'Failed to check config',
			});
		}
	},

	load: async () => {
		set({ loading: true, error: '' });
		try {
			const settings = isTauri()
				? await tauriInvoke<AppSettings>('load_settings')
				: browserStorage.load();
			set({ settings, configured: true, loading: false });
		} catch (e: any) {
			set({
				loading: false,
				error: e?.toString() ?? 'Failed to load settings',
			});
		}
	},

	save: async (settings: AppSettings) => {
		set({ saving: true, error: '' });
		try {
			if (isTauri()) {
				await tauriInvoke('save_settings', { settings });
			} else {
				browserStorage.save(settings);
			}
			set({ settings, configured: true, saving: false });
		} catch (e: any) {
			const msg = e?.toString() ?? 'Failed to save settings';
			set({ saving: false, error: msg });
			throw e;
		}
	},

	clear: async () => {
		try {
			if (isTauri()) {
				await tauriInvoke('clear_settings');
			} else {
				browserStorage.clear();
			}
			set({ settings: InitialSettings, configured: false, error: '' });
		} catch (e: any) {
			set({ error: e?.toString() ?? 'Failed to clear settings' });
		}
	},
}));
