# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

import os
from pathlib import Path

from eulerinstall import SysInfo
from eulerinstall.lib.applications.application_handler import application_handler
from eulerinstall.lib.args import arch_config_handler
from eulerinstall.lib.authentication.authentication_handler import auth_handler
from eulerinstall.lib.configuration import ConfigurationOutput
from eulerinstall.lib.disk.filesystem import FilesystemHandler
from eulerinstall.lib.disk.utils import disk_layouts
from eulerinstall.lib.global_menu import GlobalMenu
from eulerinstall.lib.installer import Installer, accessibility_tools_in_use, run_custom_user_commands
from eulerinstall.lib.interactions.general_conf import PostInstallationAction, ask_post_installation
from eulerinstall.lib.models import Bootloader
from eulerinstall.lib.models.device import (
	DiskLayoutType,
	EncryptionType,
)
from eulerinstall.lib.models.users import User
from eulerinstall.lib.output import debug, error, info, step_start
from eulerinstall.lib.packages.packages import check_package_upgrade
from eulerinstall.lib.profile.profiles_handler import profile_handler
from eulerinstall.lib.translationhandler import tr
from eulerinstall.tui import Tui
from eulerinstall.lib.general import SysCommand

def ask_user_questions() -> None:
	"""
	First, we'll ask the user for a bunch of user input.
	Not until we're satisfied with what we want to install
	will we continue with the actual installation steps.
	"""

	title_text = None

	# upgrade = check_package_upgrade('archinstall')
	# if upgrade:
	# 	text = tr('New version available') + f': {upgrade}'
	# 	title_text = f'  ({text})'

	with Tui():
		global_menu = GlobalMenu(arch_config_handler.config)

		if not arch_config_handler.args.advanced:
			global_menu.set_enabled('parallel_downloads', False)

		global_menu.run(additional_title=title_text)


