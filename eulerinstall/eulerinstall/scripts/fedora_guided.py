# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

#!/usr/bin/env python3
"""
openEuler guided installation script
This script adapts archinstall for openEuler systems
"""

import archinstall
from eulerinstall.lib.system_detection import SystemType

def main():
    """
    openEuler guided installation
    """
    # 检查是否在openEuler系统上运行
    if SystemType.detect() != 'openEuler':
        archinstall.error('This script is designed for openEuler systems only.')
        return 1
    
    archinstall.info('Starting openEuler guided installation...')
    
    # 这里可以添加openEuler特定的安装逻辑
    # 目前先使用默认的引导安装
    from eulerinstall.scripts.guided import main as guided_main
    return guided_main()

if __name__ == '__main__':
    main() 