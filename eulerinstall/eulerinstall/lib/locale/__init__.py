# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

from .utils import (
	list_keyboard_languages,
	list_locales,
	list_timezones,
	list_x11_keyboard_languages,
	set_kb_layout,
	verify_keyboard_layout,
	verify_x11_keyboard_layout,
)

__all__ = [
	'list_keyboard_languages',
	'list_locales',
	'list_timezones',
	'list_x11_keyboard_languages',
	'set_kb_layout',
	'verify_keyboard_layout',
	'verify_x11_keyboard_layout',
]
