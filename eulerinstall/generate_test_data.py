#!/usr/bin/env python3
"""
Script to generate new encrypted test data using the updated crypt functions.
"""

import sys
import os
import secrets
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from eulerinstall.lib.crypt import encrypt, crypt_yescrypt

root_password = os.environ.get('ROOT_PASSWORD', secrets.token_hex(16))
user_password = os.environ.get('USER_PASSWORD', secrets.token_hex(16))

root_enc_password = crypt_yescrypt(root_password)
user_enc_password = crypt_yescrypt(user_password)

test_data = {
    "root_enc_password": root_enc_password,
    "users": [
        {
            "enc_password": user_enc_password,
            "sudo": True,
            "username": os.environ.get('TEST_USERNAME', 't'),
            "groups": []
        }
    ]
}

import json
encrypted_data = encrypt(json.dumps(test_data), "master")

print("New encrypted test data:")
print(encrypted_data)

with open("tests/data/test_encrypted_creds_new.json", "w") as f:
    f.write(encrypted_data)

print("\nNew test data written to tests/data/test_encrypted_creds_new.json")
print(f"Generated with root password: {root_password}")
print(f"Generated with user password: {user_password}")
