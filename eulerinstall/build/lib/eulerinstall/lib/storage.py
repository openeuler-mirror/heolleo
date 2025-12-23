# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

# There's a few scenarios of execution:
#   1. In the git repository, where ./profiles_bck/ exist
#   2. When executing from a remote directory, but targeted a script that starts from the git repository
#   3. When executing as a python -m archinstall module where profiles_bck exist one step back for library reasons.
#   (4. Added the ~/.config directory as an additional option for future reasons)
#
# And Keeping this in dict ensures that variables are shared across imports.
from typing import TYPE_CHECKING, NotRequired, TypedDict

if TYPE_CHECKING:
	from eulerinstall.lib.boot import Boot
	from eulerinstall.lib.installer import Installer


class _StorageDict(TypedDict):
	active_boot: NotRequired['Boot | None']
	installation_session: NotRequired['Installer']


storage: _StorageDict = {}
