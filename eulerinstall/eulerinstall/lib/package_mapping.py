# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

"""
Package name mapping between different distributions
"""

from typing import Dict, List


class PackageMapping:
    """包名映射类，用于在不同发行版之间转换包名"""
    
    # Arch Linux 到 openEuler 的包名映射
    ARCH_TO_openEuler: Dict[str, str] = {
        # 基础包
        'base': 'openEuler-release',
        'base-devel': 'gcc make systemd sudo',
        'linux': 'kernel', 
        'linux-firmware': 'linux-firmware yum vim rpm passwd',
        
        # 微码包映射
        'amd-ucode': 'microcode_ctl',
        'intel-ucode': 'microcode_ctl',
        
        # 桌面环境
        'gnome': 'gnome-shell gnome-session',
        'kde': 'plasma-desktop',
        'xfce4': 'xfce4-session xfce4-panel',
        
        # 网络
        'networkmanager': 'NetworkManager',
        'iwd': 'iwd',
        
        # 音频
        'pulseaudio': 'pulseaudio',
        'pipewire': 'pipewire',
        'alsa-utils': 'alsa-utils',
        
        # 文件系统
        'btrfs-progs': 'btrfs-progs',
        'xfsprogs': 'xfsprogs',
        'f2fs-tools': 'f2fs-tools',
        'dosfstools': 'dosfstools',
        'e2fsprogs': 'e2fsprogs',
        'ntfs-3g': 'ntfs-3g',
        
        # 加密
        'cryptsetup': 'cryptsetup',
        'lvm2': 'lvm2',
        
        # 工具
        'vim': 'vim',
        'nano': 'nano',
        'git': 'git',
        'curl': 'curl',
        'wget': 'wget',
        'htop': 'htop',
        'tree': 'tree',
        'rsync': 'rsync',
        'unzip': 'unzip',
        'zip': 'zip',
        'tar': 'tar',
        'gzip': 'gzip',
        'bzip2': 'bzip2',
        'xz': 'xz',
    }
    
    @classmethod
    def map_package(cls, package_name: str, target_system: str = 'openEuler') -> str:
        """将包名映射到目标系统"""
        if target_system == 'openEuler':
            return cls.ARCH_TO_openEuler.get(package_name, package_name)
        return package_name
    
    @classmethod
    def map_packages(cls, packages: List[str], target_system: str = 'openEuler') -> List[str]:
        """将包列表映射到目标系统"""
        if target_system == 'openEuler':
            mapped_packages = []
            for package in packages:
                mapped = cls.map_package(package, target_system)
                # 处理包含多个包的情况
                if ' ' in mapped:
                    mapped_packages.extend(mapped.split())
                else:
                    mapped_packages.append(mapped)
            return mapped_packages
        return packages
    
    @classmethod
    def get_base_packages(cls, target_system: str = 'openEuler') -> List[str]:
        """获取基础包列表"""
        if target_system == 'openEuler':
            return [
                'openEuler-release',
                'gcc',
                'make',
                'patch',
                'kernel',
                'linux-firmware',
                'systemd',
                'NetworkManager',
                'sudo',
                'vim',
                'nano',
                'curl',
                'wget',
                'git',
            ]
        else:
            return ['base', 'base-devel', 'linux', 'linux-firmware'] 