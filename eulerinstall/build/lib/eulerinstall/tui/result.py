# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

from dataclasses import dataclass
from enum import Enum, auto
from typing import TypeVar, Generic

from .menu_item import MenuItem

ValueT = TypeVar('ValueT')


class ResultType(Enum):
	Selection = auto()
	Skip = auto()
	Reset = auto()


@dataclass
class Result(Generic[ValueT]):
	type_: ResultType
	_item: MenuItem | list[MenuItem] | str | None

	def has_item(self) -> bool:
		return self._item is not None

	def get_value(self) -> ValueT:
		return self.item().get_value()  # type: ignore[no-any-return]

	def get_values(self) -> list[ValueT]:
		return [i.get_value() for i in self.items()]

	def item(self) -> MenuItem:
		assert self._item is not None and isinstance(self._item, MenuItem)
		return self._item

	def items(self) -> list[MenuItem]:
		assert self._item is not None and isinstance(self._item, list)
		return self._item

	def text(self) -> str:
		assert self._item is not None and isinstance(self._item, str)
		return self._item
