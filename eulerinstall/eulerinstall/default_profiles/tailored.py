# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

import sys
from typing import TYPE_CHECKING

if sys.version_info >= (3, 12):
    from typing import override
else:
    from typing_extensions import override

from eulerinstall.default_profiles.profile import ProfileType
from eulerinstall.default_profiles.xorg import XorgProfile

if TYPE_CHECKING:
	from eulerinstall.lib.installer import Installer


class TailoredProfile(XorgProfile):
	def __init__(self) -> None:
		super().__init__('52-54-00-12-34-56', ProfileType.Tailored)

	@property
	@override
	def packages(self) -> list[str]:
		return ['nano', 'wget', 'git']

	@override
	def install(self, install_session: 'Installer') -> None:
		super().install(install_session)
		# do whatever you like here :)
