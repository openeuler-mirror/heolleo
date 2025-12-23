#!/usr/bin/env python3
"""
Script to generate new encrypted test data using the updated crypt functions.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from eulerinstall.lib.crypt import encrypt

# Original test data that needs to be encrypted
test_data = {
    "root_enc_password": "$y$j9T$FWCInXmSsS.8KV4i7O50H.$Hb6/g.Sw1ry888iXgkVgc93YNuVk/Rw94knDKdPVQw7",
    "users": [
        {
            "enc_password": "$y$j9T$3KxMigAEnjtzbjalhLewE.$gmuoQtc9RNY/PmO/GxHHYvkZNO86Eeftg1Oc7L.QSO/",
            "sudo": True,
            "username": "t",
            "groups": []
        }
    ]
}

# Encrypt the test data with password "master"
import json
encrypted_data = encrypt(json.dumps(test_data), "master")

print("New encrypted test data:")
print(encrypted_data)

# Write to file
with open("tests/data/test_encrypted_creds_new.json", "w") as f:
    f.write(encrypted_data)

print("\nNew test data written to tests/data/test_encrypted_creds_new.json")