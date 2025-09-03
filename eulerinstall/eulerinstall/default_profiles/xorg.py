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

from eulerinstall.default_profiles.profile import Profile, ProfileType
from eulerinstall.lib.translationhandler import tr


class XorgProfile(Profile):
	def __init__(
		self,
		name: str = 'Xorg',
		profile_type: ProfileType = ProfileType.Xorg,
		advanced: bool = False,
	):
		super().__init__(
			name,
			profile_type,
			support_gfx_driver=True,
			advanced=advanced,
		)

	@override
	def preview_text(self) -> str:
		text = tr('Environment type: {}').format(self.profile_type.value)
		if packages := self.packages_text():
			text += f'\n{packages}'

		return text

	@property
	@override
	def packages(self) -> list[str]:
		return [
			'xorg-server',
		]
