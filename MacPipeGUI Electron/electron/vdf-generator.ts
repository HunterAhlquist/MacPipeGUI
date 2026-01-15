import { AppProfile, SteamConfig } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

export class VDFGenerator {
    static generateFiles(profile: AppProfile, config: SteamConfig): string | null {
        try {
            const builderURL = path.join(config.builderPath, 'scripts');

            if (!fs.existsSync(builderURL)) {
                fs.mkdirSync(builderURL, { recursive: true });
            }

            // Generate/update depot files
            for (const depot of profile.depotProfiles) {
                const depotText = `"DepotBuild"
{
  "DepotID" "${depot.DepotID}"
  "ContentRoot" "${depot.ContentRoot.replace(/\\/g, '\\\\')}"
  "FileMapping"
  {
    "LocalPath" "*"
    "DepotPath" "."
    "recursive" "1"
  }
}
`;
                const depotPath = path.join(builderURL, `depot_${depot.DepotID}.vdf`);
                fs.writeFileSync(depotPath, depotText, 'utf8');
            }

            // Generate/update main app file
            const depotEntries = profile.depotProfiles
                .map(d => `"${d.DepotID}" "depot_${d.DepotID}.vdf"`)
                .join('\n    ');

            const appText = `"AppBuild"
{
  "AppID" "${profile.appID}"
  "Desc" "${profile.description}"
  "BuildOutput" "${path.join(config.builderPath, 'output').replace(/\\/g, '\\\\')}"
  "ContentRoot" "${path.join(config.builderPath, 'content').replace(/\\/g, '\\\\')}"
  "Depots"
  {
    ${depotEntries}
  }
}
`;
            const appPath = path.join(builderURL, `app_${profile.appID}.vdf`);
            fs.writeFileSync(appPath, appText, 'utf8');

            return appPath;
        } catch (error) {
            console.error('VDF Generation Error:', error);
            return null;
        }
    }
}
