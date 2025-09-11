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
from eulerinstall.lib.output import debug, error, info
from eulerinstall.lib.packages.packages import check_package_upgrade
from eulerinstall.lib.profile.profiles_handler import profile_handler
from eulerinstall.lib.translationhandler import tr
from eulerinstall.tui import Tui
from eulerinstall.lib.general import SysCommand

__packages__ = ["checkpolicy", "dejavu-fonts", "liberation-fonts", "gnome-shell", "gnome-session", 
            "gnome-terminal", "gnome-software", "gnome-menus", "nautilus", "xdg-utils", "google-droid-sans-fonts", 
            "google-noto-fonts-common", "google-noto-sans-arabic-vf-fonts", "google-noto-sans-armenian-vf-fonts", 
            "google-noto-sans-bengali-vf-fonts", "google-noto-sans-canadian-aboriginal-vf-fonts", "google-noto-sans-cherokee-vf-fonts", 
            "google-noto-sans-devanagari-vf-fonts", "google-noto-sans-ethiopic-vf-fonts", "google-noto-sans-georgian-vf-fonts", 
            "google-noto-sans-hebrew-vf-fonts", "google-noto-sans-kannada-vf-fonts", "google-noto-sans-khmer-vf-fonts", 
            "google-noto-sans-lao-vf-fonts", "google-noto-sans-math-fonts", "google-noto-sans-mono-vf-fonts", 
            "google-noto-sans-sinhala-vf-fonts", "google-noto-sans-symbols2-fonts", "google-noto-sans-symbols-vf-fonts", 
            "google-noto-sans-tamil-vf-fonts", "google-noto-sans-thaana-vf-fonts", "google-noto-sans-thai-vf-fonts", 
            "google-noto-sans-vf-fonts", "google-noto-serif-armenian-vf-fonts", "google-noto-serif-ethiopic-vf-fonts", 
            "google-noto-serif-georgian-vf-fonts", "google-noto-serif-gujarati-vf-fonts", "google-noto-serif-gurmukhi-vf-fonts",
            "google-noto-serif-hebrew-vf-fonts", "google-noto-serif-kannada-vf-fonts", "google-noto-serif-khmer-vf-fonts", 
            "google-noto-serif-lao-vf-fonts", "google-noto-serif-sinhala-vf-fonts", "google-noto-serif-tamil-vf-fonts", 
            "google-noto-serif-thai-vf-fonts", "google-noto-serif-vf-fonts", "gdm", "ibus-libpinyin",
            "firefox", "wqy-zenhei-fonts", "oeDevPlugin", "rust-cbindgen", "polkit-qt5-1", "polkit-qt5-1-devel", 
            "oedp", "kernel-extra-modules", "epkg", "euler-copilot-shell", "vscodium", "oegitext", "kf5-kcalendarcore-devel",
            "kf5-kcalendarcore", "rust-ripgrep", "xorg-x11-drv-*", "linux-firmware-iwlwifi", "linux-firmware-mediatek", 
            "gnome-keyring", "gnome-keyring-pam", "linux-firmware-ath", "linux-firmware-cypress", "linux-firmware-libertas", 
            "linux-firmware-mrvl", "linux-firmware-netronome", "gnome-shell-extension-dash-to-dock", "CUnit", "CUnit-devel", 
			"autogen", "chrony", "copy-jdk-configs", "dhcp", "dnf-plugins-core", "docbook-dtds", "euler-copilot-desktop", 
			"binutils", "cpp",  "curl", 
			"e2fsprogs",  "e2fsprogs-help", "firefox", "gcc", 
			"gcc-c++",  "gcc-gdb-plugin", "gdb",  "gdb-headless", 
			"gdk-pixbuf2",  "gdk-pixbuf2-devel", 
			"gdk-pixbuf2-modules", "gjs", "glibc", "glibc-common", 
			"glibc-devel", "kernel-extra-modules", "roo-code", "thunderbird","kernel-headers", "kernel-tools","python3-mcp"
			# "gnome-calendar", "gnome-clocks", "gnome-connections", "gnome-console", "gnome-contacts", 
			# "gnome-doc-utils", "gnome-doc-utils-stylesheets", "gnome-maps", "gnome-user-docs", "gnome-weather", "grep", 
			# "grep", "grub2-efi-x64-modules", "gtest-devel", "gtk-vnc2", "gvnc", "gvncpulse", "info", 
			# "iputils", "itstool", "java-21-openjdk", "java-21-openjdk-devel", "java-21-openjdk-headless", "javapackages-filesystem", 
			# "kernel-extra-modules", "kernel-headers", "kernel-tools", "kpartx", 
			# "libatomic", "libcurl", "libevent", "libffi", 
			# "libffi-devel", "libgcc", "libgomp", "libicu",  "libicu-devel", 
			# "libpcap",  "libpfm", "libshumate", "libstdc++","libstdc++-devel", 
			# "libtraceevent", "libxslt", "mallard-rng", "man-pages", "mesa-dri-drivers", 
			# "mesa-filesystem", "mesa-libEGL", "mesa-libEGL-devel", 
			# "mesa-libGL", "mesa-libGL-devel", "mesa-libgbm",
			# "mesa-libglapi", "mesa-libxatracker","mesa-vulkan-drivers", 
			# "microcode_ctl", "mozjs102","multipath-tools", "nodejs", 
			# "nodejs-docs", "nodejs-full-i18n", "nodejs-libs", "npm", "ntp", "ntpstat", 
			# "osinfo-db",  "perf", "plymouth", "polkit", "polkit-devel",
			# "polkit-help", "polkit-libs", "poppler", "poppler-cpp", 
			# "poppler-glib", "python3-annotated-types", "python3-anyio", "python3-certifi", "python3-click", "python3-colorama", 
			# "python3-dns", "python3-dotenv", "python3-email-validator", "python3-h11", "python3-httpcore", "python3-httpx", 
			# "python3-httpx-sse", "python3-idna", "python3-iniconfig", "python3-libxml2", "python3-lxml", "python3-markdown-it-py", 
			# "python3-mcp", "python3-mdurl", "python3-packaging", "python3-pluggy", "python3-pydantic", "python3-pydantic-core", 
			# "python3-pydantic-settings", "python3-pygments", "python3-pytest", "python3-rich", "python3-shellingham", 
			# "python3-sniffio", "python3-sse-starlette", "python3-starlette", "python3-typer", "python3-typer-cli", 
			# "python3-typer-slim", "python3-typing-extensions", "python3-ujson", "python3-uvicorn", "qrencode", "roo-code", 
			# "thunderbird", "thunderbird-librnp-rnp", "tzdata-java", "unzip", "uv", "vim-common", "vim-common", "vim-enhanced",
			# "vim-enhanced", "vim-filesystem", "vim-filesystem", "vim-minimal", "xorg-x11-fonts-others", 
			# "yelp-tools", "yelp-xsl"		
]


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
			installation.mount_ordered_layout()

		installation.sanity_check()

		if disk_config.config_type != DiskLayoutType.Pre_mount:
			if disk_config.disk_encryption and disk_config.disk_encryption.encryption_type != EncryptionType.NoEncryption:
				# generate encryption key files for the mounted luks devices
				installation.generate_key_files()

		if mirror_config := config.mirror_config:
			installation.set_mirrors(mirror_config, on_target=False)

		installation.minimal_installation(
			optional_repositories=optional_repositories,
			mkinitcpio=run_mkinitcpio,
			hostname=arch_config_handler.config.hostname,
			locale_config=locale_config,
		)

		if mirror_config := config.mirror_config:
			installation.set_mirrors(mirror_config, on_target=True)

		# if config.swap:
		# 	installation.setup_swap('zram')

		if config.bootloader and config.bootloader != Bootloader.NO_BOOTLOADER:
			if config.bootloader == Bootloader.Grub and SysInfo.has_uefi():
				installation.add_additional_packages('grub2')

			installation.add_bootloader(config.bootloader, config.uki)

		# If user selected to copy the current ISO network configuration
		# Perform a copy of the config
		network_config = config.network_config

		if network_config:
			network_config.install_network_config(
				installation,
				config.profile_config,
			)

		if config.auth_config:
			if config.auth_config.users:
				installation.create_users(config.auth_config.users)
				auth_handler.setup_auth(installation, config.auth_config, config.hostname)

		if config.packages and config.packages[0] != '':
			installation.add_additional_packages(config.packages)

		if app_config := config.app_config:
			application_handler.install_applications(installation, app_config)

		if profile_config := config.profile_config:
			profile_handler.install_profile_config(installation, profile_config)

		if timezone := config.timezone:
			installation.set_timezone(timezone)

		if config.ntp:
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

		installation.genfstab()

		# install graphical packages
		info(f'start install graphical packages')
		repo_source = Path("/etc/yum.repos.d/local.repo")
		import platform
		machine = platform.machine()
		if machine == 'x86_64':
			config_name='devstation-config-2-5.oe2509.x86_64.rpm'
			dev_config='/run/initramfs/live/Packages/devstation-config-2-5.oe2509.x86_64.rpm'
		elif machine == 'aarch64':
			config_name='devstation-config-2-5.oe2509.aarch64.rpm'
			dev_config='/run/initramfs/live/Packages/devstation-config-2-5.oe2509.aarch64.rpm'
		else:
			raise ValueError(f'Unsupported architecture: {machine}')
		if repo_source.exists():
			local_repo='local-repo'
		else:
			local_repo='openEuler'

		for package in __packages__:
			SysCommand(f'dnf --installroot=/mnt install --assumeyes  --disablerepo=* --enablerepo={local_repo} --nogpgcheck --setopt=sslverify=0 --releasever=/ {package}',
					peek_output=True)

		SysCommand(f'cp {dev_config} /mnt')
		info(f'start install config: {config_name}')
		SysCommand(f'chroot /mnt rpm -ivh {config_name} --nodeps')


		info('start enable service!!!!!!!!')
		# 启用服务
		services = [
			"gdm",
			"NetworkManager"
		]

		try:
			for service in services:
				SysCommand(f"chroot /mnt systemctl enable {service}")
			
			SysCommand("chroot /mnt systemctl set-default graphical.target")
		except Exception as es:
			warn(f'enable {service} failed')

		# #set .bashrc
		# info('set .bashrc...........')
		# SysCommand('cp /root/.bashrc /mnt')
		# SysCommand('chroot /mnt source .bashrc')


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
