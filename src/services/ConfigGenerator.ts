import { InstallInfo, PartInfo } from '@/utils/constant'
import { PasswordUtils } from '@/utils/passwordUtils'

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

  private static parseSizeToBytes(sizeStr: string | number): number {
    if (!sizeStr) return 0;
    const sizeMatch = String(sizeStr).match(/^([\d.]+)([GMK]?)B?$/i);
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

    // 根据分区的挂载点动态生成 BTRFS 子卷配置
    const btrfs_subvolumes = (partInfo.fs_type === 'btrfs')
      ? this.generateBtrfsSubvolumes(partInfo.loadPoint)
      : [];

    // 对于 delete 和 existing 状态的分区，保留原始的 dev_path；对于 create 状态，设置为 null
    const dev_path = partInfo.status === 'create' ? null : partInfo.dev_path;

    return {
      btrfs: btrfs_subvolumes,
      dev_path: dev_path,
      flags: partInfo.flags || [],
      fs_type: partInfo.fs_type,
      mount_options: [],
      mountpoint: partInfo.loadPoint,
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
      type: partInfo.type || 'primary'
    };
  }

  /**
   * 根据挂载点动态生成 BTRFS 子卷配置
   * @param mountpoint 分区的挂载点
   * @returns BTRFS 子卷配置数组
   */
  private static generateBtrfsSubvolumes(mountpoint: string): Array<{ mountpoint: string; name: string }> {
    const subvolumes: Array<{ mountpoint: string; name: string }> = [];
    
    // 根据挂载点确定需要创建的子卷
    switch (mountpoint) {
      case '/':
        // 根分区：创建 home 和 root 子卷，以及 systemd-nspawn 容器目录
        subvolumes.push(
          { "mountpoint": "/", "name": "root" },
          { "mountpoint": "None", "name": "var/lib/machines" }
        );
        break;
        
      case '/home':
        // 独立的 home 分区：只创建 home 子卷
        subvolumes.push(
          { "mountpoint": "/", "name": "root" },
          { "mountpoint": "/home", "name": "home" },
          { "mountpoint": "None", "name": "var/lib/machines" }
        );
        break;
        
      case '/var':
        // 独立的 var 分区：创建 var 子卷
        subvolumes.push(
          { "mountpoint": "/", "name": "root" },
          { "mountpoint": "/var", "name": "var" },
          { "mountpoint": "None", "name": "var/lib/machines" }
        );
        break;
        
      default:
        // 其他挂载点：根据路径创建对应的子卷
        if (mountpoint.startsWith('/')) {
          const name = mountpoint.substring(1).replace(/\//g, '-');
          subvolumes.push({ "mountpoint": mountpoint, "name": name });
        }
        break;
    }
    
    return subvolumes;
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

  // 从 generateConfig 中提取磁盘布局信息，用于显示分区预览
  static generatePartitionPreview(installInfo: InstallInfo): PartInfo[] {
    const config = this.generateConfig(installInfo, 'en'); // 使用英文避免翻译问题
    const deviceModifications = config.disk_config.device_modifications;
    
    if (deviceModifications.length === 0) {
      return [];
    }
    
    const partitions = deviceModifications[0].partitions;
    const diskName = installInfo.disk.replace('/dev/', '');
    
    return partitions.map((partition, index) => {
      // 将 Archinstall 格式转换为 PartInfo 格式
      const sizeInBytes = typeof partition.size.value === 'string' 
        ? this.parseSizeToBytes(partition.size.value)
        : partition.size.value;
      
      // 根据分区类型和挂载点确定标签
      let tag = '';
      if (partition.flags.includes('boot') && partition.flags.includes('esp')) {
        tag = 'EFI System Partition';
      } else if (partition.flags.includes('LVM')) {
        tag = 'LVM Partition';
      } else if (partition.mountpoint === '/') {
        tag = 'Root Partition';
      } else {
        tag = `Partition ${index + 1}`;
      }
      
      return {
        name: `${diskName}p${index + 1}`,
        dev_path: partition.dev_path || `${installInfo.disk}p${index + 1}`,
        size: sizeInBytes.toString(),
        fs_type: partition.fs_type,
        mountpoint: partition.mountpoint,
        uuid: partition.obj_id,
        flags: partition.flags,
        start: partition.start.value,
        type: partition.type,
        status: partition.status,
        tag: tag,
        loadPoint: partition.mountpoint || ''
      };
    });
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
        mountpoint: "/boot/efi",
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
          size: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "B", value: totalDiskSizeInBytes - (514 * 1024 * 1024) },
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
          size: { sector_size: { unit: "B", value: installInfo.sector_size || 512 }, unit: "B", value: totalDiskSizeInBytes - (514 * 1024 * 1024) },
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
        const initialPartsMap = new Map(installInfo.partInfoBefore.map(p => [p.uuid, p]));
        const finalParts = installInfo.partInfo.filter(p => p.tag !== 'free_space');
        const modifications: any[] = [];
        let currentStart = 1024 * 1024; // 1MiB in bytes

        // Track processed initial partitions to find the deleted ones later
        const processedInitialUuids = new Set();

        for (const finalPart of finalParts) {
          const initialPart = initialPartsMap.get(finalPart.uuid);
          
          // Assign start value before processing
          finalPart.start = currentStart;

          if (initialPart) {
            // Partition existed before, check for changes
            processedInitialUuids.add(finalPart.uuid);
            const sizeChanged = this.parseSizeToBytes(initialPart.size) !== this.parseSizeToBytes(finalPart.size);
            const mountPointChanged = initialPart.loadPoint !== finalPart.loadPoint;
            const fsTypeChanged = initialPart.fs_type !== finalPart.fs_type;

            if (sizeChanged) {
              // Size changed, treat as delete and create
              initialPart.uuid = this.generateUUID(); // new uuid for old part
              finalPart.uuid = this.generateUUID(); // new uuid for new part
              modifications.push({ ...initialPart, status: 'delete' });
              modifications.push({ ...finalPart, status: 'create' });
            } else if (mountPointChanged || fsTypeChanged) {
              // Size is the same, but other properties changed
              // Check if this is a format operation (fs_type changed and mountpoint might have changed)
              const isFormatOperation = fsTypeChanged && (mountPointChanged || initialPart.fs_type !== finalPart.fs_type);
              
              if (isFormatOperation) {
                // Format operation: treat as delete and create
                initialPart.uuid = this.generateUUID(); // new uuid for old part
                finalPart.uuid = this.generateUUID(); // new uuid for new part
                modifications.push({ ...initialPart, status: 'delete' });
                modifications.push({ ...finalPart, status: 'create' });
              } else {
                // Just property changes, keep as existing
                finalPart.uuid = this.generateUUID();
                modifications.push({ ...finalPart, status: 'existing' });
              }
            } else {
              // Partition is unchanged, but still need to include it in the configuration
              modifications.push({ ...finalPart, status: 'existing' });
            }
          } else {
            // This is a new partition
            finalPart.uuid = this.generateUUID();
            modifications.push({ ...finalPart, status: 'create' });
          }
          
          // Update start for the next partition
          currentStart += this.parseSizeToBytes(finalPart.size);
        }

        // Find partitions that were in the initial list but not in the final one (or not processed)
        for (const initialPart of installInfo.partInfoBefore) {
          if (initialPart.tag !== 'free_space' && !processedInitialUuids.has(initialPart.uuid)) {
             const isStillPresent = finalParts.some(p => p.uuid === initialPart.uuid);
             if (!isStillPresent) {
                modifications.push({ ...initialPart, status: 'delete' });
             }
          }
        }
        
        deviceModifications.push({
          device: installInfo.disk,
          partitions: modifications.map(part =>
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
      if ((window as any).electronAPI) {
        (window as any).electronAPI.saveConfigFile(filepath, configStr)
          .then(() => resolve())
          .catch(reject)
      } else {
        // 降级到浏览器下载
        this.exportConfig(config, filepath.split('/').pop() || 'archinstall_config.json')
        resolve()
      }
    })
  }

  // 生成用户配置JSON
  static async generateUserConfig(installInfo: InstallInfo): Promise<any> {
    const users = [];
    
    // 添加普通用户
    if (installInfo.username && installInfo.password) {
      const encryptedPassword = await PasswordUtils.generateArchinstallHash(installInfo.password);
      users.push({
        username: installInfo.username,
        enc_password: encryptedPassword,
        groups: [],
        sudo: true
      });
    }
    
    // 生成root密码哈希
    // root用户就是管理员用户，使用管理员密码或普通用户密码
    const rootPassword = installInfo.adminPassword || installInfo.password;
    if (!rootPassword) {
      throw new Error('Root password is required');
    }
    const rootEncPassword = await PasswordUtils.generateArchinstallHash(rootPassword);
    
    return {
      root_enc_password: rootEncPassword,
      users: users
    };
  }

  // 生成并导出用户配置文件
  static async exportUserConfig(installInfo: InstallInfo, filename: string = 'user_config.json'): Promise<void> {
    const userConfig = await this.generateUserConfig(installInfo);
    const configStr = JSON.stringify(userConfig, null, 2);
    const blob = new Blob([configStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 保存用户配置文件到文件系统
  static async saveUserConfigToFile(installInfo: InstallInfo, filepath: string): Promise<void> {
    const userConfig = await this.generateUserConfig(installInfo);
    const configStr = JSON.stringify(userConfig, null, 2);
    
    return new Promise((resolve, reject) => {
      // 使用 Electron API 保存文件
      if ((window as any).electronAPI) {
        (window as any).electronAPI.saveConfigFile(filepath, configStr)
          .then(() => resolve())
          .catch(reject)
      } else {
        // 降级到浏览器下载
        this.exportUserConfig(installInfo, filepath.split('/').pop() || 'user_config.json')
        resolve()
      }
    })
  }
}
