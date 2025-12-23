# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

import time

from eulerinstall.lib.output import info
from eulerinstall.lib.profile.profiles_handler import profile_handler
from eulerinstall.lib.storage import storage
from eulerinstall.tui import Tui

for p in profile_handler.get_mac_addr_profiles():
	# Tailored means it's a match for this machine
	# based on it's MAC address (or some other criteria
	# that fits the requirements for this machine specifically).
	info(f'Found a tailored profile for this machine called: "{p.name}"')

	print('Starting install in:')
	for i in range(10, 0, -1):
		Tui.print(f'{i}...')
		time.sleep(1)

	install_session = storage['installation_session']
	p.install(install_session)
