# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

from __future__ import annotations

import re
import sys

if sys.version_info >= (3, 12):
    from typing import override
else:
    from typing_extensions import override

from eulerinstall.lib.translationhandler import tr
from eulerinstall.tui.curses_menu import EditMenu, SelectMenu
from eulerinstall.tui.menu_item import MenuItem, MenuItemGroup
from eulerinstall.tui.result import ResultType
from eulerinstall.tui.types import Alignment, Orientation

from ..menu.list_manager import ListManager
from ..models.users import User
from ..utils.util import get_password


class UserList(ListManager[User]):
	def __init__(self, prompt: str, lusers: list[User]):
		self._actions = [
			tr('Add a user'),
			tr('Change password'),
			tr('Promote/Demote user'),
			tr('Delete User'),
		]

		super().__init__(
			lusers,
			[self._actions[0]],
			self._actions[1:],
			prompt,
		)

	@override
	def selected_action_display(self, selection: User) -> str:
		return selection.username

	@override
	def handle_action(self, action: str, entry: User | None, data: list[User]) -> list[User]:
		if action == self._actions[0]:  # add
			new_user = self._add_user()
			if new_user is not None:
				# in case a user with the same username as an existing user
				# was created we'll replace the existing one
				data = [d for d in data if d.username != new_user.username]
				data += [new_user]
		elif action == self._actions[1] and entry:  # change password
			header = f'{tr("User")}: {entry.username}\n'
			new_password = get_password(tr('Password'), header=header)

			if new_password:
				user = next(filter(lambda x: x == entry, data))
				user.password = new_password
		elif action == self._actions[2] and entry:  # promote/demote
			user = next(filter(lambda x: x == entry, data))
			user.sudo = False if user.sudo else True
		elif action == self._actions[3] and entry:  # delete
			data = [d for d in data if d != entry]

		return data

	def _check_for_correct_username(self, username: str | None) -> str | None:
		if username is not None:
			if re.match(r'^[a-z_][a-z0-9_-]*\$?$', username) and len(username) <= 32:
				return None
		return tr('The username you entered is invalid')

	def _add_user(self) -> User | None:
		editResult = EditMenu(
			tr('Username'),
			allow_skip=True,
			validator=self._check_for_correct_username,
		).input()

		match editResult.type_:
			case ResultType.Skip:
				return None
			case ResultType.Selection:
				username = editResult.text()
			case _:
				raise ValueError('Unhandled result type')

		if not username:
			return None

		header = f'{tr("Username")}: {username}\n'

		password = get_password(tr('Password'), header=header, allow_skip=True)

		if not password:
			return None

		header += f'{tr("Password")}: {password.hidden()}\n\n'
		header += str(tr('Should "{}" be a superuser (sudo)?\n')).format(username)

		group = MenuItemGroup.yes_no()
		group.focus_item = MenuItem.yes()

		result = SelectMenu[bool](
			group,
			header=header,
			alignment=Alignment.CENTER,
			columns=2,
			orientation=Orientation.HORIZONTAL,
			search_enabled=False,
			allow_skip=False,
		).run()

		match result.type_:
			case ResultType.Selection:
				sudo = result.item() == MenuItem.yes()
			case _:
				raise ValueError('Unhandled result type')

		return User(username, password, sudo)


def ask_for_additional_users(prompt: str = '', defined_users: list[User] = []) -> list[User]:
	users = UserList(prompt, defined_users).run()
	return users
