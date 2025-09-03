# heolleo

## 项目描述

heolleo 是一个现代化的操作系统安装客户端工具，专门用于安装 devstation 开发环境。它采用 Vue 3 + Electron 技术栈，提供直观的用户界面和智能化的安装体验。

## ✨ 主要特性

- **现代化界面**: 基于 Vue 3 和 Element Plus 构建的现代化用户界面
- **跨平台支持**: 使用 Electron 实现 Windows、Linux、macOS 多平台支持
- **多语言支持**: 内置中英文国际化支持
- **智能安装**: 集成硬件识别和智能配置推荐功能
- **高性能**: 使用 Vite 构建工具，提供快速的开发体验和构建速度
- **模块化设计**: 采用分层架构，便于功能扩展和维护

## 🚀 快速开始

### 环境要求

- Node.js 18.0.0 或更高版本
- npm 或 yarn 包管理器
- Python 3.11+ (用于 eulerinstall 子项目)

### 安装依赖

```sh
npm install
```

### 开发模式运行

```sh
# 启动开发服务器
npm run dev

# 启动 Electron 应用 (需要先运行 npm run dev)
npm run electron:dev

# 或者使用组合命令
npm run electron:dev
```

### 构建生产版本

```sh
# 构建 Web 应用
npm run build

# 构建并启动 Electron 应用
npm start
```

## 📁 项目结构

```
heolleo/
├── electron/                 # Electron 主进程代码
│   ├── main.js              # 主进程入口
│   ├── ipc.js               # IPC 通信处理
│   └── preload.js           # 预加载脚本
├── eulerinstall/            # 欧拉系统安装引擎 (Python)
│   ├── eulerinstall/        # 安装器核心代码
│   ├── examples/            # 使用示例
│   ├── tests/               # 测试代码
│   └── pyproject.toml       # Python 项目配置
├── src/                     # Vue 应用源代码
│   ├── assets/              # 静态资源
│   ├── components/          # 公共组件
│   ├── views/               # 页面组件
│   ├── router/              # 路由配置
│   ├── services/            # 服务层
│   ├── lang/                # 国际化配置
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数
├── public/                  # 公共静态文件
└── lib/                     # 本地依赖库
```

## 🔧 技术栈

### 前端技术
- **Vue 3**: 渐进式 JavaScript 框架
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 下一代前端构建工具
- **Element Plus**: 基于 Vue 3 的组件库
- **Vue Router**: 官方路由管理器
- **Vue I18n**: 国际化解决方案

### 桌面端技术
- **Electron**: 使用 Web 技术构建跨平台桌面应用
- **Node.js**: JavaScript 运行时环境

### 后端技术
- **Python 3.11+**: eulerinstall 安装引擎
- **Rust** (计划中): 高性能系统级操作

## 🎯 核心功能

### 安装流程
1. **硬件检测**: 自动识别系统硬件配置
2. **分区方案**: 智能推荐磁盘分区方案
3. **软件选择**: 提供预设的软件包组合
4. **配置确认**: 可视化确认安装选项
5. **安装执行**: 并行化安装过程，实时进度显示

### 特色功能
- **AI 驱动配置**: 基于硬件指纹的智能配置推荐
- **多语言支持**: 完整的中英文界面
- **实时进度**: 安装过程实时反馈
- **错误恢复**: 安装失败时的恢复机制
- **日志记录**: 详细的安装日志记录

## 🛠️ 开发指南

### 代码规范
- 使用 ESLint + Prettier 进行代码格式化
- 遵循 Vue 3 组合式 API 最佳实践
- TypeScript 严格模式启用

### 提交规范
遵循 Conventional Commits 规范：
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具变动

### 国际化开发
项目使用 Vue I18n 进行国际化支持，新增翻译内容需要：
1. 在 `src/lang/en.ts` 和 `src/lang/zh.ts` 中添加对应的翻译
2. 在代码中使用 `$t('key')` 进行文本引用

## 📦 部署说明

### 开发环境
```sh
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动 Electron 开发版本
npm run electron:dev
```

### 生产环境
```sh
# 构建应用
npm run build

# 打包 Electron 应用 (需要额外配置)
# 可使用 electron-builder 或 electron-forge 进行打包
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！请参考以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码审查标准
- 代码符合项目的编码规范
- 包含适当的测试用例
- 更新相关文档
- 通过所有 CI 检查

## 📄 许可证

本项目采用 GPL v3.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

本项目的构建得益于以下开源库和技术：

1. **Vue** - 渐进式 JavaScript 框架
2. **Electron** - 使用 Web 技术构建跨平台桌面应用
3. **archinstall** - Arch Linux 安装框架 (eulerinstall 基础)
4. **Element Plus** - 基于 Vue 3 的组件库
5. **Vite** - 下一代前端构建工具

## 📞 支持与反馈

如果您遇到问题或有建议，请通过以下方式联系我们：

- 提交 [Issue](https://gitee.com/openeuler/heolleo)
- 加入我们的社区讨论

---

**heolleo** - 让系统安装变得更简单、更智能！ 🚀
