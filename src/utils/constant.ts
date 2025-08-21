import {InjectionKey, Reactive} from 'vue';

export interface PartInfo {
  name: string;
  dev_path: string;
  size: string; // Keep as string as it comes from lsblk
  fs_type: string | null;
  mountpoint: string | null;
  uuid: string | null;
  flags: string[];
  start: number | null;
  type: string; // 'primary', etc.
  status: string; // 'existing'
  tag: string; // for graph color and label
  loadPoint: string; // for graph
  label?: string;
}
export interface InstallInfo {
  timezone: string;
  disk: string;
  diskSize: number; // in bytes
  sector_size: number; // in bytes
  installType: string;
  partitionType: string;
  partInfo: PartInfo[];
  partInfoBefore: PartInfo[];
  useLvm: boolean;
  configPath: string;
}

export const INSTALL_TYPES: Readonly<Map<string, string>> = new Map([
  ['min', 'install.minInstall'],
  ['dev', 'install.devStation']
]);

export const DISK_OTHERS_COLOR = '#502092'
export const DISK_PART_PALETTE = [
  '#0077FF',
  '#2DB47C',
  '#EC4F83',
  '#3DB6FC',
  '#6D47F5',
  '#3DCFD4',
  '#BD45E8',
  '#81BA06',
  '#EBAF00',
  '#F97611',
]

// 镜像定制
export const INSTALL_INFO_KEY = Symbol('INSTALL_INFO_KEY') as InjectionKey<Reactive<InstallInfo>>;
