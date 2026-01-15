import { create } from 'zustand';
import { AppProfile, SteamConfig } from './types';

interface AppState {
    profiles: AppProfile[];
    config: SteamConfig;
    selectedProfileId: string | null;
    version: string;

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
    version: '...',

    loadApp: async () => {
        try {
            const [profiles, config, version] = await Promise.all([
                window.ipcRenderer.invoke('get-store', 'profiles'),
                window.ipcRenderer.invoke('get-store', 'config'),
                window.ipcRenderer.invoke('get-app-version')
            ]);
            set({
                profiles: profiles || [],
                config: config || { builderPath: '', loginName: '', rememberPassword: false },
                version: version || '0.0.0'
            });
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
