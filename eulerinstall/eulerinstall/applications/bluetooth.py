# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

from typing import TYPE_CHECKING

from eulerinstall.lib.output import debug

if TYPE_CHECKING:
	from eulerinstall.lib.installer import Installer


class BluetoothApp:
	@property
	def packages(self) -> list[str]:
		return [
			'bluez',
			'bluez-utils',
		]

	@property
	def services(self) -> list[str]:
		return [
			'bluetooth.service',
		]

	def install(self, install_session: 'Installer') -> None:
		debug('Installing Bluetooth')
		install_session.add_additional_packages(self.packages)
		install_session.enable_service(self.services)
