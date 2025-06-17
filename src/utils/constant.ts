import {InjectionKey, Reactive} from 'vue';

export interface InstallInfo {
  username: string;
  password: string;
  adminPassword: string;
  disk: string;
  installType: string;
  partitionType: string;
}

export const INSTALL_TYPES: Readonly<Map<string, string>> = new Map([
  ['min', 'install.minInstall'],
  ['dev', 'install.devStation']
]);

// 镜像定制
export const INSTALL_INFO_KEY = Symbol('INSTALL_INFO_KEY') as InjectionKey<Reactive<InstallInfo>>;
