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

from eulerinstall.lib.menu.abstract_menu import AbstractSubMenu
from eulerinstall.lib.models.application import ApplicationConfiguration, Audio, AudioConfiguration, BluetoothConfiguration
from eulerinstall.lib.translationhandler import tr
from eulerinstall.tui.curses_menu import SelectMenu
from eulerinstall.tui.menu_item import MenuItem, MenuItemGroup
from eulerinstall.tui.result import ResultType
from eulerinstall.tui.types import Alignment, FrameProperties, Orientation


class ApplicationMenu(AbstractSubMenu[ApplicationConfiguration]):
	def __init__(
		self,
		preset: ApplicationConfiguration | None = None,
	):
		if preset:
			self._app_config = preset
		else:
			self._app_config = ApplicationConfiguration()

		menu_optioons = self._define_menu_options()
		self._item_group = MenuItemGroup(menu_optioons, checkmarks=True)

		super().__init__(
			self._item_group,
			config=self._app_config,
			allow_reset=True,
		)

	@override
	def run(self, additional_title: str | None = None) -> ApplicationConfiguration:
		super().run(additional_title=additional_title)
		return self._app_config

	def _define_menu_options(self) -> list[MenuItem]:
		return [
			MenuItem(
				text=tr('Bluetooth'),
				action=select_bluetooth,
				value=self._app_config.bluetooth_config,
				preview_action=self._prev_bluetooth,
				key='bluetooth_config',
			),
			MenuItem(
				text=tr('Audio'),
				action=select_audio,
				preview_action=self._prev_audio,
				key='audio_config',
			),
		]

	def _prev_bluetooth(self, item: MenuItem) -> str | None:
		if item.value is not None:
			bluetooth_config: BluetoothConfiguration = item.value

			output = 'Bluetooth: '
			output += tr('Enabled') if bluetooth_config.enabled else tr('Disabled')
			return output
		return None

	def _prev_audio(self, item: MenuItem) -> str | None:
		if item.value is not None:
			config: AudioConfiguration = item.value
			return f'{tr("Audio")}: {config.audio.value}'
		return None


def select_bluetooth(preset: BluetoothConfiguration | None) -> BluetoothConfiguration | None:
	group = MenuItemGroup.yes_no()
	group.focus_item = MenuItem.no()

	if preset is not None:
		group.set_selected_by_value(preset.enabled)

	header = tr('Would you like to configure Bluetooth?') + '\n'

	result = SelectMenu[bool](
		group,
		header=header,
		alignment=Alignment.CENTER,
		columns=2,
		orientation=Orientation.HORIZONTAL,
		allow_skip=True,
	).run()

	match result.type_:
		case ResultType.Selection:
			enabled = result.item() == MenuItem.yes()
			return BluetoothConfiguration(enabled)
		case ResultType.Skip:
			return preset
		case _:
			raise ValueError('Unhandled result type')


def select_audio(preset: AudioConfiguration | None = None) -> AudioConfiguration | None:
	items = [MenuItem(a.value, value=a) for a in Audio]
	group = MenuItemGroup(items)

	if preset:
		group.set_focus_by_value(preset.audio)

	result = SelectMenu[Audio](
		group,
		allow_skip=True,
		alignment=Alignment.CENTER,
		frame=FrameProperties.min(tr('Audio')),
	).run()

	match result.type_:
		case ResultType.Skip:
			return preset
		case ResultType.Selection:
			return AudioConfiguration(audio=result.get_value())
		case ResultType.Reset:
			raise ValueError('Unhandled result type')
