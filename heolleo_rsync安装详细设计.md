# heolleo 详细设计文档

## 1. 项目概述

heolleo 是一个现代化的操作系统安装客户端工具，采用 Vue 3 + Electron 技术栈，包含 eulerinstall Python 安装引擎。项目旨在提供用户友好的图形界面来安装 openEuler 和 Arch Linux 系统。

### 1.1 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **UI 组件库**: Element Plus
- **桌面框架**: Electron
- **构建工具**: Vite, Electron Builder
- **后端引擎**: Python 3.10+ (eulerinstall，基于 archinstall 修改)
- **通信协议**: IPC (进程间通信)
- **包管理**: npm/yarn, pip

### 1.2 项目结构

```
heolleo/
├── electron/                    # Electron 主进程代码
│   ├── main.js                 # 主进程入口
│   ├── ipc.js                  # IPC 通信处理
│   └── preload.js              # 预加载脚本
├── src/                        # 前端源代码
│   ├── services/               # 服务层
│   │   ├── InstallService.ts   # 安装服务
│   │   └── ConfigGenerator.ts  # 配置生成器
│   ├── utils/                  # 工具函数
│   │   └── constant.ts         # 类型定义和常量
│   ├── views/                  # 页面组件
│   │   ├── LanguageSelect.vue  # 语言选择
│   │   ├── TimezoneSelect.vue  # 时区选择
│   │   └── components/         # 安装组件
│   ├── router/                 # 路由配置
│   └── App.vue                 # 应用根组件
├── eulerinstall/               # Python 安装引擎
│   ├── eulerinstall/           # 核心模块
│   │   ├── __init__.py         # 模块初始化
│   │   ├── __main__.py         # 入口点
│   │   ├── lib/                # 库模块
│   │   └── scripts/            # 安装脚本
│   └── setup.py                # Python 包配置
├── package.json                # 项目配置和依赖
└── README.md                   # 项目说明
```

## 2. 系统架构设计

### 2.1 架构概述

heolleo 采用典型的 Electron 应用架构，分为三个主要部分：

1. **渲染进程 (Renderer Process)**: Vue 3 前端应用，负责用户界面和交互
2. **主进程 (Main Process)**: Electron 主进程，负责窗口管理和系统集成
3. **Python 后端进程**: 独立的 Python 进程，负责系统安装操作

### 2.2 进程间通信 (IPC)

通信流程如下：

```
渲染进程 (Vue) ↔ IPC ↔ 主进程 (Electron) ↔ 子进程 ↔ Python 后端
```

**关键通信接口**:
- 前端通过 `window.electronAPI` 调用 IPC 方法
- 主进程通过 `ipcMain.handle()` 处理请求
- Python 后端通过标准输入/输出或 RPC 与主进程通信

### 2.3 数据流

1. **用户配置流**: 用户界面 → Vue 状态管理 → IPC → Python 配置对象
2. **安装状态流**: Python 后端 → IPC → Vue 状态 → 界面更新
3. **错误处理流**: 各层错误 → 统一错误格式 → IPC → 界面显示

## 3. 关键模块设计

### 3.1 前端模块

#### 3.1.1 安装服务 (InstallService.ts)

```typescript
class InstallService {
  // 核心方法
  createUser(userConfig: UserConfig): Promise<Result>
  partitionDisk(diskConfig: DiskConfig): Promise<Result>
  mountImage(imagePath: string): Promise<Result>
  copyFiles(source: string, target: string): Promise<Result>
  configureGrub(config: GrubConfig): Promise<Result>
  
  // 辅助方法
  checkRoot(): Promise<boolean>
  getBootMode(): Promise<'bios' | 'uefi'>
  getDiskInfo(): Promise<DiskInfo[]>
}
```

#### 3.1.2 配置生成器 (ConfigGenerator.ts)

```typescript
class ConfigGenerator {
  // 生成 archinstall 格式配置
  generateConfig(installInfo: InstallInfo): ArchConfig
  
  // 生成用户配置
  generateUserConfig(users: UserConfig[]): UserConfig
  
  // 导出配置到文件
  exportConfig(config: ArchConfig, path: string): Promise<void>
  
  // 支持自动分区和手动分区
  generatePartitionConfig(
    disk: DiskInfo,
    mode: 'auto' | 'manual',
    options: PartitionOptions
  ): PartitionConfig
}
```

