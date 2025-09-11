# Arch Linux install script (archinstall)
# Copyright (C) 2021-2023 Arch Linux
#
# This file is part of archinstall.
# This file is licensed under the GNU General Public License version 3.
# Refer to the `LICENSE` file for further details.

# Modified for openEuler Installation by Liu Wang in 2025

class RequirementError(Exception):
	pass


class DiskError(Exception):
	pass


class UnknownFilesystemFormat(Exception):
	pass


class SysCallError(Exception):
	def __init__(self, message: str, exit_code: int | None = None, worker_log: bytes = b'') -> None:
		super().__init__(message)
		self.message = message
		self.exit_code = exit_code
		self.worker_log = worker_log


class HardwareIncompatibilityError(Exception):
	pass


class ServiceException(Exception):
	pass


class PackageError(Exception):
	pass


class Deprecated(Exception):
	pass


class DownloadTimeout(Exception):
	"""
	Download timeout exception raised by DownloadTimer.
	"""
