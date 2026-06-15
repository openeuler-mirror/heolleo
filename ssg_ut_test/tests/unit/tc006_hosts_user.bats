#!/usr/bin/env bash

load '../test_helper'

@test "TC-034 PASS: no .shosts files" {
    patch_and_run "SV_261343r996489_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-034 FAIL: .shosts file exists" {
    touch "${FAKE_ROOT}/root/.shosts"
    patch_and_run "SV_261343r996489_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-035 PASS: root UID=0 exists" {
    fake_file "/etc/passwd" 'root:x:0:0:root:/root:/bin/bash'
    patch_and_run "SV_261359r996526_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-035 FAIL: no UID=0 account" {
    fake_file "/etc/passwd" 'nobody:x:65534:65534:Nobody:/:/sbin/nologin'
    patch_and_run "SV_261359r996526_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-036 PASS: SELINUX=enforcing" {
    fake_file "/etc/selinux/config" 'SELINUX=enforcing
SELINUXTYPE=targeted'
    patch_and_run "SV_261369r996549_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-036 FAIL: SELINUX=permissive" {
    fake_file "/etc/selinux/config" 'SELINUX=permissive
SELINUXTYPE=targeted'
    patch_and_run "SV_261369r996549_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-036 FAIL: SELINUX=disabled" {
    fake_file "/etc/selinux/config" 'SELINUX=disabled'
    patch_and_run "SV_261369r996549_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-037 PASS: SELINUXTYPE=targeted" {
    fake_file "/etc/selinux/config" 'SELINUX=enforcing
SELINUXTYPE=targeted'
    patch_and_run "SV_261370r996551_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-037 FAIL: SELINUXTYPE=mls" {
    fake_file "/etc/selinux/config" 'SELINUX=enforcing
SELINUXTYPE=mls'
    patch_and_run "SV_261370r996551_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-038 PASS: sudo timestamp_timeout=0" {
    fake_file "/etc/sudoers" 'Defaults timestamp_timeout=0'
    patch_and_run "SV_261374r1050789_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-038 FAIL: sudo timestamp_timeout=5" {
    fake_file "/etc/sudoers" 'Defaults timestamp_timeout=5'
    patch_and_run "SV_261374r1050789_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-038 FAIL: sudo timestamp_timeout missing" {
    fake_file "/etc/sudoers" 'Defaults env_reset'
    patch_and_run "SV_261374r1050789_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
