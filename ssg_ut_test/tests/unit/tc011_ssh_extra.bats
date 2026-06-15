#!/usr/bin/env bash

load '../test_helper'

@test "TC-076 PASS: SSH Banner /etc/issue/ configured" {
    fake_file "/etc/ssh/sshd_config" "Banner /etc/issue/"
    patch_and_run "SV_261329r996455_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-076 FAIL: SSH Banner missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261329r996455_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-077 PASS: SSH ClientAliveCountMax 1" {
    fake_file "/etc/ssh/sshd_config" "ClientAliveCountMax 1"
    patch_and_run "SV_261331r996459_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-077 FAIL: SSH ClientAliveCountMax missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261331r996459_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-078 PASS: SSH X11Forwarding no" {
    fake_file "/etc/ssh/sshd_config" "X11Forwarding no"
    patch_and_run "SV_261333r996464_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-078 FAIL: SSH X11Forwarding yes" {
    fake_file "/etc/ssh/sshd_config" "X11Forwarding yes"
    patch_and_run "SV_261333r996464_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-079 PASS: SSH KexAlgorithms correct" {
    fake_file "/etc/ssh/sshd_config" "KexAlgorithms ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521,diffie-hellman-group-exchange-sha256"
    patch_and_run "SV_261336r996472_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-079 FAIL: SSH KexAlgorithms missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261336r996472_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-080 PASS: SSH IgnoreUserKnownHosts yes" {
    fake_file "/etc/ssh/sshd_config" "IgnoreUserKnownHosts yes"
    patch_and_run "SV_261340r996483_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-080 FAIL: SSH IgnoreUserKnownHosts missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261340r996483_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-081 PASS: SSH StrictModes yes" {
    fake_file "/etc/ssh/sshd_config" "StrictModes yes"
    patch_and_run "SV_261341r996486_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-081 FAIL: SSH StrictModes missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261341r996486_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-082 PASS: no shosts.equiv files" {
    patch_and_run "SV_261344r996490_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-082 FAIL: shosts.equiv file exists" {
    touch "${FAKE_ROOT}/etc/shosts.equiv"
    patch_and_run "SV_261344r996490_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
