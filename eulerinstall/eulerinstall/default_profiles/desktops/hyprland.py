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

from eulerinstall.default_profiles.desktops import SeatAccess
from eulerinstall.default_profiles.profile import GreeterType, ProfileType
from eulerinstall.default_profiles.xorg import XorgProfile
from eulerinstall.lib.translationhandler import tr
from eulerinstall.tui.curses_menu import SelectMenu
from eulerinstall.tui.menu_item import MenuItem, MenuItemGroup
from eulerinstall.tui.result import ResultType
from eulerinstall.tui.types import Alignment, FrameProperties


class HyprlandProfile(XorgProfile):
	def __init__(self) -> None:
		super().__init__('Hyprland', ProfileType.DesktopEnv)

		self.custom_settings = {'seat_access': None}

	@property
	@override
	def packages(self) -> list[str]:
		return [
			'hyprland',
			'dunst',
			'kitty',
			'uwsm',
			'dolphin',
			'wofi',
			'xdg-desktop-portal-hyprland',
			'qt5-wayland',
			'qt6-wayland',
			'polkit-kde-agent',
			'grim',
			'slurp',
		]

	@property
	@override
	def default_greeter_type(self) -> GreeterType:
		return GreeterType.Sddm

	@property
	@override
	def services(self) -> list[str]:
		if pref := self.custom_settings.get('seat_access', None):
			return [pref]
		return []

	def _ask_seat_access(self) -> None:
		# need to activate seat service and add to seat group
		header = tr('Hyprland needs access to your seat (collection of hardware devices i.e. keyboard, mouse, etc)')
		header += '\n' + tr('Choose an option to give Hyprland access to your hardware') + '\n'

		items = [MenuItem(s.value, value=s) for s in SeatAccess]
		group = MenuItemGroup(items, sort_items=True)

		default = self.custom_settings.get('seat_access', None)
		group.set_default_by_value(default)

		result = SelectMenu[SeatAccess](
			group,
			header=header,
			allow_skip=False,
			frame=FrameProperties.min(tr('Seat access')),
			alignment=Alignment.CENTER,
		).run()

		if result.type_ == ResultType.Selection:
			self.custom_settings['seat_access'] = result.get_value().value

	@override
	def do_on_select(self) -> None:
		self._ask_seat_access()
		return None
