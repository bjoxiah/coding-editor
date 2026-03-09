// import { Project } from '@/models';
// import { load } from '@tauri-apps/plugin-store';
// import { StorageValue, PersistStorage } from 'zustand/middleware';

// export const appStore = await load('store.json', {
//     autoSave: false,
//     defaults: {}
// });

// interface IPersistedState {
//   projects: Project[]; // Match exactly what partialize returns
// }

// export const tauriStorage: PersistStorage<IPersistedState> = {
//   getItem: async (name) => {
//     const state = await appStore.get<IPersistedState>(name);
//     return state ? { state } : null;
//   },
//   setItem: async (name, value: StorageValue<IPersistedState>) => {
//     await appStore.set(name, value.state);
//     await appStore.save();
//   },
//   removeItem: async (name) => {
//     await appStore.delete(name);
//     await appStore.save();
//   },
// };

import { Project } from '@/models';
import { StorageValue, PersistStorage } from 'zustand/middleware';

const isTauri = () =>
	typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

interface IPersistedState {
	projects: Project[];
}

// ─── Tauri store (desktop only) ───────────────────────────────────────────────

async function getTauriStore() {
	const { load } = await import('@tauri-apps/plugin-store');
	return load('store.json', { autoSave: false, defaults: {} });
}

// ─── Storage that works in both environments ──────────────────────────────────

export const tauriStorage: PersistStorage<IPersistedState> = {
	getItem: async (name) => {
		if (isTauri()) {
			const store = await getTauriStore();
			const state = await store.get<IPersistedState>(name);
			return state ? { state } : null;
		}
		// Browser fallback
		const raw = localStorage.getItem(name);
		return raw ? JSON.parse(raw) : null;
	},

	setItem: async (name, value: StorageValue<IPersistedState>) => {
		if (isTauri()) {
			const store = await getTauriStore();
			await store.set(name, value.state);
			await store.save();
			return;
		}
		localStorage.setItem(name, JSON.stringify(value));
	},

	removeItem: async (name) => {
		if (isTauri()) {
			const store = await getTauriStore();
			await store.delete(name);
			await store.save();
			return;
		}
		localStorage.removeItem(name);
	},
};
