"""
Test cases for hardware.py
"""
import os
from unittest.mock import patch, mock_open, MagicMock
import pytest

from eulerinstall.lib.hardware import (
    CpuVendor,
    GfxPackage,
    GfxDriver,
    SysInfo,
    _SysInfo,
)


class TestCpuVendor:
    """Test CpuVendor enum"""

    def test_get_vendor_known(self):
        """Test get_vendor with known vendor"""
        assert CpuVendor.get_vendor('AuthenticAMD') == CpuVendor.AuthenticAMD
        assert CpuVendor.get_vendor('GenuineIntel') == CpuVendor.GenuineIntel

    def test_get_vendor_unknown(self):
        """Test get_vendor with unknown vendor"""
        with patch('eulerinstall.lib.hardware.debug') as mock_debug:
            result = CpuVendor.get_vendor('UnknownVendor')
            assert result == CpuVendor._Unknown
            mock_debug.assert_called_once()

    def test_has_microcode(self):
        """Test _has_microcode"""
        assert CpuVendor.AuthenticAMD._has_microcode() is True
        assert CpuVendor.GenuineIntel._has_microcode() is True
        assert CpuVendor._Unknown._has_microcode() is False

    def test_get_ucode(self):
        """Test get_ucode returns correct path"""
        assert CpuVendor.AuthenticAMD.get_ucode() == 'amd-ucode.img'
        assert CpuVendor.GenuineIntel.get_ucode() == 'intel-ucode.img'
        assert CpuVendor._Unknown.get_ucode() is None


class TestGfxDriver:
    """Test GfxDriver enum"""

    def test_is_nvidia(self):
        """Test is_nvidia"""
        assert GfxDriver.NvidiaProprietary.is_nvidia() is True
        assert GfxDriver.NvidiaOpenSource.is_nvidia() is True
        assert GfxDriver.NvidiaOpenKernel.is_nvidia() is True
        assert GfxDriver.AllOpenSource.is_nvidia() is False
        assert GfxDriver.AmdOpenSource.is_nvidia() is False
        assert GfxDriver.IntelOpenSource.is_nvidia() is False
        assert GfxDriver.VMOpenSource.is_nvidia() is False

    def test_gfx_packages(self):
        """Test gfx_packages returns correct list"""
        # Test a few drivers
        packages = GfxDriver.AllOpenSource.gfx_packages()
        assert GfxPackage.XorgServer in packages
        assert GfxPackage.XorgXinit in packages
        assert GfxPackage.Mesa in packages
        assert GfxPackage.Xf86VideoAmdgpu in packages
        assert GfxPackage.Xf86VideoAti in packages
        assert GfxPackage.Xf86VideoNouveau in packages
        assert GfxPackage.LibvaMesaDriver in packages
        assert GfxPackage.LibvaIntelDriver in packages
        assert GfxPackage.IntelMediaDriver in packages
        assert GfxPackage.VulkanRadeon in packages
        assert GfxPackage.VulkanIntel in packages
        assert GfxPackage.VulkanNouveau in packages

        packages = GfxDriver.NvidiaProprietary.gfx_packages()
        assert GfxPackage.NvidiaDkms in packages
        assert GfxPackage.Dkms in packages
        assert GfxPackage.LibvaNvidiaDriver in packages
        assert GfxPackage.Mesa not in packages

    def test_packages_text(self):
        """Test packages_text returns formatted string"""
        with patch('eulerinstall.lib.hardware.tr', return_value='Installed packages'):
            text = GfxDriver.AllOpenSource.packages_text()
            assert 'Installed packages' in text
            assert ':' in text
            assert '\t- ' in text


