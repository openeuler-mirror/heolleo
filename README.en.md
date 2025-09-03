# heolleo

## Project Description

heolleo is a modern operating system installation client tool specifically designed for installing devstation development environments. It utilizes Vue 3 + Electron technology stack to provide an intuitive user interface and intelligent installation experience.

## ✨ Key Features

- **Modern Interface**: Built with Vue 3 and Element Plus for a contemporary user experience
- **Cross-Platform Support**: Electron-based support for Windows, Linux, and macOS
- **Multi-language Support**: Built-in internationalization with English and Chinese
- **Smart Installation**: Integrated hardware recognition and intelligent configuration recommendations
- **High Performance**: Vite build tool for fast development and building
- **Modular Design**: Layered architecture for easy extension and maintenance

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Python 3.11+ (for eulerinstall subproject)

### Install Dependencies

```sh
npm install
```

### Development Mode

```sh
# Start development server
npm run dev

# Start Electron app (requires npm run dev first)
npm run electron:dev

# Or use combined command
npm run electron:dev
```

### Build for Production

```sh
# Build web application
npm run build

# Build and start Electron application
npm start
```

## 📁 Project Structure

```
heolleo/
├── electron/                 # Electron main process code
│   ├── main.js              # Main process entry
│   ├── ipc.js               # IPC communication handling
│   └── preload.js           # Preload script
├── eulerinstall/            # Euler system installation engine (Python)
│   ├── eulerinstall/        # Installer core code
│   ├── examples/            # Usage examples
│   ├── tests/               # Test code
│   └── pyproject.toml       # Python project configuration
├── src/                     # Vue application source code
│   ├── assets/              # Static assets
│   ├── components/          # Common components
│   ├── views/               # Page components
│   ├── router/              # Routing configuration
│   ├── services/            # Service layer
│   ├── lang/                # Internationalization configuration
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── public/                  # Public static files
└── lib/                     # Local dependency libraries
```

## 🔧 Technology Stack

### Frontend Technologies
- **Vue 3**: Progressive JavaScript framework
- **TypeScript**: Type-safe JavaScript superset
- **Vite**: Next-generation frontend build tool
- **Element Plus**: Vue 3 based component library
- **Vue Router**: Official routing manager
- **Vue I18n**: Internationalization solution

### Desktop Technologies
- **Electron**: Build cross-platform desktop apps with web technologies
- **Node.js**: JavaScript runtime environment

### Backend Technologies
- **Python 3.11+**: eulerinstall installation engine
- **Rust** (Planned): High-performance system-level operations

## 🎯 Core Features

### Installation Process
1. **Hardware Detection**: Automatic system hardware configuration recognition
2. **Partition Scheme**: Intelligent disk partition recommendations
3. **Software Selection**: Pre-configured software package combinations
4. **Configuration Confirmation**: Visual confirmation of installation options
5. **Installation Execution**: Parallelized installation process with real-time progress

### Special Features
- **AI-Driven Configuration**: Intelligent configuration recommendations based on hardware fingerprinting
- **Multi-language Support**: Complete English and Chinese interfaces
- **Real-time Progress**: Live feedback during installation
- **Error Recovery**: Recovery mechanisms for installation failures
- **Logging**: Detailed installation log recording

## 🛠️ Development Guide

### Code Standards
- Use ESLint + Prettier for code formatting
- Follow Vue 3 Composition API best practices
- TypeScript strict mode enabled

### Commit Convention
Follow Conventional Commits specification:
- feat: New feature
- fix: Bug fix
- docs: Documentation updates
- style: Code formatting changes
- refactor: Code refactoring
- test: Test related
- chore: Build process or auxiliary tools changes

### Internationalization Development
The project uses Vue I18n for internationalization support. To add new translations:
1. Add corresponding translations in `src/lang/en.ts` and `src/lang/zh.ts`
2. Use `$t('key')` in code for text references

## 📦 Deployment Instructions

### Development Environment
```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron development version
npm run electron:dev
```

### Production Environment
```sh
# Build application
npm run build

# Package Electron application (requires additional configuration)
# Use electron-builder or electron-forge for packaging
```

## 🤝 Contributing Guidelines

We welcome contributions of all kinds! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Review Standards
- Code follows project coding standards
- Includes appropriate test cases
- Updates relevant documentation
- Passes all CI checks

## 📄 License

This project is licensed under the GPL v3.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project is built thanks to the following open-source libraries and technologies:

1. **Vue** - Progressive JavaScript Framework
2. **Electron** - Build cross-platform desktop apps with web technologies
3. **archinstall** - Arch Linux installation framework (eulerinstall foundation)
4. **Element Plus** - Vue 3 based component library
5. **Vite** - Next-generation frontend build tool

## 📞 Support & Feedback

If you encounter issues or have suggestions, please contact us through:

- Submit an [Issue](https://gitee.com/openeuler/heolleo)
- Join our community discussions

---

**heolleo** - Making system installation simpler and smarter! 🚀
