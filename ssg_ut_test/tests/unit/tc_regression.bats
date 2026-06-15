#!/usr/bin/env bash

load '../test_helper'

@test "TC-REG-001: regression - ASLR check still works after env reset" {
    setup
    fake_sysctl_n "kernel.randomize_va_space" "2"
    patch_and_run "SV_261271r996306_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    setup
    fake_sysctl_n "kernel.randomize_va_space" "0"
    patch_and_run "SV_261271r996306_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-REG-002: regression - SSH PermitRootLogin still works after env reset" {
    setup
    fake_file "/etc/ssh/sshd_config" "PermitRootLogin no"
    patch_and_run "SV_261337r996844_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    setup
    fake_file "/etc/ssh/sshd_config" "PermitRootLogin yes"
    patch_and_run "SV_261337r996844_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
