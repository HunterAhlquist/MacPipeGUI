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
    tempPassword: string | null;
    setTempPassword: (password: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
    profiles: [],
    config: { builderPath: '', loginName: '', rememberPassword: false },
    selectedProfileId: null,
    version: '...',

    loadApp: async () => {
        try {
            if (!window.ipcRenderer) {
                console.error("ipcRenderer not available");
                return;
            }
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
        if (window.ipcRenderer) {
            window.ipcRenderer.invoke('set-store', 'profiles', newProfiles);
        }
    },

    updateProfile: (profile) => {
        const newProfiles = get().profiles.map(p => p.id === profile.id ? profile : p);
        set({ profiles: newProfiles });
        if (window.ipcRenderer) {
            window.ipcRenderer.invoke('set-store', 'profiles', newProfiles);
        }
    },

    deleteProfile: (id) => {
        const newProfiles = get().profiles.filter(p => p.id !== id);
        set({ profiles: newProfiles });
        if (get().selectedProfileId === id) {
            set({ selectedProfileId: null });
        }
        if (window.ipcRenderer) {
            window.ipcRenderer.invoke('set-store', 'profiles', newProfiles);
        }
    },

    selectProfile: (id) => set({ selectedProfileId: id }),

    updateConfig: (config) => {
        set({ config });
        if (window.ipcRenderer) {
            window.ipcRenderer.invoke('set-store', 'config', config);
        }
    },

    tempPassword: null,
    setTempPassword: (password) => set({ tempPassword: password })
}));
