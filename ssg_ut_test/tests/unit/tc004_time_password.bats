#!/usr/bin/env bash

load '../test_helper'

@test "TC-016 PASS: NTP maxpoll 16 configured" {
    fake_file "/etc/chrony.conf" "server 0.us.pool.ntp.mil maxpoll 16"
    patch_and_run "SV_261311r1038944_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-016 FAIL: NTP maxpoll 10" {
    fake_file "/etc/chrony.conf" "server 0.us.pool.ntp.mil maxpoll 10"
    patch_and_run "SV_261311r1038944_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-016 FAIL: NTP no maxpoll config" {
    fake_file "/etc/chrony.conf" "server 0.us.pool.ntp.mil"
    patch_and_run "SV_261311r1038944_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-017 PASS: password ucredit=-1 configured" {
    fake_file "/etc/pam.d/common-password" "password requisite pam_pwquality.so ucredit=-1"
    patch_and_run "SV_261377r996566_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-017 FAIL: password ucredit=-1 missing" {
    fake_file "/etc/pam.d/common-password" "password requisite pam_pwquality.so retry=3"
    patch_and_run "SV_261377r996566_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-018 PASS: password lcredit=-1 configured" {
    fake_file "/etc/pam.d/common-password" "password requisite pam_pwquality.so lcredit=-1"
    patch_and_run "SV_261378r996568_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-018 FAIL: password lcredit=-1 missing" {
    fake_file "/etc/pam.d/common-password" "password requisite pam_pwquality.so retry=3"
    patch_and_run "SV_261378r996568_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-019 PASS: PAM no nullok" {
    fake_file "/etc/pam.d/system-auth" "auth required pam_unix.so try_first_pass"
    patch_and_run "SV_261386r996587_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-019 FAIL: PAM contains nullok" {
    fake_file "/etc/pam.d/system-auth" "auth required pam_unix.so nullok"
    patch_and_run "SV_261386r996587_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-020 PASS: no empty password accounts" {
    fake_file "/etc/shadow" 'root:$6$salt$hash:19000:0:99999:7:::
admin:$6$salt$hash:19000:0:99999:7:::'
    patch_and_run "SV_261387r996588_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-020 FAIL: empty password account exists" {
    fake_file "/etc/shadow" 'root:$6$salt$hash:19000:0:99999:7:::
testuser::19000:0:99999:7:::'
    patch_and_run "SV_261387r996588_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-021 PASS: opasswd file exists" {
    touch "${FAKE_ROOT}/etc/security/opasswd"
    patch_and_run "SV_261390r996595_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-021 FAIL: opasswd file missing" {
    patch_and_run "SV_261390r996595_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-022 PASS: ENCRYPT_METHOD SHA512" {
    fake_file "/etc/login.defs" "ENCRYPT_METHOD SHA512"
    patch_and_run "SV_261391r996598_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-022 FAIL: ENCRYPT_METHOD MD5" {
    fake_file "/etc/login.defs" "ENCRYPT_METHOD MD5"
    patch_and_run "SV_261391r996598_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-022 FAIL: ENCRYPT_METHOD missing" {
    fake_file "/etc/login.defs" "PASS_MAX_DAYS 90"
    patch_and_run "SV_261391r996598_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-023 PASS: SHA_CRYPT_MAX_ROUNDS and MIN_ROUNDS both 5000" {
    fake_file "/etc/login.defs" "SHA_CRYPT_MAX_ROUNDS 5000
SHA_CRYPT_MIN_ROUNDS 5000"
    patch_and_run "SV_261392r996600_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-023 FAIL: only MAX_ROUNDS set" {
    fake_file "/etc/login.defs" "SHA_CRYPT_MAX_ROUNDS 5000"
    patch_and_run "SV_261392r996600_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-023 FAIL: both SHA_CRYPT_ROUNDS missing" {
    fake_file "/etc/login.defs" "PASS_MAX_DAYS 90"
    patch_and_run "SV_261392r996600_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
