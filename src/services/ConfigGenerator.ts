import { InstallInfo, PartInfo } from '@/utils/constant'

export interface ArchinstallConfig {
  app_config: null
  'archinstall-language': string
  auth_config: {}
  bootloader: string
  custom_commands: any[]
  disk_config: {
    btrfs_options: {
      snapshot_config: null
    }
    config_type: string
    device_modifications: Array<{
      device: string
      partitions: Array<{
        btrfs: Array<{
          mountpoint: string
          name: string
        }>
        dev_path: string | null
        flags: string[]
        fs_type: string
        mount_options: string[]
        mountpoint: string | null
        obj_id: string
        size: {
          sector_size: {
            unit: string
            value: number
          }
          unit: string
          value: number | string
        }
        start: {
          sector_size: {
            unit: string
            value: number
          }
          unit: string
          value: number
        }
        status: string
        type: string
      }>
      wipe: boolean
    }>
    lvm_config?: {
      config_type: string
      vol_groups: Array<{
        lvm_pvs: string[]
        name: string
        volumes: Array<{
          btrfs: any[]
          fs_type: string
          length: {
            sector_size: {
              unit: string
              value: number
            }
            unit: string
            value: number | string
          }
          mount_options: any[]
          mountpoint: string
          name: string
          obj_id: string
          status: string
        }>
      }>
    }
  }
  hostname: string
  kernels: string[]
  locale_config: {
    kb_layout: string
    sys_enc: string
    sys_lang: string
  }
  ntp: boolean
  packages: string[]
  parallel_downloads: number
  script: null
  services: string[]
  swap: boolean
  timezone: string
  version: string
}

export class ConfigGenerator {

  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  private static parseSizeToBytes(sizeStr: string): number {
    if (!sizeStr) return 0;
    const sizeMatch = sizeStr.match(/^([\d.]+)([GMK]?)B?$/i);
    if (!sizeMatch) return 0;

    const value = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2]?.toUpperCase();