### 3.2 后端模块

#### 3.2.1 安装引擎 (eulerinstall)

基于 archinstall 修改，支持 openEuler 和 Arch Linux 安装。

**核心类**:
- `Installer`: 安装器主类，负责系统安装的各个步骤
- `DiskLayoutConfiguration`: 磁盘布局配置
- `FilesystemHandler`: 文件系统操作处理器
- `Pacman`: 包管理器封装

#### 3.2.2 引导安装脚本 (guided.py)

```python
def guided() -> None:
    """引导式安装主函数"""
    # 1. 收集用户输入
    ask_user_questions()
    
    # 2. 生成并保存配置
    config = ConfigurationOutput(arch_config_handler.config)
    config.save()
    
    # 3. 执行文件系统操作
    fs_handler = FilesystemHandler(config.disk_config)
    fs_handler.perform_filesystem_operations()
    
    # 4. 执行安装
    perform_installation(mountpoint)
```

#### 3.2.3 安装步骤 (perform_installation)

```python
def perform_installation(mountpoint: Path) -> None:
    with Installer(mountpoint, disk_config) as installation:
        # 挂载文件系统
        installation.mount_ordered_layout()
        
        # 基础安装
        installation.minimal_installation(
            hostname=config.hostname,
            locale_config=locale_config
        )
        
        # 安装引导加载器
        installation.add_bootloader(config.bootloader)
        
        # 创建用户
        installation.create_users(config.auth_config.users)
        
        # 安装额外软件包
        installation.add_additional_packages(config.packages)
        
        # 生成 fstab
        installation.genfstab()
        
        # 重建 initramfs
        installation.regenerate_initramfs()
        
        # 更新 GRUB
        installation.updategrub()
```

## 4. 前后端接口详细说明

### 4.1 IPC 接口 (electron/ipc.js)

#### 4.1.1 系统检测接口

```javascript
// 检查 root 权限
ipcMain.handle('check-root', async () => {
  return await pythonCall('check_root')
})

// 获取启动模式
ipcMain.handle('get-boot-mode', async () => {
  return await pythonCall('get_boot_mode')
})

// 获取磁盘信息
ipcMain.handle('get-disk-info', async () => {
  return await pythonCall('get_disk_info')
})
```

#### 4.1.2 磁盘操作接口

```javascript
// 分区磁盘
ipcMain.handle('partition-disk', async (event, config) => {
  return await pythonCall('partition_disk', config)
})

// 格式化分区
ipcMain.handle('format-partition', async (event, config) => {
  return await pythonCall('format_partition', config)
})

// 挂载分区
ipcMain.handle('mount-partition', async (event, config) => {
  return await pythonCall('mount_partition', config)
})
```

#### 4.1.3 安装操作接口

```javascript
// 安装系统
ipcMain.handle('install-system', async (event, config) => {
  return await pythonCall('install_system', config)
})

// 创建用户
ipcMain.handle('create-user', async (event, userConfig) => {
  return await pythonCall('create_user', userConfig)
})

// 配置引导加载器
ipcMain.handle('configure-bootloader', async (event, config) => {
  return await pythonCall('configure_bootloader', config)
})
```

#### 4.1.4 系统配置接口

```javascript
// 设置主机名
ipcMain.handle('set-hostname', async (event, hostname) => {
  return await pythonCall('set_hostname', hostname)
})

// 设置时区
ipcMain.handle('set-timezone', async (event, timezone) => {
  return await pythonCall('set_timezone', timezone)
})

// 设置语言环境
ipcMain.handle('set-locale', async (event, locale) => {
  return await pythonCall('set_locale', locale)
})
```

### 4.2 前端服务层接口 (src/services/InstallService.ts)

#### 4.2.1 服务方法

