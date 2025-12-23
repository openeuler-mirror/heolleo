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


class LxqtProfile(XorgProfile):
	def __init__(self) -> None:
		super().__init__('Lxqt', ProfileType.DesktopEnv)

	# NOTE: SDDM is the only officially supported greeter for LXQt, so unlike other DEs, lightdm is not used here.
	# LXQt works with lightdm, but since this is not supported, we will not default to this.
	# https://github.com/lxqt/lxqt/issues/795
	@property
	@override
	def packages(self) -> list[str]:
		return [
			'lxqt',
			'breeze-icons',
			'oxygen-icons',
			'xdg-utils',
			'ttf-freefont',
			'leafpad',
			'slock',
		]

	@property
	@override
	def default_greeter_type(self) -> GreeterType:
		return GreeterType.Sddm
