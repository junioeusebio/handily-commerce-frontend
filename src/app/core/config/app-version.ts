import packageJson from '../../../../package.json';

/** Frontend package version (synced with root `package.json` via resolveJsonModule). */
export const APP_VERSION: string = packageJson.version;