```typescript
// 检查安装环境
async checkEnvironment(): Promise<EnvironmentCheck> {
  const [hasRoot, bootMode, disks] = await Promise.all([
    this.checkRoot(),
    this.getBootMode(),
    this.getDiskInfo()
  ])
  
  return { hasRoot, bootMode, disks }
}

// 执行完整安装
async performInstallation(installInfo: InstallInfo): Promise<InstallResult> {
  // 1. 生成配置
  const config = this.configGenerator.generateConfig(installInfo)
  
  // 2. 分区磁盘
  await this.partitionDisk(config.diskConfig)
  
  // 3. 安装系统
  await this.installSystem(config)
  
  // 4. 创建用户
  for (const user of config.users) {
    await this.createUser(user)
  }
  
  // 5. 配置引导
  await this.configureBootloader(config.bootloader)
  
  return { success: true }
}
```

## 5. 数据流和通信协议

### 5.1 请求/响应格式

```typescript
// 请求格式
interface IPCRequest {
  id: string
  method: string
  params: any
  timestamp: number
}

// 响应格式
interface IPCResponse {
  id: string
  result?: any
  error?: {
    code: number
    message: string
    details?: any
  }
  timestamp: number
}
```

### 5.2 错误处理

```typescript
// 错误代码定义
enum ErrorCode {
  // 系统错误
  SYSTEM_ERROR = 1000,
  PERMISSION_DENIED = 1001,
  DISK_ERROR = 1002,
  
  // 安装错误
  INSTALLATION_FAILED = 2000,
  PARTITION_FAILED = 2001,
  BOOTLOADER_FAILED = 2002,
  
  // 配置错误
  INVALID_CONFIG = 3000,
  MISSING_REQUIRED = 3001
}

// 统一错误格式
class InstallationError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'InstallationError'
  }
}
```

### 5.3 状态管理

使用 Vue 3 的 Composition API 进行状态管理：

```typescript
// 安装状态管理
const useInstallStore = () => {
  const installInfo = ref<InstallInfo>({
    language: 'zh_CN',
    timezone: 'Asia/Shanghai',
    hostname: 'openEuler',
    diskConfig: null,
    userConfig: [],
    packages: []
  })
  
  const currentStep = ref(0)
  const installationStatus = ref<'idle' | 'running' | 'success' | 'error'>('idle')
  const error = ref<InstallationError | null>(null)
  
  return {
    installInfo,
    currentStep,
    installationStatus,
    error,
    
    // 操作方法
    nextStep() { currentStep.value++ },
    prevStep() { currentStep.value-- },
    setError(err: InstallationError) {
      error.value = err
      installationStatus.value = 'error'
    }
  }
}
```

## 6. 安装流程设计

### 6.1 完整安装流程

```
开始
  ↓
检查环境 (root权限、启动模式、磁盘)
  ↓
选择语言和时区
  ↓
设置主机名
  ↓
磁盘分区 (自动/手动)
  ↓
用户设置 (root密码、普通用户)
  ↓
软件包选择
  ↓
确认配置
  ↓
执行安装
  ├─ 分区磁盘
  ├─ 格式化文件系统
  ├─ 挂载分区
  ├─ 安装基础系统
  ├─ 安装引导加载器
  ├─ 创建用户
  ├─ 安装额外软件包
  ├─ 生成 fstab
  ├─ 重建 initramfs
  └─ 更新 GRUB
  ↓
安装完成
  ↓
重启系统
```

### 6.2 磁盘分区流程

```python
def partition_disk(disk_config: DiskConfig) -> Result:
    # 1. 清理现有分区表
    wipefs(disk_config.device)
    
    # 2. 创建新分区表 (GPT/MBR)
    create_partition_table(disk_config)
    
    # 3. 创建分区
    for partition in disk_config.partitions:
        create_partition(partition)
    
    # 4. 格式化分区
    for partition in disk_config.partitions:
        format_partition(partition)
    
    # 5. 挂载分区
    mount_partitions(disk_config)
    
    return success()
```

### 6.3 BTRFS 子卷配置

```python
def setup_btrfs_with_subvolumes(device: str, subvolumes: List[SubvolumeConfig]):
   
```

## 7. 配置生成器设计

### 7.1 Archinstall 配置格式