class TestSysInfo:
    """Test SysInfo static methods"""

    @patch('eulerinstall.lib.hardware.list_interfaces')
    @patch('eulerinstall.lib.hardware.enrich_iface_types')
    def test_has_wifi_true(self, mock_enrich, mock_list):
        """Test has_wifi returns True when wireless present"""
        mock_list.return_value = {'wlan0': 'WIRELESS'}
        mock_enrich.return_value = {'wlan0': 'WIRELESS'}
        assert SysInfo.has_wifi() is True

    @patch('eulerinstall.lib.hardware.list_interfaces')
    @patch('eulerinstall.lib.hardware.enrich_iface_types')
    def test_has_wifi_false(self, mock_enrich, mock_list):
        """Test has_wifi returns False when no wireless"""
        mock_list.return_value = {'eth0': 'ETHERNET'}
        mock_enrich.return_value = {'eth0': 'ETHERNET'}
        assert SysInfo.has_wifi() is False

    @patch('os.path.isdir')
    def test_has_uefi_true(self, mock_isdir):
        """Test has_uefi returns True when /sys/firmware/efi exists"""
        mock_isdir.return_value = True
        assert SysInfo.has_uefi() is True
        mock_isdir.assert_called_once_with('/sys/firmware/efi')

    @patch('os.path.isdir')
    def test_has_uefi_false(self, mock_isdir):
        """Test has_uefi returns False when no UEFI"""
        mock_isdir.return_value = False
        assert SysInfo.has_uefi() is False

    @patch('eulerinstall.lib.hardware.SysCommand')
    def test_graphics_devices(self, mock_syscommand):
        """Test _graphics_devices parsing"""
        mock_syscommand.return_value = [
            b'00:02.0 VGA compatible controller: Intel Corporation HD Graphics',
            b'01:00.0 3D controller: NVIDIA Corporation GP106 [GeForce GTX 1060]',
        ]
        devices = SysInfo._graphics_devices()
        assert 'Intel Corporation HD Graphics' in devices
        assert 'NVIDIA Corporation GP106 [GeForce GTX 1060]' in devices

    @patch.object(SysInfo, '_graphics_devices')
    def test_has_nvidia_graphics_true(self, mock_devices):
        """Test has_nvidia_graphics returns True"""
        mock_devices.return_value = {
            'NVIDIA Corporation GP106 [GeForce GTX 1060]': 'line',
        }
        assert SysInfo.has_nvidia_graphics() is True

    @patch.object(SysInfo, '_graphics_devices')
    def test_has_nvidia_graphics_false(self, mock_devices):
        """Test has_nvidia_graphics returns False"""
        mock_devices.return_value = {
            'Intel Corporation HD Graphics': 'line',
        }
        assert SysInfo.has_nvidia_graphics() is False

    @patch.object(SysInfo, '_graphics_devices')
    def test_has_amd_graphics(self, mock_devices):
        """Test has_amd_graphics"""
        mock_devices.return_value = {
            'Advanced Micro Devices, Inc. [AMD/ATI] Radeon RX 580': 'line',
        }
        assert SysInfo.has_amd_graphics() is True
        mock_devices.return_value = {}
        assert SysInfo.has_amd_graphics() is False

    @patch.object(SysInfo, '_graphics_devices')
    def test_has_intel_graphics(self, mock_devices):
        """Test has_intel_graphics"""
        mock_devices.return_value = {
            'Intel Corporation HD Graphics': 'line',
        }
        assert SysInfo.has_intel_graphics() is True
        mock_devices.return_value = {}
        assert SysInfo.has_intel_graphics() is False

    @patch.object(_SysInfo, 'cpu_info', {'vendor_id': 'GenuineIntel'})
    def test_cpu_vendor_known(self):
        """Test cpu_vendor returns correct enum"""
        result = SysInfo.cpu_vendor()
        assert result == CpuVendor.GenuineIntel

    @patch.object(_SysInfo, 'cpu_info', {'vendor_id': 'UnknownVendor'})
    @patch('eulerinstall.lib.hardware.debug')
    def test_cpu_vendor_unknown(self, mock_debug):
        """Test cpu_vendor with unknown vendor"""
        result = SysInfo.cpu_vendor()
        assert result == CpuVendor._Unknown
        mock_debug.assert_called_once()

    @patch.object(_SysInfo, 'cpu_info', {})
    def test_cpu_vendor_none(self):
        """Test cpu_vendor returns None when no vendor_id"""
        result = SysInfo.cpu_vendor()
        assert result is None

    @patch.object(_SysInfo, 'cpu_info', {'model name': 'Intel(R) Core(TM) i7'})
    def test_cpu_model(self):
        """Test cpu_model returns model name"""
        assert SysInfo.cpu_model() == 'Intel(R) Core(TM) i7'

    @patch('builtins.open', new_callable=mock_open, read_data='Dell Inc.\n')
    def test_sys_vendor(self, mock_file):
        """Test sys_vendor reads from sysfs"""
        result = SysInfo.sys_vendor()
        assert result == 'Dell Inc.'
        mock_file.assert_called_once_with('/sys/devices/virtual/dmi/id/sys_vendor')

    @patch('builtins.open', new_callable=mock_open, read_data='Precision 5550\n')
    def test_product_name(self, mock_file):
        """Test product_name reads from sysfs"""
        result = SysInfo.product_name()
        assert result == 'Precision 5550'
        mock_file.assert_called_once_with('/sys/devices/virtual/dmi/id/product_name')

    @patch.object(_SysInfo, 'mem_info_by_key')
    def test_mem_available(self, mock_by_key):
        """Test mem_available"""
        mock_by_key.return_value = 8192
        assert SysInfo.mem_available() == 8192
        mock_by_key.assert_called_once_with('MemAvailable')

    @patch.object(_SysInfo, 'mem_info_by_key')
    def test_mem_free(self, mock_by_key):
        """Test mem_free"""
        mock_by_key.return_value = 1024
        assert SysInfo.mem_free() == 1024
        mock_by_key.assert_called_once_with('MemFree')

    @patch.object(_SysInfo, 'mem_info_by_key')
    def test_mem_total(self, mock_by_key):
        """Test mem_total"""
        mock_by_key.return_value = 16384
        assert SysInfo.mem_total() == 16384
        mock_by_key.assert_called_once_with('MemTotal')

    @patch('eulerinstall.lib.hardware.SysCommand')
    def test_virtualization(self, mock_syscommand):
        """Test virtualization returns output"""
        mock_syscommand.return_value = b'kvm\n'
        result = SysInfo.virtualization()
        assert result == 'kvm'

    @patch('eulerinstall.lib.hardware.SysCommand')
    def test_virtualization_error(self, mock_syscommand):
        """Test virtualization returns None on error"""
        from eulerinstall.lib.exceptions import SysCallError
        mock_syscommand.side_effect = SysCallError('Failed')
        with patch('eulerinstall.lib.hardware.debug') as mock_debug:
            result = SysInfo.virtualization()
            assert result is None
            mock_debug.assert_called_once()

    @patch('eulerinstall.lib.hardware.SysCommand')
    def test_is_vm_true(self, mock_syscommand):
        """Test is_vm returns True when virtualization detected"""
        mock_syscommand.return_value = [b'kvm']
        assert SysInfo.is_vm() is True

    @patch('eulerinstall.lib.hardware.SysCommand')
    def test_is_vm_false(self, mock_syscommand):
        """Test is_vm returns False when none"""
        mock_syscommand.return_value = [b'none']
        assert SysInfo.is_vm() is False

    @patch('eulerinstall.lib.hardware.SysCommand')
    def test_is_vm_error(self, mock_syscommand):
        """Test is_vm returns False on error"""
        from eulerinstall.lib.exceptions import SysCallError
        mock_syscommand.side_effect = SysCallError('Failed')
        with patch('eulerinstall.lib.hardware.debug') as mock_debug:
            assert SysInfo.is_vm() is False
            mock_debug.assert_called_once()

    @patch.object(_SysInfo, 'loaded_modules', ['snd_sof', 'other'])
    def test_requires_sof_fw_true(self):
        """Test requires_sof_fw returns True"""
        assert SysInfo.requires_sof_fw() is True

    @patch.object(_SysInfo, 'loaded_modules', [])
    def test_requires_sof_fw_false(self):
        """Test requires_sof_fw returns False"""
        assert SysInfo.requires_sof_fw() is False

    @patch.object(_SysInfo, 'loaded_modules', ['snd_emu10k1'])
    def test_requires_alsa_fw_true(self):
        """Test requires_alsa_fw returns True"""
        assert SysInfo.requires_alsa_fw() is True

    @patch.object(_SysInfo, 'loaded_modules', [])
    def test_requires_alsa_fw_false(self):
        """Test requires_alsa_fw returns False"""
        assert SysInfo.requires_alsa_fw() is False