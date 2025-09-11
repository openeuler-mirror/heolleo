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

from eulerinstall.default_profiles.profile import Profile, ProfileType

if TYPE_CHECKING:
	from eulerinstall.lib.installer import Installer


class DockerProfile(Profile):
	def __init__(self) -> None:
		super().__init__(
			'Docker',
			ProfileType.ServerType,
		)

	@property
	@override
	def packages(self) -> list[str]:
		return ['docker']

	@property
	@override
	def services(self) -> list[str]:
		return ['docker']

	@override
	def post_install(self, install_session: 'Installer') -> None:
		from eulerinstall.lib.args import arch_config_handler

		if auth_config := arch_config_handler.config.auth_config:
			for user in auth_config.users:
				install_session.arch_chroot(f'usermod -a -G docker {user.username}')