```python
# archinstall 配置文件示例
config = {
    'disk_config': {
        'device': '/dev/sda',
        'partitions': [
            {
                'type': 'efi',
                'size': '512M',
                'mountpoint': '/boot/efi'
            },
            {
                'type': 'swap',
                'size': '4G'
            },
            {
                'type': 'btrfs',
                'size': '100%',
                'mountpoint': '/',
                'subvolumes': [
                    {'name': '@', 'mountpoint': '/'},
                    {'name': '@home', 'mountpoint': '/home'},
                    {'name': '@var', 'mountpoint': '/var'}
                ]
            }
        ]
    },
    'locale_config': {
        'sys_lang': 'zh_CN.UTF-8',
        'kb_layout': 'us'
    },
    'auth_config': {
        'users': [
            {
                'username': 'user',
                'password': 'encrypted_password',
                'sudo': True
            }
        ]
    }
}
```

### 7.2 配置转换逻辑

```typescript
class ConfigGenerator {
  generateConfig(installInfo: InstallInfo): ArchConfig {
    
  }
  
  generateDiskConfig(diskConfig: DiskConfig): DiskConfig {
    
  }
}
```

## 8. 磁盘分区和文件系统管理

### 8.1 支持的磁盘布局

1. **简单布局**: EFI + 根分区 (+ 交换分区)
2. **LVM 布局**: EFI + LVM 卷组 (包含根、家目录等)
3. **BTRFS 布局**: EFI + BTRFS 根卷 (带子卷)
4. **加密布局**: LUKS 加密的上述布局

### 8.2 文件系统支持

- **EFI 系统分区**: FAT32
- **根分区**: ext4, BTRFS, XFS
- **家目录**: ext4, BTRFS, XFS
- **交换分区**: swap
- **其他**: NTFS (数据分区)

### 8.3 LVM 配置

```python
def setup_lvm(disk_config: LvmConfig):
    # 创建物理卷
    for pv in disk_config.physical_volumes:
        pvcreate(pv.device)
    
    # 创建卷组
    vgcreate(disk_config.vg_name, disk_config.physical_volumes)
    
    # 创建逻辑卷
    for lv in disk_config.logical_volumes:
        lvcreate(
            size=lv.size,
            name=lv.name,
            vgname=disk_config.vg_name
        )
        
        # 格式化逻辑卷
        mkfs(lv.fs_type, lv.device_path)
```

## 9. 用户管理和系统配置

### 9.1 用户创建流程

```python
def create_user(user_config: UserConfig):
    # 创建用户
    useradd(
        username=user_config.username,
        create_home=True,
        groups=user_config.groups
    )
    
    # 设置密码
    if user_config.password:
        set_password(user_config.username, user_config.password)
    
    # 配置 sudo 权限
    if user_config.sudo:
        enable_sudo(user_config.username)
    
    # 设置 shell
    if user_config.shell:
        set_shell(user_config.username, user_config.shell)
```

### 9.2 系统配置

```python
def configure_system(config: SystemConfig):
    # 设置主机名
    set_hostname(config.hostname)
    
    # 设置时区
    set_timezone(config.timezone)
    
    # 设置语言环境
    set_locale(config.locale)
    
    # 配置网络
    if config.network:
        configure_network(config.network)
    
    # 配置服务
    for service in config.services:
        enable_service(service)
```

## 10. 错误处理和日志系统

### 10.1 错误处理策略

1. **预防性检查**: 在执行操作前检查前提条件
2. **优雅降级**: 当非关键功能失败时继续安装
3. **详细日志**: 记录所有操作和错误信息
4. **用户反馈**: 提供清晰的错误信息和解决建议

### 10.2 日志系统

```python
class InstallationLogger:
    def __init__(self, log_dir: Path):
        self.log_dir = log_dir
        self.log_file = log_dir / 'installation.log'
        
    def info(self, message: str):
        self._write('INFO', message)
        
    def error(self, message: str, exception: Exception = None):
        self._write('ERROR', message)
        if exception:
            self._write('ERROR', str(exception))
            self._write('ERROR', traceback.format_exc())
    
    def _write(self, level: str, message: str):
        timestamp = datetime.now().isoformat()
        log_entry = f'{timestamp} [{level}] {message}\n'
        
        with open(self.log_file, 'a') as f:
            f.write(log_entry)
        
        # 同时输出到控制台
        print(log_entry, end='')
```

