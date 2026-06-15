#!/usr/bin/env bash

load '../test_helper'

@test "TC-011 PASS: /home mounted with nosuid" {
    fake_bin "mount" 'echo "/dev/sda2 on /home type ext4 (rw,nosuid,nodev,relatime)"'
    patch_and_run "SV_261285r996838_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-011 FAIL: /home not separate mount" {
    fake_bin "mount" 'echo ""'
    patch_and_run "SV_261285r996838_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-011 FAIL: /home without nosuid" {
    fake_bin "mount" 'echo "/dev/sda2 on /home type ext4 (rw,relatime)"'
    patch_and_run "SV_261285r996838_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-012 PASS: all shared lib files owned by root group" {
    patch_and_run "SV_261296r1102102_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-012 FAIL: shared lib file with non-root group" {
    touch "${FAKE_ROOT}/lib64/libtest.so.1"
    chgrp users "${FAKE_ROOT}/lib64/libtest.so.1" 2>/dev/null || true
    patch_and_run "SV_261296r1102102_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-013 PASS: /usr/local commands all root owned" {
    patch_and_run "SV_261299r996373_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-013 FAIL: /usr/local command non-root owner" {
    touch "${FAKE_ROOT}/usr/local/bin/testcmd"
    chown nobody "${FAKE_ROOT}/usr/local/bin/testcmd" 2>/dev/null || true
    patch_and_run "SV_261299r996373_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-014 PASS: world-writable dirs all root owned" {
    patch_and_run "SV_261306r996389_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-014 FAIL: world-writable dir non-root owner" {
    mkdir -p "${FAKE_ROOT}/tmp_www"
    chmod 777 "${FAKE_ROOT}/tmp_www"
    chown nobody "${FAKE_ROOT}/tmp_www" 2>/dev/null || true
    patch_and_run "SV_261306r996389_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-015 PASS: world-writable dirs have sticky bit" {
    mkdir -p "${FAKE_ROOT}/tmp_sticky"
    chmod 1777 "${FAKE_ROOT}/tmp_sticky"
    patch_and_run "SV_261307r996392_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-015 FAIL: world-writable dir without sticky bit" {
    mkdir -p "${FAKE_ROOT}/tmp_nosticky"
    chmod 777 "${FAKE_ROOT}/tmp_nosticky"
    patch_and_run "SV_261307r996392_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
