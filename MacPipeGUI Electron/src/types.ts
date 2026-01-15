export interface DepotConfig {
    id: string;
    DepotName: string;
    DepotID: string;
    ContentRoot: string;
}

export interface AppProfile {
    id: string;
    appName: string;
    appID: string;
    description: string;
    depotProfiles: DepotConfig[];
}

export interface SteamConfig {
    builderPath: string;
    loginName: string;
    rememberPassword?: boolean;
    password?: string;
}
