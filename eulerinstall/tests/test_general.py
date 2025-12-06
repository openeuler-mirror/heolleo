"""
Test module for eulerinstall.lib.general
"""
import json
import re
import secrets
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch

import pytest

from eulerinstall.lib.general import (
    JSON,
    UNSAFE_JSON,
    SysCommand,
    SysCommandWorker,
    clear_vt100_escape_codes,
    clear_vt100_escape_codes_from_str,
    generate_password,
    jsonify,
    locate_binary,
    run,
)


class TestGeneratePassword:
    """Test generate_password function."""

    def test_length(self) -> None:
        """Password should have specified length."""
        password = generate_password(32)
        assert len(password) == 32

    def test_default_length(self) -> None:
        """Default length should be 64."""
        password = generate_password()
        assert len(password) == 64

    def test_randomness(self) -> None:
        """Generated passwords should be different (probabilistic)."""
        p1 = generate_password(10)
        p2 = generate_password(10)
        assert p1 != p2

    def test_characters_from_printable(self) -> None:
        """Password characters should be from string.printable."""
        import string

        password = generate_password(100)
        for ch in password:
            assert ch in string.printable


class TestLocateBinary:
    """Test locate_binary function."""

    @patch('shutil.which')
    def test_found(self, mock_which: MagicMock) -> None:
        """Should return path when binary exists."""
        mock_which.return_value = '/usr/bin/foo'
        result = locate_binary('foo')
        assert result == '/usr/bin/foo'

    @patch('shutil.which')
    def test_not_found(self, mock_which: MagicMock) -> None:
        """Should raise RequirementError when binary not found."""
        mock_which.return_value = None
        with pytest.raises(Exception) as exc_info:
            locate_binary('nonexistent')
        assert 'Binary nonexistent does not exist' in str(exc_info.value)


class TestClearVT100EscapeCodes:
    """Test VT100 escape code removal functions."""

    def test_clear_vt100_escape_codes_bytes(self) -> None:
        """Should remove VT100 escape sequences from bytes."""
        data = b'\x1B[?2004hHello\x1B[?2004lWorld'
        cleaned = clear_vt100_escape_codes(data)
        assert cleaned == b'HelloWorld'

    def test_clear_vt100_escape_codes_str(self) -> None:
        """Should remove VT100 escape sequences from string."""
        data = '\x1B[?2004hHello\x1B[?2004lWorld'
        cleaned = clear_vt100_escape_codes_from_str(data)
        assert cleaned == 'HelloWorld'

    def test_no_escape_codes(self) -> None:
        """Should leave data unchanged if no escape codes."""
        data = b'Plain text'
        assert clear_vt100_escape_codes(data) == data
        data_str = 'Plain text'
        assert clear_vt100_escape_codes_from_str(data_str) == data_str


class TestJsonify:
    """Test jsonify function."""

    def test_primitive_types(self) -> None:
        """Primitive types should be returned as-is."""
        assert jsonify(42) == 42
        assert jsonify('hello') == 'hello'
        assert jsonify(3.14) == 3.14
        assert jsonify(True) is True

    def test_dict(self) -> None:
        """Dict should be recursively processed."""
        data = {'a': 1, 'b': {'c': 2}}
        result = jsonify(data)
        assert result == {'a': 1, 'b': {'c': 2}}

    def test_dict_with_bang_key_safe(self) -> None:
        """Keys starting with '!' should be omitted when safe=True."""
        data = {'!secret': 'value', 'public': 'data'}
        result = jsonify(data, safe=True)
        assert '!secret' not in result
        assert result == {'public': 'data'}

    def test_dict_with_bang_key_unsafe(self) -> None:
        """Keys starting with '!' should be kept when safe=False."""
        data = {'!secret': 'value', 'public': 'data'}
        result = jsonify(data, safe=False)
        assert result == {'!secret': 'value', 'public': 'data'}

    def test_enum(self) -> None:
        """Enum should be converted to its value."""
        from enum import Enum

        class Color(Enum):
            RED = 'red'

        result = jsonify(Color.RED)
        assert result == 'red'

    def test_datetime(self) -> None:
        """datetime/date should be converted to ISO string."""
        from datetime import date, datetime

        dt = datetime(2023, 1, 1, 12, 0, 0)
        assert jsonify(dt) == '2023-01-01T12:00:00'
        d = date(2023, 1, 1)
        assert jsonify(d) == '2023-01-01'

    def test_path(self) -> None:
        """Path should be converted to string."""
        p = Path('/some/path')
        result = jsonify(p)
        assert result == '/some/path'

    def test_list(self) -> None:
        """List should be processed recursively."""
        data = [1, {'a': 2}, [3]]
        result = jsonify(data)
        assert result == [1, {'a': 2}, [3]]

    def test_object_with_json_method(self) -> None:
        """Object with .json() method should be processed."""
        class MockObject:
            def json(self):
                return {'x': 1}

        obj = MockObject()
        result = jsonify(obj)
        assert result == {'x': 1}

    def test_object_with_dict(self) -> None:
        """Object with __dict__ should be converted to dict."""
        class Simple:
            def __init__(self):
                self.a = 1
                self.b = 2

        obj = Simple()
        result = jsonify(obj)
        assert result == {'a': 1, 'b': 2}


class TestJSONEncoders:
    """Test JSON and UNSAFE_JSON classes."""

    def test_json_encoder_safe(self) -> None:
        """JSON encoder should omit bang keys."""
        data = {'!secret': 'value', 'public': 'data'}
        encoded = JSON().encode(data)
        decoded = json.loads(encoded)
        assert '!secret' not in decoded
        assert decoded == {'public': 'data'}

    def test_unsafe_json_encoder(self) -> None:
        """UNSAFE_JSON encoder should keep bang keys."""
        data = {'!secret': 'value', 'public': 'data'}
        encoded = UNSAFE_JSON().encode(data)
        decoded = json.loads(encoded)
        assert decoded == {'!secret': 'value', 'public': 'data'}
