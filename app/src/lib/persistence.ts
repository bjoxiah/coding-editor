import { Project } from '@/models';
import { load } from '@tauri-apps/plugin-store';
import { StorageValue, PersistStorage } from 'zustand/middleware';

export const appStore = await load('store.json', {
    autoSave: false,
    defaults: {}
});

interface IPersistedState {
  projects: Project[]; // Match exactly what partialize returns
}

export const tauriStorage: PersistStorage<IPersistedState> = {
  getItem: async (name) => {
    const state = await appStore.get<IPersistedState>(name);
    return state ? { state } : null;
  },
  setItem: async (name, value: StorageValue<IPersistedState>) => {
    await appStore.set(name, value.state);
    await appStore.save();
  },
  removeItem: async (name) => {
    await appStore.delete(name);
    await appStore.save();
  },
};
