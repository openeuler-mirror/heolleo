import {InjectionKey, Reactive} from 'vue';

/**
 * 分区状态枚举（参考 anaconda / archinstall）
 *
 * - existing : 磁盘上已存在的分区，保留不动（可能仅修改挂载点）
 * - create   : 新建分区
 * - delete   : 磁盘上已存在的分区，将被删除
 * - free     : 磁盘上的空闲区域（未分配），不会传递给 archinstall
 * - format   : 已存在分区将被格式化（前端 UI 状态）
 *              传递到后端时拆分为 delete + create 两条指令：
 *              先删除原分区（按 dev_path 定位），再在同一位置创建新分区
 */
export type PartitionStatus = 'existing' | 'create' | 'delete' | 'free' | 'format';

/**
 * 分区表类型
 */
export type PartitionTableType = 'gpt' | 'mbr';

export interface PartInfo {
  /** 分区显示名称，如 sda1 */
  name: string;
  /** 分区设备路径，如 /dev/sda1；新建分区为 null */
  dev_path: string | null;
  /** 分区大小（字节字符串），统一使用字节作为内部单位 */
  size: string;
  /** 文件系统类型：ext4 / fat32 / btrfs / xfs 等；空闲区域为空字符串 */
  fs_type: string;
  /** 挂载点（原始字段，兼容后端） */
  mountpoint: string | null;
  /** 分区 UUID；新建分区使用前端生成的临时 id */
  uuid: string | null;
  /** 分区标志：boot / esp / bios-grub 等 */
  flags: string[];
  /** 起始字节偏移（1MiB 对齐）；GPT 布局下首个分区从 1MiB 开始 */
  start: number;
  /** 分区类型：primary 或空 */
  type: 'primary' | '';
  /** 分区状态：existing / create / delete / free / format */
  status: PartitionStatus;
  /** 图例标签（已国际化文本） */
  tag: string;
  /** 挂载点（UI 使用字段） */
  loadPoint: string;
  /** 文件系统卷标 */
  label?: string;
  /** 是否格式化（兼容旧字段，对应 status='format'） */
  shouldFormat?: boolean;
  /** 删除标记（UI 显示用，值为 'delete' 或 null） */
  isDelete: string | null;
  /**
   * 格式化前的原始大小（字节字符串）。
   * 仅 status='format' 时使用：生成后端配置时，delete 指令使用此原始大小，
   * create 指令使用 size（可能已被用户调整）。
   */
  originalSize?: string;
}

export interface InstallInfo {
  timezone: string;
  /** 目标磁盘设备路径，如 /dev/sda */
  disk: string;
  /** 磁盘总大小（字节）；后端已预扣 GPT 备份区 1MiB */
  diskSize: number;
  /** 磁盘逻辑扇区大小（字节） */
  sector_size: number;
  installType: string;
  /** 分区方式：auto / manual */
  partitionType: string;
  /** 真实磁盘分区布局（从后端获取，DiskPartition.vue 显示用，不受手动编辑影响） */
  partInfo: PartInfo[];
  /** 手动分区编辑后的布局（DiskPartitionManual 编辑、ConfigGenerator 生成配置用） */
  partInfoManual: PartInfo[];
  /** 原始分区布局（用于撤销） */
  partInfoBefore: PartInfo[];
  useLvm: boolean;
  configPath: string;
  userConfigPath?: string;
  // 用户信息
  username?: string;
  password?: string;
  adminPassword?: string;
  isAdminSame?: boolean;
}

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

/**
 * 磁盘布局常量（参考 anaconda / GPT 标准）
 */
export const DISK_LAYOUT = {
  /** 1MiB 字节数 */
  MIB: 1024 * 1024,
  /** GPT 起始偏移：跳过第 1 个 MiB（含保护 MBR + GPT 主表） */
  GPT_START_OFFSET: 1024 * 1024,
  /** 默认扇区大小（字节） */
  DEFAULT_SECTOR_SIZE: 512,
} as const

/** 空闲区域状态字符串（用于 UI 判断） */
export const FREE_SPACE_STATUS: PartitionStatus = 'free'

// 镜像定制
export const INSTALL_INFO_KEY = Symbol('INSTALL_INFO_KEY') as InjectionKey<Reactive<InstallInfo>>;
