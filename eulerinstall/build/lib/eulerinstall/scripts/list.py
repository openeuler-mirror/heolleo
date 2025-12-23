# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

import glob
from pathlib import Path

print('The following are viable --script options:')

for script in [Path(x) for x in glob.glob(f'{Path(__file__).parent}/*.py')]:
	if script.stem in ['__init__', 'list']:
		continue

	print(f'    {script.stem}')
