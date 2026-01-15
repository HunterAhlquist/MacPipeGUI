import { create } from 'zustand';
import { AppProfile, SteamConfig } from './types';

interface AppState {
    profiles: AppProfile[];
    config: SteamConfig;
    selectedProfileId: string | null;

    loadApp: () => Promise<void>;
    addProfile: (profile: AppProfile) => void;
    updateProfile: (profile: AppProfile) => void;
    deleteProfile: (id: string) => void;
    selectProfile: (id: string | null) => void;
    updateConfig: (config: SteamConfig) => void;
}

export const useStore = create<AppState>((set, get) => ({
    profiles: [],
    config: { builderPath: '', loginName: '', rememberPassword: false },
    selectedProfileId: null,

    loadApp: async () => {
        try {
            const profiles = await window.ipcRenderer.invoke('get-store', 'profiles') || [];
            const config = await window.ipcRenderer.invoke('get-store', 'config') || { builderPath: '', loginName: '', rememberPassword: false };
            set({ profiles, config });
        } catch (e) {
            console.error("Failed to load state", e);
        }
    },

    addProfile: (profile) => {
        const newProfiles = [...get().profiles, profile];
        set({ profiles: newProfiles });
        window.ipcRenderer.invoke('set-store', 'profiles', newProfiles);
    },

    updateProfile: (profile) => {
        const newProfiles = get().profiles.map(p => p.id === profile.id ? profile : p);
        set({ profiles: newProfiles });
        window.ipcRenderer.invoke('set-store', 'profiles', newProfiles);
    },

    deleteProfile: (id) => {
        const newProfiles = get().profiles.filter(p => p.id !== id);
        set({ profiles: newProfiles });
        if (get().selectedProfileId === id) {
            set({ selectedProfileId: null });
        }
        window.ipcRenderer.invoke('set-store', 'profiles', newProfiles);
    },

    selectProfile: (id) => set({ selectedProfileId: id }),

    updateConfig: (config) => {
        set({ config });
        window.ipcRenderer.invoke('set-store', 'config', config);
    }
}));
