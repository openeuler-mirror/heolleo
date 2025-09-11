# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

import time
from collections.abc import Callable
from pathlib import Path

from ..translationhandler import tr
from ..system_detection import SystemType

from ..exceptions import RequirementError
from ..general import SysCommand
from ..output import error, info, warn
from ..plugins import plugins
from .config import PacmanConfig


class Pacman:
	def __init__(self, target: Path, silent: bool = False):
		self.synced = False
		self.silent = silent
		self.target = target
		self.system_type = SystemType.detect()
		self.package_manager = SystemType.get_package_manager()

	@staticmethod
	def run(args: str, default_cmd: str = None) -> SysCommand:
		"""
		A centralized function to call package manager from.
		It also protects us from colliding with other running package manager sessions (if used locally).
		The grace period is set to 10 minutes before exiting hard if another instance is running.
		"""
		system_type = SystemType.detect()
		
		if default_cmd is None:
			default_cmd = SystemType.get_package_manager()
		
		# 根据系统类型设置锁文件路径
		match system_type:
			case 'arch':
				lock_file = Path('/var/lib/pacman/db.lck')
			case 'openEuler':
				lock_file = Path('/var/lib/dnf/dnf.lock')
			case _:
				lock_file = Path('/var/lib/pacman/db.lck')  # 默认使用pacman路径
		
		if lock_file.exists():
			warn(tr(f'{default_cmd.capitalize()} is already running, waiting maximum 10 minutes for it to terminate.'))

		started = time.time()
		while lock_file.exists():
			time.sleep(0.25)

			if time.time() - started > (60 * 10):
				error(tr(f'Pre-existing {default_cmd} lock never exited. Please clean up any existing {default_cmd} sessions before using archinstall.'))
				exit(1)

		return SysCommand(f'{default_cmd} {args}')

	def ask(self, error_message: str, bail_message: str, func: Callable, *args, **kwargs) -> None:  # type: ignore[no-untyped-def, type-arg]
		while True:
			try:
				func(*args, **kwargs)
				break
			except Exception as err:
				error(f'{error_message}: {err}')
				if not self.silent and input('Would you like to re-try this download? (Y/n): ').lower().strip() in 'y':
					continue
				raise RequirementError(f'{bail_message}: {err}')

	def sync(self) -> None:
		if self.synced:
			return
		
		match self.system_type:
			case 'arch':
				self.ask(
					'Could not sync a new package database',
					'Could not sync mirrors',
					self.run,
					'-Syy',
					default_cmd='pacman',
				)
			case 'openEuler':
				self.ask(
					'Could not sync openEuler package metadata',
					'Could not sync openEuler mirrors',
					self.run,
					'makecache',
					default_cmd='dnf',
				)
			case _:
				# 默认使用pacman
				self.ask(
					'Could not sync a new package database',
					'Could not sync mirrors',
					self.run,
					'-Syy',
					default_cmd='pacman',
				)
		
		self.synced = True

	def strap(self, packages: str | list[str]) -> None:
		self.sync()
		if isinstance(packages, str):
			packages = [packages]

		for plugin in plugins.values():
			if hasattr(plugin, 'on_pacstrap'):
				if result := plugin.on_pacstrap(packages):
					packages = result

		# 根据系统类型映射包名
		from ..package_mapping import PackageMapping
		mapped_packages = PackageMapping.map_packages(packages, self.system_type)
		
		info(f'Installing packages: {mapped_packages}')

		match self.system_type:
			case 'arch':
				self.ask(
					'Could not strap in packages',
					'Pacstrap failed. See /var/log/archinstall/install.log or above message for error details',
					SysCommand,
					f'pacstrap -C /etc/pacman.conf -K {self.target} {" ".join(mapped_packages)} --noconfirm',
					peek_output=True,
				)
			case 'openEuler':
				# 对于openEuler，我们需要先创建基本的系统结构
				self._setup_openEuler_base()
				# 自动检测主机openEuler版本
				def get_openEuler_releasever():
					import re
					version_id = None
					try:
						with open('/etc/os-release') as f:
							for line in f:
								m = re.match(r'VERSION_ID="?([0-9]+)"?', line)
								if m:
									version_id = m.group(1)
									break
					except Exception:
						pass
					return version_id or '40'  # 默认40，可根据需要调整
				releasever = get_openEuler_releasever()
				self.ask(
					'Could not install packages',
					'DNF installation failed. See /var/log/archinstall/install.log or above message for error details',
					SysCommand,
					f'dnf --installroot={self.target} install --assumeyes --disablerepo=* --enablerepo=local-repo --nogpgcheck --setopt=sslverify=0 --releasever={releasever} {" ".join(mapped_packages)}',
					peek_output=True,
				)
			case _:
				# 默认使用pacstrap
				self.ask(
					'Could not strap in packages',
					'Pacstrap failed. See /var/log/archinstall/install.log or above message for error details',
					SysCommand,
					f'pacstrap -C /etc/pacman.conf -K {self.target} {" ".join(mapped_packages)} --noconfirm',
					peek_output=True,
				)
	
	def _setup_openEuler_base(self) -> None:
		"""为openEuler设置基本系统结构"""
		# 创建必要的目录
		import os
		os.makedirs(f'{self.target}/etc', exist_ok=True)
		os.makedirs(f'{self.target}/var/lib/dnf', exist_ok=True)
		os.makedirs(f'{self.target}/var/cache/dnf', exist_ok=True)
		
		# 复制主机的dnf配置
		dnf_conf_src = '/etc/dnf/dnf.conf'
		dnf_conf_dst_dir = f'{self.target}/etc/dnf'
		dnf_conf_dst = f'{dnf_conf_dst_dir}/dnf.conf'
		if Path(dnf_conf_src).exists():
			import shutil
			os.makedirs(dnf_conf_dst_dir, exist_ok=True)  # 确保目标目录存在
			shutil.copy2(dnf_conf_src, dnf_conf_dst)


__all__ = [
	'Pacman',
	'PacmanConfig',
]
