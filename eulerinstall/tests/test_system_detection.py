"""
Test cases for system_detection.py
"""
import subprocess
from unittest.mock import patch, mock_open, MagicMock
import pytest

from eulerinstall.lib.system_detection import SystemType


class TestSystemType:
    """Test SystemType class"""

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_arch_via_os_release(self, mock_run, mock_path):
        """Test detection via /etc/os-release containing 'arch'"""
        # Mock Path('/etc/os-release').exists() to return True
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = True
        mock_path.return_value = mock_path_instance

        # Mock open to return content with 'arch'
        with patch('builtins.open', mock_open(read_data='ID=arch')) as mock_file:
            result = SystemType.detect()
            assert result == 'arch'
            mock_file.assert_called_once_with('/etc/os-release', 'r')
            mock_path_instance.exists.assert_called_once()

        # Ensure subprocess.run not called
        mock_run.assert_not_called()

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_openEuler_via_os_release(self, mock_run, mock_path):
        """Test detection via /etc/os-release containing 'openEuler'"""
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = True
        mock_path.return_value = mock_path_instance

        with patch('builtins.open', mock_open(read_data='NAME="openEuler"')):
            result = SystemType.detect()
            assert result == 'openEuler'

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_ubuntu_via_os_release(self, mock_run, mock_path):
        """Test detection via /etc/os-release containing 'ubuntu'"""
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = True
        mock_path.return_value = mock_path_instance

        with patch('builtins.open', mock_open(read_data='ID=ubuntu')):
            result = SystemType.detect()
            assert result == 'ubuntu'

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_debian_via_os_release(self, mock_run, mock_path):
        """Test detection via /etc/os-release containing 'debian'"""
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = True
        mock_path.return_value = mock_path_instance

        with patch('builtins.open', mock_open(read_data='ID=debian')):
            result = SystemType.detect()
            assert result == 'debian'

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_via_package_manager_pacman(self, mock_run, mock_path):
        """Test detection via which pacman"""
        # os-release does not exist
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = False
        mock_path.return_value = mock_path_instance

        # Mock subprocess.run for which pacman
        mock_pacman = MagicMock()
        mock_pacman.returncode = 0
        mock_run.side_effect = [
            mock_pacman,  # which pacman
            MagicMock(returncode=1),  # which dnf
            MagicMock(returncode=1),  # which apt
        ]

        result = SystemType.detect()
        assert result == 'arch'
        assert mock_run.call_count == 3
        calls = mock_run.call_args_list
        assert calls[0][0][0] == ['which', 'pacman']
        assert calls[1][0][0] == ['which', 'dnf']
        assert calls[2][0][0] == ['which', 'apt']

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_via_package_manager_dnf(self, mock_run, mock_path):
        """Test detection via which dnf"""
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = False
        mock_path.return_value = mock_path_instance

        mock_dnf = MagicMock()
        mock_dnf.returncode = 0
        mock_run.side_effect = [
            MagicMock(returncode=1),  # which pacman
            mock_dnf,                  # which dnf
            MagicMock(returncode=1),  # which apt
        ]

        result = SystemType.detect()
        assert result == 'openEuler'

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_via_package_manager_apt(self, mock_run, mock_path):
        """Test detection via which apt"""
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = False
        mock_path.return_value = mock_path_instance

        mock_apt = MagicMock()
        mock_apt.returncode = 0
        mock_run.side_effect = [
            MagicMock(returncode=1),  # which pacman
            MagicMock(returncode=1),  # which dnf
            mock_apt,                 # which apt
        ]

        result = SystemType.detect()
        assert result == 'debian'

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_unknown(self, mock_run, mock_path):
        """Test detection when no os-release and no package manager"""
        mock_path_instance = MagicMock()
        mock_path_instance.exists.return_value = False
        mock_path.return_value = mock_path_instance

        mock_run.side_effect = [
            MagicMock(returncode=1),  # which pacman
            MagicMock(returncode=1),  # which dnf
            MagicMock(returncode=1),  # which apt
        ]

        result = SystemType.detect()
        assert result == 'unknown'

    @patch('eulerinstall.lib.system_detection.Path')
    @patch('subprocess.run')
    def test_detect_exception(self, mock_run, mock_path):
        """Test detection when exception occurs"""
        mock_path_instance = MagicMock()
        mock_path_instance.exists.side_effect = Exception('File error')
        mock_path.return_value = mock_path_instance

        with patch('eulerinstall.lib.system_detection.debug') as mock_debug:
            result = SystemType.detect()
            assert result == 'unknown'
            mock_debug.assert_called_once()

    @patch.object(SystemType, 'detect')
    def test_get_package_manager(self, mock_detect):
        """Test get_package_manager for each system type"""
        test_cases = [
            ('arch', 'pacman'),
            ('openEuler', 'dnf'),
            ('ubuntu', 'apt'),
            ('debian', 'apt'),
            ('unknown', 'unknown'),
        ]
        for sys_type, expected in test_cases:
            mock_detect.return_value = sys_type
            result = SystemType.get_package_manager()
            assert result == expected

    @patch.object(SystemType, 'detect')
    def test_get_install_command(self, mock_detect):
        """Test get_install_command for each system type"""
        test_cases = [
            ('arch', 'pacstrap'),
            ('openEuler', 'dnf'),
            ('ubuntu', 'debootstrap'),
            ('debian', 'debootstrap'),
            ('unknown', 'unknown'),
        ]
        for sys_type, expected in test_cases:
            mock_detect.return_value = sys_type
            result = SystemType.get_install_command()
            assert result == expected

    @patch.object(SystemType, 'detect')
    def test_get_sync_command(self, mock_detect):
        """Test get_sync_command for each system type"""
        test_cases = [
            ('arch', 'pacman -Syy'),
            ('openEuler', 'dnf makecache'),
            ('ubuntu', 'apt update'),
            ('debian', 'apt update'),
            ('unknown', 'unknown'),
        ]
        for sys_type, expected in test_cases:
            mock_detect.return_value = sys_type
            result = SystemType.get_sync_command()
            assert result == expected

    @patch.object(SystemType, 'detect')
    def test_get_time_sync_command(self, mock_detect):
        """Test get_time_sync_command for each system type"""
        # All return same command
        test_cases = ['arch', 'openEuler', 'ubuntu', 'debian', 'unknown']
        for sys_type in test_cases:
            mock_detect.return_value = sys_type
            result = SystemType.get_time_sync_command()
            assert result == 'timedatectl show --property=NTPSynchronized --value'

    @patch.object(SystemType, 'detect')
    def test_get_mirror_service(self, mock_detect):
        """Test get_mirror_service for each system type"""
        test_cases = [
            ('arch', 'reflector'),
            ('openEuler', 'dnf-makecache.timer'),
            ('ubuntu', 'apt-daily.timer'),
            ('debian', 'apt-daily.timer'),
            ('unknown', 'unknown'),
        ]
        for sys_type, expected in test_cases:
            mock_detect.return_value = sys_type
            result = SystemType.get_mirror_service()
            assert result == expected

    @patch.object(SystemType, 'detect')
    def test_get_keyring_service(self, mock_detect):
        """Test get_keyring_service for each system type"""
        test_cases = [
            ('arch', 'archlinux-keyring-wkd-sync'),
            ('openEuler', 'gpg-agent'),
            ('ubuntu', 'gpg-agent'),
            ('debian', 'gpg-agent'),
            ('unknown', 'unknown'),
        ]
        for sys_type, expected in test_cases:
            mock_detect.return_value = sys_type
            result = SystemType.get_keyring_service()
            assert result == expected

    @patch.object(SystemType, 'detect')
    def test_is_supported(self, mock_detect):
        """Test is_supported"""
        test_cases = [
            ('arch', True),
            ('openEuler', True),
            ('ubuntu', False),
            ('debian', False),
            ('unknown', False),
        ]
        for sys_type, expected in test_cases:
            mock_detect.return_value = sys_type
            result = SystemType.is_supported()
            assert result == expected

    @patch.object(SystemType, 'detect')
    @patch('eulerinstall.lib.system_detection.info')
    def test_log_system_info_supported(self, mock_info, mock_detect):
        """Test log_system_info for supported system"""
        mock_detect.return_value = 'arch'
        with patch.object(SystemType, 'get_package_manager', return_value='pacman'), \
             patch.object(SystemType, 'get_install_command', return_value='pacstrap'):
            SystemType.log_system_info()
            calls = mock_info.call_args_list
            assert len(calls) == 3
            assert 'Detected system type: arch' in calls[0][0][0]
            assert 'Package manager: pacman' in calls[1][0][0]
            assert 'Install command: pacstrap' in calls[2][0][0]

    @patch.object(SystemType, 'detect')
    @patch('eulerinstall.lib.system_detection.info')
    def test_log_system_info_unsupported(self, mock_info, mock_detect):
        """Test log_system_info for unsupported system"""
        mock_detect.return_value = 'ubuntu'
        with patch.object(SystemType, 'get_package_manager', return_value='apt'), \
             patch.object(SystemType, 'get_install_command', return_value='debootstrap'):
            SystemType.log_system_info()
            # Should have 4 calls because of warning
            calls = mock_info.call_args_list
            assert len(calls) == 4
            assert 'Warning: This system type is not officially supported by archinstall' in calls[3][0][0]