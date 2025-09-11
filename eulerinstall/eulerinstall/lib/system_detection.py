# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

import os
import subprocess
from pathlib import Path
from typing import Literal

from .output import debug, info


class SystemType:
    """检测当前运行的操作系统类型"""
    
    @staticmethod
    def detect() -> Literal['arch', 'openEuler', 'ubuntu', 'debian', 'unknown']:
        """检测当前操作系统类型"""
        try:
            # 检查 /etc/os-release 文件
            if Path('/etc/os-release').exists():
                with open('/etc/os-release', 'r') as f:
                    content = f.read().lower()
                    if 'arch' in content:
                        return 'arch'
                    elif 'openEuler' in content:
                        return 'openEuler'
                    elif 'ubuntu' in content:
                        return 'ubuntu'
                    elif 'debian' in content:
                        return 'debian'
                    elif 'openEuler' in content:
                        return 'openEuler'
            
            # 检查包管理器
            if subprocess.run(['which', 'pacman'], capture_output=True).returncode == 0:
                return 'arch'
            elif subprocess.run(['which', 'dnf'], capture_output=True).returncode == 0:
                return 'openEuler'
            elif subprocess.run(['which', 'apt'], capture_output=True).returncode == 0:
                return 'debian'
            
            return 'unknown'
        except Exception as e:
            debug(f'Error detecting system type: {e}')
            return 'unknown'
    
    @staticmethod
    def get_package_manager() -> str:
        """获取当前系统的包管理器"""
        system_type = SystemType.detect()
        
        match system_type:
            case 'arch':
                return 'pacman'
            case 'openEuler':
                return 'dnf'
            case 'ubuntu' | 'debian':
                return 'apt'
            case _:
                return 'unknown'
    
    @staticmethod
    def get_install_command() -> str:
        """获取安装命令"""
        system_type = SystemType.detect()
        
        match system_type:
            case 'arch':
                return 'pacstrap'
            case 'openEuler':
                return 'dnf'
            case 'ubuntu' | 'debian':
                return 'debootstrap'
            case _:
                return 'unknown'
    
    @staticmethod
    def get_sync_command() -> str:
        """获取同步命令"""
        system_type = SystemType.detect()
        
        match system_type:
            case 'arch':
                return 'pacman -Syy'
            case 'openEuler':
                return 'dnf makecache'
            case 'ubuntu' | 'debian':
                return 'apt update'
            case _:
                return 'unknown'
    
    @staticmethod
    def get_time_sync_command() -> str:
        """获取时间同步命令"""
        system_type = SystemType.detect()
        
        match system_type:
            case 'arch':
                return 'timedatectl show --property=NTPSynchronized --value'
            case 'openEuler':
                return 'timedatectl show --property=NTPSynchronized --value'
            case 'ubuntu' | 'debian':
                return 'timedatectl show --property=NTPSynchronized --value'
            case _:
                return 'timedatectl show --property=NTPSynchronized --value'
    
    @staticmethod
    def get_mirror_service() -> str:
        """获取镜像服务名称"""
        system_type = SystemType.detect()
        
        match system_type:
            case 'arch':
                return 'reflector'
            case 'openEuler':
                return 'dnf-makecache.timer'
            case 'ubuntu' | 'debian':
                return 'apt-daily.timer'
            case _:
                return 'unknown'
    
    @staticmethod
    def get_keyring_service() -> str:
        """获取密钥环服务名称"""
        system_type = SystemType.detect()
        
        match system_type:
            case 'arch':
                return 'archlinux-keyring-wkd-sync'
            case 'openEuler':
                return 'gpg-agent'
            case 'ubuntu' | 'debian':
                return 'gpg-agent'
            case _:
                return 'unknown'
    
    @staticmethod
    def is_supported() -> bool:
        """检查当前系统是否支持"""
        system_type = SystemType.detect()
        return system_type in ['arch', 'openEuler']
    
    @staticmethod
    def log_system_info() -> None:
        """记录系统信息"""
        system_type = SystemType.detect()
        info(f'Detected system type: {system_type}')
        info(f'Package manager: {SystemType.get_package_manager()}')
        info(f'Install command: {SystemType.get_install_command()}')
        
        if not SystemType.is_supported():
            info('Warning: This system type is not officially supported by archinstall') 