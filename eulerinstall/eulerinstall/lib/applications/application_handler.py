# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

from typing import TYPE_CHECKING

from eulerinstall.applications.audio import AudioApp
from eulerinstall.applications.bluetooth import BluetoothApp
from eulerinstall.lib.models.application import ApplicationConfiguration
from eulerinstall.lib.models.users import User

if TYPE_CHECKING:
	from eulerinstall.lib.installer import Installer


class ApplicationHandler:
	def __init__(self) -> None:
		pass

	def install_applications(self, install_session: 'Installer', app_config: ApplicationConfiguration, users: list['User'] | None = None) -> None:
		if app_config.bluetooth_config:
			BluetoothApp().install(install_session)

		if app_config.audio_config:
			AudioApp().install(
				install_session,
				app_config.audio_config,
				users,
			)


application_handler = ApplicationHandler()
