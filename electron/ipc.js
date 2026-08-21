const { app, ipcMain } = require('electron')
const { execSync, exec } = require('child_process')
const fs = require('fs')
const path = require('path')

// 文件系统类型映射函数
function mapFileSystemType(fsType) {
  if (!fsType) return null;

  const fsTypeMap = {
    'vfat': 'fat32',
    'fat32': 'fat32',
    'fat16': 'fat16',
    'fat12': 'fat12',
    'ext4': 'ext4',
    'ext3': 'ext3',
    'ext2': 'ext2',
    'btrfs': 'btrfs',
    'xfs': 'xfs',
    'ntfs': 'ntfs',
    'swap': 'swap',
    'iso9660': 'iso9660',
    'udf': 'udf'
  };

  return fsTypeMap[fsType.toLowerCase()] || fsType;
}

// 获取启动模式(UEFI/BIOS)
function getBootMode() {
  try {
    return fs.existsSync('/sys/firmware/efi') ? 'uefi' : 'bios'
  } catch {
    return 'bios'
  }
}

// 准备块设备：清除多路径、更新分区表、等待设备事件完成
function prepareBlockDevices() {
  const commands = [
    { cmd: 'sudo multipath -F', warn: 'multipath -F failed (maybe multipath not installed)' },
    { cmd: 'sudo partprobe', warn: 'partprobe failed' },
    { cmd: 'sudo udevadm settle', warn: 'udevadm settle failed' },
  ]
  for (const { cmd, warn } of commands) {
    try {
      execSync(cmd)
    } catch (error) {
      console.warn(`${warn}:`, error.message)
    }
  }
}

// 获取当前系统根文件系统所在的磁盘设备名（用于排除系统盘）
function getRootDiskDevice() {
  try {
    // 使用精确匹配，避免误匹配子目录挂载点（如 /home、/boot）
    const mountOutput = execSync('mount | grep " on / type"').toString().trim()
    const parts = mountOutput.split(/\s+/)
    if (parts.length > 0) {
      const rootDevice = parts[0]
      if (rootDevice.startsWith('/dev/')) {
        // 优先使用 lsblk PKNAME 获取父设备名，可靠处理 NVMe/MMC/SCSI/SATA/LVM 等命名
        try {
          const pkname = execSync(`lsblk -no PKNAME ${rootDevice}`).toString().trim()
          if (pkname) {
            return pkname
          }
        } catch (e) {
          console.warn('Failed to get PKNAME via lsblk:', e.message)
        }
        // 回退：手动剥离分区后缀，正确处理 NVMe(nvme0n1p2)、MMC(mmcblk0p1)、SCSI/SATA(sda1)
        const deviceName = rootDevice.replace('/dev/', '').replace(/p?\d+$/, '')
        return deviceName
      }
    }
    return null
  } catch (error) {
    console.warn('Failed to get root disk device:', error.message)
    return null
  }
}

/**
 * 获取磁盘上所有分区的起始扇区（每个磁盘仅调用一次 fdisk，避免 N+1 问题）。
 * @param {string} diskName 磁盘名，如 sda
 * @returns {Map<string, number>} 分区名 → 起始扇区 的映射；获取失败返回空 Map
 */
function getPartitionStartSectors(diskName) {
  const startSectors = new Map()
  try {
    const fdiskOutput = execSync(`sudo fdisk -l /dev/${diskName} 2>/dev/null || true`).toString()
    for (const line of fdiskOutput.split('\n')) {
      const trimmed = line.trim()
      // fdisk 分区行以 /dev/ 开头
      if (!trimmed.startsWith('/dev/')) continue
      const cols = trimmed.split(/\s+/)
      if (cols.length < 2) continue
      const partName = cols[0].replace('/dev/', '')
      const startSector = parseInt(cols[1], 10)
      if (!isNaN(startSector)) {
        startSectors.set(partName, startSector)
      }
    }
  } catch (error) {
    console.warn(`Failed to get start sectors for disk ${diskName}:`, error.message)
  }
  return startSectors
}

