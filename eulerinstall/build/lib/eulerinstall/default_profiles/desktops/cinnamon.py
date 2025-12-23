# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

import sys

if sys.version_info >= (3, 12):
    from typing import override
else:
    from typing_extensions import override

from eulerinstall.default_profiles.profile import GreeterType, ProfileType
from eulerinstall.default_profiles.xorg import XorgProfile


class CinnamonProfile(XorgProfile):
	def __init__(self) -> None:
		super().__init__('Cinnamon', ProfileType.DesktopEnv)

	@property
	@override
	def packages(self) -> list[str]:
		return [
			'cinnamon',
			'system-config-printer',
			'gnome-keyring',
			'gnome-terminal',
			'engrampa',
			'gnome-screenshot',
			'gvfs-smb',
			'xed',
			'xdg-user-dirs-gtk',
		]

	@property
	@override
	def default_greeter_type(self) -> GreeterType:
		return GreeterType.Lightdm