### 10.3 安装状态监控

```typescript
interface InstallationProgress {
  currentStep: string
  progress: number  // 0-100
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  details?: any
}

class ProgressMonitor {
  private progress: InstallationProgress
  
  update(step: string, progress: number, message: string) {
    this.progress = {
      currentStep: step,
      progress,
      status: progress < 100 ? 'running' : 'completed',
      message
    }
    
    // 通过 IPC 发送更新到前端
    window.electronAPI.updateProgress(this.progress)
  }
  
  fail(error: InstallationError) {
    this.progress = {
      ...this.progress,
      status: 'failed',
      message: error.message
    }
    
    window.electronAPI.installationFailed(error)
  }
}
```

## 11. 性能优化和安全考虑

### 11.1 性能优化

1. **并行操作**: 磁盘分区和软件包下载并行执行
2. **增量复制**: 使用 rsync 进行智能文件复制
3. **缓存利用**: 缓存软件包和镜像文件
4. **进度反馈**: 实时进度更新，避免界面卡顿

### 11.2 安全考虑

1. **权限最小化**: 仅请求必要的系统权限
2. **输入验证**: 所有用户输入都经过严格验证
3. **密码安全**: 密码加密存储，不在日志中记录
4. **安全通信**: IPC 通信使用安全通道
5. **错误隔离**: 安装错误不影响主机系统

## 12. 扩展性和维护性

### 12.1 插件系统

支持通过插件扩展功能：

```python
# 插件接口
class InstallationPlugin:
    def on_before_install(self, installer: Installer):
        pass
    
    def on_after_install(self, installer: Installer):
        pass
    
    def on_error(self, installer: Installer, error: Exception):
        pass
```

### 12.2 配置模板

提供预定义的配置模板：

```yaml
templates:
  desktop:
    description: "桌面环境安装"
    packages:
      - gnome
      - firefox
      - libreoffice
    services:
      - gdm
      - networkmanager
  
  server:
    description: "服务器安装"
    packages:
      - nginx
      - mariadb
      - php
    services:
      - nginx
      - mariadb
```

### 12.3 国际化支持

支持多语言界面和安装配置：

```typescript
// 语言文件结构
locales/
  zh-CN.json
  en-US.json
  ja-JP.json

// 使用示例
const i18n = createI18n({
  locale: userLanguage,
  messages: {
    [userLanguage]: localeMessages
  }
})
```

## 13. 测试策略

### 13.1 测试类型

1. **单元测试**: 测试各个模块的功能
2. **集成测试**: 测试模块间的交互
3. **端到端测试**: 测试完整安装流程
4. **兼容性测试**: 测试不同硬件和系统环境

### 13.2 测试工具

- **前端测试**: Vitest, Vue Test Utils
- **后端测试**: pytest, unittest
- **E2E 测试**: Playwright, Cypress
- **性能测试**: k6, Lighthouse

## 14. 部署和分发

### 14.1 打包配置

```json
{
  "build": {
    "appId": "com.heolleo.installer",
    "productName": "heolleo",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron/**/*",
      "src/**/*",
      "eulerinstall/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "eulerinstall",
        "to": "eulerinstall"
      }
    ]
  }
}
```

### 14.2 发布渠道

1. **GitHub Releases**: 提供安装包下载
2. **包管理器**: 支持通过系统包管理器安装
3. **ISO 集成**: 集成到 openEuler 安装镜像中
4. **Docker 镜像**: 提供容器化版本

## 15. 未来规划

### 15.1 短期目标

1. 完善 openEuler 安装支持
2. 增加更多桌面环境选项
3. 改进错误处理和用户反馈
4. 优化安装性能

### 15.2 长期目标

1. 支持更多 Linux 发行版
2. 实现网络安装功能
3. 添加系统备份和恢复功能
4. 开发移动端管理应用
