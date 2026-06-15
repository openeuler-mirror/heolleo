#!/usr/bin/env bash

load '../test_helper'

@test "TC-007 PASS: ASLR value is 2" {
    fake_sysctl_n "kernel.randomize_va_space" "2"
    patch_and_run "SV_261271r996306_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-007 FAIL: ASLR value is 0" {
    fake_sysctl_n "kernel.randomize_va_space" "0"
    patch_and_run "SV_261271r996306_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-007 FAIL: ASLR value is 1 (boundary)" {
    fake_sysctl_n "kernel.randomize_va_space" "1"
    patch_and_run "SV_261271r996306_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-008 PASS: yum clean_requirements_on_remove=True" {
    fake_file "/etc/yum.conf" "clean_requirements_on_remove=True"
    patch_and_run "SV_261275r996314_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-008 FAIL: yum clean_requirements_on_remove not present" {
    fake_file "/etc/yum.conf" "installonly_limit=3"
    patch_and_run "SV_261275r996314_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-008 FAIL: yum clean_requirements_on_remove=False" {
    fake_file "/etc/yum.conf" "clean_requirements_on_remove=False"
    patch_and_run "SV_261275r996314_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-009 PASS: telnetd not installed" {
    fake_bin "whereis" 'if [ "$1" = "telnetd" ]; then echo "telnetd: "; exit 0; fi; /usr/bin/whereis "$@"'
    patch_and_run "SV_261277r996318_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-009 FAIL: telnetd installed" {
    fake_bin "whereis" 'if [ "$1" = "telnetd" ]; then echo "telnetd: /usr/sbin/telnetd"; exit 0; fi; /usr/bin/whereis "$@"'
    patch_and_run "SV_261277r996318_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-010 PASS: IPv6 source route disabled" {
    fake_sysctl_full "net.ipv6.conf.default.accept_source_route" "0"
    patch_and_run "SV_261322r996436_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-010 FAIL: IPv6 source route enabled" {
    fake_sysctl_full "net.ipv6.conf.default.accept_source_route" "1"
    patch_and_run "SV_261322r996436_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