def perform_installation(mountpoint: Path) -> None:
	"""
	Performs the installation steps on a block device.
	Only requirement is that the block devices are
	formatted and setup prior to entering this function.
	"""
	# 安装进度：初始化安装流程
	step_start('init_install')

	info('Starting installation...')

	config = arch_config_handler.config

	if not config.disk_config:
		error('No disk configuration provided')
		return

	disk_config = config.disk_config
	run_mkinitcpio = not config.uki
	locale_config = config.locale_config
	optional_repositories = config.mirror_config.optional_repositories if config.mirror_config else []
	mountpoint = disk_config.mountpoint if disk_config.mountpoint else mountpoint

	with Installer(
		mountpoint,
		disk_config,
		kernels=config.kernels,
	) as installation:
		# Mount all the drives to the desired mountpoint
		if disk_config.config_type != DiskLayoutType.Pre_mount:
			# 安装进度：挂载目标磁盘分区
			step_start('mount_partitions')

			installation.mount_ordered_layout()

		# 安装进度：校验安装环境
		step_start('check_env')

		installation.sanity_check()

		if disk_config.config_type != DiskLayoutType.Pre_mount:
			if disk_config.disk_encryption and disk_config.disk_encryption.encryption_type != EncryptionType.NoEncryption:
				# 安装进度：生成加密密钥文件
				step_start('gen_keys')

				# generate encryption key files for the mounted luks devices
				installation.generate_key_files()

		if mirror_config := config.mirror_config:
			# 安装进度：配置软件源镜像
			step_start('set_mirrors_host')

			installation.set_mirrors(mirror_config, on_target=False)

		installation.minimal_installation(
			optional_repositories=optional_repositories,
			mkinitcpio=run_mkinitcpio,
			hostname=arch_config_handler.config.hostname,
			locale_config=locale_config,
		)

		if mirror_config := config.mirror_config:
			# 安装进度：更新目标系统软件源
			step_start('set_mirrors_target')

			installation.set_mirrors(mirror_config, on_target=True)

		if config.bootloader and config.bootloader != Bootloader.NO_BOOTLOADER:
			# 安装进度：安装引导程序
			step_start('install_bootloader')

			installation.add_bootloader(config.bootloader, config.uki)

		# If user selected to copy the current ISO network configuration
		# Perform a copy of the config
		network_config = config.network_config

		if network_config:
			# 安装进度：配置目标系统网络
			step_start('config_network')

			network_config.install_network_config(
				installation,
				config.profile_config,
			)

		if config.auth_config:
			if config.auth_config.users:
				# 安装进度：创建用户账号
				step_start('create_users')

				installation.create_users(config.auth_config.users)

			# 安装进度：配置用户认证
			step_start('auth_setup')

			auth_handler.setup_auth(installation, config.auth_config, config.hostname)

		if config.packages and config.packages[0] != '':
			# 安装进度：安装额外软件包
			step_start('install_packages')

			installation.add_additional_packages(config.packages)

		if app_config := config.app_config:
			# 安装进度：安装应用程序
			step_start('install_apps')

			application_handler.install_applications(installation, app_config)

		if profile_config := config.profile_config:
			# 安装进度：安装桌面环境
			step_start('install_profile')

			profile_handler.install_profile_config(installation, profile_config)

		if timezone := config.timezone:
			# 安装进度：设置系统时区
			step_start('set_timezone')

			installation.set_timezone(timezone)

		if config.ntp:
			# 安装进度：启用时间同步
			step_start('enable_ntp')

			installation.activate_time_synchronization()

		if accessibility_tools_in_use():
			installation.enable_espeakup()

		if config.auth_config and config.auth_config.root_enc_password:
			root_user = User('root', config.auth_config.root_enc_password, False)
			installation.set_user_password(root_user)

		if (profile_config := config.profile_config) and profile_config.profile:
			profile_config.profile.post_install(installation)

		# If the user provided a list of services to be enabled, pass the list to the enable_service function.
		# Note that while it's called enable_service, it can actually take a list of services and iterate it.
		if servies := config.services:
			# 安装进度：启用系统服务
			step_start('enable_services')

			installation.enable_service(servies)

		if disk_config.is_default_btrfs():
			btrfs_options = disk_config.btrfs_options
			snapshot_config = btrfs_options.snapshot_config if btrfs_options else None
			snapshot_type = snapshot_config.snapshot_type if snapshot_config else None
			if snapshot_type:
				installation.setup_btrfs_snapshot(snapshot_type, config.bootloader)

		# If the user provided custom commands to be run post-installation, execute them now.
		if cc := config.custom_commands:
			run_custom_user_commands(cc, installation)

		# 安装进度：生成文件系统挂载表（fstab）
		step_start('gen_fstab')

		installation.genfstab()

		# 安装进度：重建initramfs
		step_start('rebuild_initramfs')

		info(f'generate regenerate_initramfs')
		installation.regenerate_initramfs()

		# 安装进度：更新引导配置（grub）
		step_start('update_grub')

		installation.updategrub()

		# 安装进度：清理安装环境
		step_start('cleanup')

		info(f'post deal for devstation')
		installation.post_deal_devstation()

		debug(f'Disk states after installing:\n{disk_layouts()}')

		if not arch_config_handler.args.silent:
			with Tui():
				action = ask_post_installation()

			match action:
				case PostInstallationAction.EXIT:
					pass
				case PostInstallationAction.REBOOT:
					os.system('reboot')
				case PostInstallationAction.CHROOT:
					try:
						installation.drop_to_shell()
					except Exception:
						pass

def guided() -> None:
	if not arch_config_handler.args.silent:
		ask_user_questions()

	config = ConfigurationOutput(arch_config_handler.config)
	config.write_debug()
	config.save()

	if arch_config_handler.args.dry_run:
		exit(0)

	if not arch_config_handler.args.silent:
		aborted = False
		with Tui():
			if not config.confirm_config():
				debug('Installation aborted')
				aborted = True

		if aborted:
			return guided()

	if arch_config_handler.config.disk_config:
		fs_handler = FilesystemHandler(arch_config_handler.config.disk_config)
		fs_handler.perform_filesystem_operations()

	perform_installation(arch_config_handler.args.mountpoint)


guided()
