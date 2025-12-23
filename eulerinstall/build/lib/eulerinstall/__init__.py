# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

"""Arch Linux installer - guided, templates etc."""

import importlib
import os
import sys
import time
import traceback

from .lib.args import arch_config_handler
from .lib.disk.utils import disk_layouts
from .lib.packages.packages import check_package_upgrade

from .lib.hardware import SysInfo
from .lib.output import FormattedOutput, debug, error, info, log, warn
from .lib.pacman import Pacman
from .lib.plugins import load_plugin, plugins
from .lib.translationhandler import Language, tr, translation_handler
from .tui.curses_menu import Tui


# @archinstall.plugin decorator hook to programmatically add
# plugins in runtime. Useful in profiles_bck and other things.
def plugin(f, *args, **kwargs) -> None:  # type: ignore[no-untyped-def]
	plugins[f.__name__] = f


def _log_sys_info() -> None:
	# Log various information about hardware before starting the installation. This might assist in troubleshooting
	debug(f'Hardware model detected: {SysInfo.sys_vendor()} {SysInfo.product_name()}; UEFI mode: {SysInfo.has_uefi()}')
	debug(f'Processor model detected: {SysInfo.cpu_model()}')
	debug(f'Memory statistics: {SysInfo.mem_available()} available out of {SysInfo.mem_total()} total installed')
	debug(f'Virtualization detected: {SysInfo.virtualization()}; is VM: {SysInfo.is_vm()}')
	debug(f'Graphics devices detected: {SysInfo._graphics_devices().keys()}')

	# For support reasons, we'll log the disk layout pre installation to match against post-installation layout
	debug(f'Disk states before installing:\n{disk_layouts()}')


def _fetch_openEuler_db() -> None:
	info('Fetching openEuler package metadata...')
	try:
		# 使用 dnf makecache 更新 openEuler 的元数据缓存
		import subprocess
		# subprocess.run(['dnf', 'makecache'], check=True)
	except subprocess.CalledProcessError as e:
		error('Failed to sync openEuler package metadata.--------')
		if 'could not resolve host' in str(e.stdout).lower() or 'could not resolve host' in str(e.stderr).lower():
			error('Most likely due to a missing network connection or DNS issue.')
		error('Run openEuler-install --debug and check /var/log/openEuler-install/install.log for details.')
		
		debug(f'Failed to sync openEuler package metadata: {e}')
		exit(1)
	except Exception as e:
		error('Failed to sync openEuler package metadata due to an unexpected error.')
		debug(f'Unexpected error: {e}')
		exit(1)


def _check_new_version() -> None:
	info('Checking version...')
	upgrade = None

	upgrade = check_package_upgrade('archinstall')

	if upgrade is None:
		debug('No archinstall upgrades found')
		return None

	text = tr('New version available') + f': {upgrade}'
	info(text)
	time.sleep(3)


def main() -> int:
	"""
	This can either be run as the compiled and installed application: python setup.py install
	OR straight as a module: python -m archinstall
	In any case we will be attempting to load the provided script to be run from the scripts/ folder
	"""
	if '--help' in sys.argv or '-h' in sys.argv:
		arch_config_handler.print_help()
		return 0

	if os.getuid() != 0:
		print(tr('Archinstall requires root privileges to run. See --help for more.'))
		return 1

	# 检测系统类型并记录信息
	from .lib.system_detection import SystemType
	SystemType.log_system_info()
	
	# 检查系统是否支持
	if not SystemType.is_supported():
		warn('Warning: This system type is not officially supported by archinstall. Use at your own risk.')

	_log_sys_info()

	if not arch_config_handler.args.offline:
		# 根据系统类型执行不同的同步操作
		system_type = SystemType.detect()
		if system_type == 'openEuler':
			_fetch_openEuler_db()
		elif system_type == 'arch':
			# Arch Linux 的默认行为
			pass

		if not arch_config_handler.args.skip_version_check:
			_check_new_version()

	script = arch_config_handler.get_script()

	mod_name = f'eulerinstall.scripts.{script}'
	print(mod_name)
	# by loading the module we'll automatically run the script
	importlib.import_module(mod_name)

	return 0


def run_as_a_module() -> None:
	print("==== 本地开发版本已加载 ====")  # 添加验证标记
	rc = 0
	exc = None

	try:
		rc = main()
	except Exception as e:
		exc = e
	finally:
		# restore the terminal to the original state
		Tui.shutdown()

		if exc:
			err = ''.join(traceback.format_exception(exc))
			error(err)

			text = (
				'Archinstall experienced the above error. If you think this is a bug, please report it to\n'
				'https://github.com/archlinux/archinstall and include the log file "/var/log/archinstall/install.log".\n\n'
				"Hint: To extract the log from a live ISO \ncurl -F'file=@/var/log/archinstall/install.log' https://0x0.st\n"
			)

			warn(text)
			rc = 1

		sys.exit(rc)


__all__ = [
	'FormattedOutput',
	'Language',
	'Pacman',
	'SysInfo',
	'Tui',
	'arch_config_handler',
	'debug',
	'disk_layouts',
	'error',
	'info',
	'load_plugin',
	'log',
	'plugin',
	'translation_handler',
	'warn',
]