    switch (unit) {
      case 'G':
        return value * 1024 * 1024 * 1024;
      case 'M':
        return value * 1024 * 1024;
      case 'K':
        return value * 1024;
      default:
        return value;
    }
  }

  private static convertPartInfoToArchinstall(partInfo: PartInfo, sectorSize: number): any {
    const sizeInBytes = this.parseSizeToBytes(partInfo.size);

    const btrfs_subvolumes = (partInfo.fs_type === 'btrfs')
      ? [
          { "mountpoint": "/home", "name": "home" },
          { "mountpoint": "/", "name": "root" },
          { "mountpoint": "None", "name": "var/lib/machines" }
        ]
      : [];

    return {
      btrfs: btrfs_subvolumes,
      dev_path: partInfo.dev_path,
      flags: partInfo.flags || [],
      fs_type: partInfo.fs_type,
      mount_options: [],
      mountpoint: partInfo.mountpoint,
      obj_id: partInfo.uuid, // Use UUID from installInfo
      size: {
        sector_size: { unit: 'B', value: sectorSize },
        unit: 'B',
        value: sizeInBytes
      },
      start: {
        sector_size: { unit: 'B', value: sectorSize },
        unit: 'B',
        value: partInfo.start
      },
      status: partInfo.status,
      type: partInfo.type
    };
  }

  private static getLocaleConfig(language: string) {
    const localeMap: Record<string, { kb_layout: string; sys_lang: string }> = {
      'zh': { kb_layout: 'cn', sys_lang: 'zh_CN.UTF-8' },
      'en': { kb_layout: 'us', sys_lang: 'en_US.UTF-8' }
    }
    
    return {
      kb_layout: localeMap[language]?.kb_layout || 'us',
      sys_enc: 'UTF-8',
      sys_lang: localeMap[language]?.sys_lang || 'en_US.UTF-8'
    }
  }

  static generateConfig(installInfo: InstallInfo, language: string = 'en'): ArchinstallConfig {
    let deviceModifications = [];
    let disk_config;
    const totalDiskSizeInBytes = this.parseSizeToBytes(String(installInfo.diskSize));

    if (installInfo.partitionType === 'auto') {
      const efiPartition = {
        btrfs: [],
        dev_path: null,
        flags: ["boot", "esp"],
        fs_type: "fat32",
        mount_options: [],
        mountpoint: "/boot",
        obj_id: this.generateUUID(),
        size: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "MiB", value: 512 },
        start: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "MiB", value: 1 },
        status: "create",
        type: "primary"
      };

      if (installInfo.useLvm) {
        // LVM 逻辑
        const lvmPartitionId = this.generateUUID();
        const lvmPartition = {
          btrfs: [],
          dev_path: null,
          flags: ["LVM"],
          fs_type: "ext4",
          mount_options: [],
          mountpoint: "/",
          obj_id: lvmPartitionId,
          size: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "B", value: totalDiskSizeInBytes - (512 * 1024 * 1024) },
          start: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "MiB", value: 513 },
          status: "create",
          type: "primary"
        };

        deviceModifications.push({
          device: installInfo.disk,
          partitions: [efiPartition, lvmPartition],
          wipe: true
        });

        const rootVolSize = 20 * 1024 * 1024 * 1024; // 20 GiB in bytes
        const homeVolSize = totalDiskSizeInBytes - (512 * 1024 * 1024) - rootVolSize;

        disk_config = {
          config_type: "default_layout",
          device_modifications: deviceModifications,
          btrfs_options: { snapshot_config: null },
          lvm_config: {
            config_type: "default",
            vol_groups: [
              {
                lvm_pvs: [lvmPartitionId],
                name: "ArchinstallVg",
                volumes: [
                  {
                    btrfs: [],
                    fs_type: "ext4",
                    length: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "B", value: rootVolSize },
                    mount_options: [],
                    mountpoint: "/",
                    name: "root",
                    obj_id: this.generateUUID(),
                    status: "create"
                  },
                  {
                    btrfs: [],
                    fs_type: "ext4",
                    length: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "B", value: homeVolSize },
                    mount_options: [],
                    mountpoint: "/home",
                    name: "home",
                    obj_id: this.generateUUID(),
                    status: "create"
                  }
                ]
              }
            ]
          }
        };
      } else {
        // 非 LVM 逻辑
        const rootPartition = {
          btrfs: [],
          dev_path: null,
          flags: [],
          fs_type: "ext4",
          mount_options: [],
          mountpoint: "/",
          obj_id: this.generateUUID(),
          size: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "B", value: totalDiskSizeInBytes - (512 * 1024 * 1024) },
          start: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "MiB", value: 513 },
          status: "create",
          type: "primary"
        };
        
        deviceModifications.push({
          device: installInfo.disk,
          partitions: [efiPartition, rootPartition],
          wipe: true
        });

        disk_config = {
          config_type: "default_layout",
          device_modifications: deviceModifications,
          btrfs_options: { snapshot_config: null }
        };
      }
    } else {
      // 手动分区逻辑
      if (installInfo.disk && installInfo.partInfo.length > 0) {
        const totalDiskSize = totalDiskSizeInBytes;
        let usedSize = 0;
        const partitionsToProcess = installInfo.partInfo.map(p => ({ ...p }));

        // 首先计算所有固定大小的分区占用的空间
        partitionsToProcess.forEach(part => {
          if (part.size && part.size.toString().match(/^[\d.]+[GMK]?B?$/i)) {
            usedSize += this.parseSizeToBytes(part.size);
          }
        });

        // 找出需要自动计算大小的分区并填充它
        const remainingSize = totalDiskSize - usedSize;
        partitionsToProcess.forEach(part => {
          if (!part.size || !part.size.toString().match(/^[\d.]+[GMK]?B?$/i)) {
            // 假设没有明确大小的就是要填充剩余空间的分区
            part.size = `${remainingSize}`; // 将剩余空间大小转为字符串形式
          }
        });
        
        deviceModifications.push({
          device: installInfo.disk,
          partitions: partitionsToProcess.map(part =>
            this.convertPartInfoToArchinstall(part, installInfo.sector_size || 512)
          ),
          wipe: false
        });
      }
      disk_config = {
        config_type: "manual_partitioning",
        device_modifications: deviceModifications,
        btrfs_options: { snapshot_config: null }
      };
    }

    return {
      app_config: null,
      'archinstall-language': language === 'zh' ? 'Simplified Chinese' : 'English',
      auth_config: {},
      bootloader: 'Systemd-boot',
      custom_commands: [],
      disk_config: disk_config,
      hostname: 'devstation',
      kernels: ['linux'],
      locale_config: this.getLocaleConfig(language),
      ntp: true,
      packages: [],
      parallel_downloads: 0,
      script: null,
      services: [],
      swap: true,
      timezone: installInfo.timezone || 'Asia/Shanghai',
      version: '3.0.9'
    }
  }

  static exportConfig(config: ArchinstallConfig, filename: string = 'archinstall_config.json'): void {
    const configStr = JSON.stringify(config, null, 2)
    const blob = new Blob([configStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static saveConfigToFile(config: ArchinstallConfig, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const configStr = JSON.stringify(config, null, 2)
      
      // 使用 Electron API 保存文件
      if (window.electronAPI) {
        window.electronAPI.saveConfigFile(filepath, configStr)
          .then(() => resolve())
          .catch(reject)
      } else {
        // 降级到浏览器下载
        this.exportConfig(config, filepath.split('/').pop() || 'archinstall_config.json')
        resolve()
      }
    })
  }
} 