// 根据挂载点和文件系统类型推断分区标志
function inferPartitionFlags(partition) {
  const flags = []
  if (partition.mountpoint === '/boot/efi' || partition.fstype === 'vfat') {
    flags.push('boot', 'esp')
  }
  if (partition.mountpoint === '/boot') {
    flags.push('bls_boot')
  }
  return flags
}

function registerIpcListeners() {
  // 获取启动模式
  ipcMain.handle('get-boot-mode', () => {
    return { mode: getBootMode() }
  })

  ipcMain.on('close-app', () => {
    app.quit()
  })

  // 安装系统
  ipcMain.handle('install-system', async (event, { configPath, userConfigPath }) => {
    const webContents = event.sender

    let installCommand
    if (userConfigPath) {
      // 使用两个配置文件：eulerinstall配置和用户配置
      installCommand = `sudo eulerinstall --config ${configPath} --creds ${userConfigPath} --silent`
    } else {
      // 只使用eulerinstall配置文件
      installCommand = `sudo eulerinstall --config ${configPath} --silent`
    }

    console.log('Install command:', installCommand)
    const installProcess = exec(installCommand);

    installProcess.stdout.on('data', (data) => {
      const log = data.toString()
      console.log('Install stdout:', log)
      webContents.send('install-log', log)
    });

    installProcess.stderr.on('data', (data) => {
      const log = data.toString()
      console.error('Install stderr:', log)
      webContents.send('install-log', log)
    });

    return new Promise((resolve) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: `Installation failed with code ${code}` })
        }
      });
    })
  })

  // 重启系统
  ipcMain.handle('reboot-system', () => {
    try {
      execSync(`reboot`)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 保存配置文件
  ipcMain.handle('save-config-file', async (event, { filepath, content }) => {
    try {
      const resolvedPath = path.resolve(filepath)

      let realPath
      try {
        realPath = fs.realpathSync(resolvedPath, { encoding: 'utf8' })
      } catch (err) {
        if (err.code === 'ENOENT') {
          realPath = resolvedPath
        } else {
          throw err
        }
      }

      const SENSITIVE_PATHS = [
        '/etc', '/usr', '/bin', '/sbin', '/boot', '/lib', '/lib64',
        '/var', '/root', '/home', '/dev', '/proc', '/sys', '/opt'
      ]

      for (const sensitivePath of SENSITIVE_PATHS) {
        if (realPath.startsWith(sensitivePath)) {
          console.error(`Path rejected: ${resolvedPath} resolves to ${realPath} which is in sensitive directory ${sensitivePath}`)
          return { success: false, error: '路径被拒绝：禁止写入系统敏感目录' }
        }
      }

      if (!realPath.startsWith('/tmp/')) {
        console.error(`Path rejected: ${resolvedPath} resolves to ${realPath} which is not under /tmp/`)
        return { success: false, error: '路径被拒绝：仅允许保存至 /tmp 目录' }
      }

      const dir = path.dirname(resolvedPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      const fd = fs.openSync(resolvedPath, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW, 0o600)
      try {
        fs.writeFileSync(fd, content, 'utf8')
      } finally {
        fs.closeSync(fd)
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to save config file:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取所有磁盘信息 - 优化版本
  ipcMain.handle('get-disk-info', async () => {
    try {
      // 准备块设备：清除多路径、更新分区表、等待设备事件完成
      prepareBlockDevices()

      // 获取基本磁盘信息（只使用 lsblk，避免额外的系统调用）
      const lsblkOutput = execSync('lsblk -J -b -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE,UUID,PATH').toString()
      const { blockdevices } = JSON.parse(lsblkOutput)
      console.log('blockdevices:', blockdevices)

      // 获取当前系统根文件系统所在的磁盘设备（用于排除系统盘）
      const rootDiskDevice = getRootDiskDevice()
      console.log('Root disk device:', rootDiskDevice)

      // 默认逻辑扇区大小（字节）
      const DEFAULT_SECTOR_SIZE = 512

      // 过滤出可用磁盘（排除系统盘与环回设备）
      const availableDisks = blockdevices.filter(
        device => device.type === 'disk'
          && device.path
          && (rootDiskDevice === null || device.name !== rootDiskDevice)
      )

      // 处理每块磁盘及其分区
      const disks = availableDisks.map(disk => {
        // 每个磁盘仅调用一次 fdisk 获取所有分区的起始扇区（避免 N+1 调用）
        const startSectorsMap = getPartitionStartSectors(disk.name)
        // 保守推断扇区大小：fdisk 无法可靠输出，使用默认值 512
        // （start 字段返回字节，前端已统一按字节处理，扇区大小仅作为元数据）
        const sectorSize = DEFAULT_SECTOR_SIZE

        const partitions = (disk.children || []).map(part => {
          const startSector = startSectorsMap.get(part.name) ?? 2048
          return {
            name: part.name,
            dev_path: part.path,
            size: parseInt(part.size, 10),
            fs_type: mapFileSystemType(part.fstype),
            mountpoint: part.mountpoint || null,
            uuid: part.uuid || null,
            flags: inferPartitionFlags(part),
            // 起始字节 = 起始扇区 × 扇区大小
            start: startSector * sectorSize,
            type: 'primary',
          }
        })

        return {
          name: disk.name,
          device: disk.path,
          // 返回磁盘真实大小：GPT 备份头（最后 33 扇区 ≈ 16.5KiB）的保护
          // 由底层分区工具（sgdisk/parted/fdisk）在创建分区时自动处理，
          // 与 anaconda/archinstall 一致，不在采集阶段预扣磁盘大小。
          size: parseInt(disk.size, 10) - 1024 * 1024,
          type: disk.type,
          mountpoint: disk.mountpoint || null,
          sector_size: sectorSize,
          partitions,
        }
      })

      console.log('Optimized disks info retrieved, count:', disks.length)
      return { success: true, disks }
    } catch (error) {
      console.error('Failed to get disk info:', error)
      return {
        success: false,
        error: error.message,
        suggestion: 'Please ensure lsblk command is available and try again'
      }
    }
  })

  // 获取磁盘扇区大小
  ipcMain.handle('get-disk-sector-size', async (event, { diskDevice }) => {
    try {
      // 检查fdisk命令是否可用
      try {
        execSync('which fdisk');
      } catch {
        throw new Error('Required command (fdisk) not found');
      }

      // 验证磁盘设备是否存在
      if (!fs.existsSync(diskDevice)) {
        throw new Error(`Disk device ${diskDevice} not found`);
      }

      // 使用fdisk获取扇区大小信息
      const fdiskOutput = execSync(`fdisk -l ${diskDevice} | grep "Sector size"`).toString().trim();

      if (!fdiskOutput) {
        throw new Error('Could not determine sector size from fdisk output');
      }

      // 解析fdisk输出，例如: "Sector size (logical/physical): 512 bytes / 512 bytes"
      const sectorSizeMatch = fdiskOutput.match(/Sector size.*?(\d+) bytes/);
      if (!sectorSizeMatch) {
        throw new Error('Could not parse sector size from fdisk output');
      }

      const sectorSize = parseInt(sectorSizeMatch[1], 10);

      return {
        success: true,
        sector_size: {
          value: sectorSize,
          unit: 'B'
        }
      };
    } catch (error) {
      console.error('Failed to get disk sector size:', error);
      return {
        success: false,
        error: error.message,
        suggestion: 'Please ensure fdisk command is available and disk device exists'
      };
    }
  });
}


module.exports = {
  registerIpcListeners
}
