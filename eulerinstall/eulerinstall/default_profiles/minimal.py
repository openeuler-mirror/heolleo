# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

from eulerinstall.default_profiles.profile import Profile, ProfileType


class MinimalProfile(Profile):
	def __init__(self) -> None:
		super().__init__(
			'Minimal',
			ProfileType.Minimal,
		)
