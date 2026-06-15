#!/usr/bin/env bash

load '../test_helper'

@test "TC-039 PASS: AIDE installed" {
    fake_bin "aide" 'if [ "$1" = "-h" ]; then echo "Usage: aide [options] command"; exit 0; fi; exit 1'
    patch_and_run "SV_261403r996627_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-039 FAIL: AIDE not installed" {
    fake_bin "aide" 'echo "aide: command not found" >&2; exit 127'
    patch_and_run "SV_261403r996627_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-040 PASS: auditctl available" {
    fake_bin "auditctl" 'if [ "$1" = "-v" ]; then echo "auditctl version 3.0"; exit 0; fi; exit 1'
    patch_and_run "SV_261410r996645_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-040 FAIL: auditctl not available" {
    fake_bin "auditctl" 'exit 127'
    patch_and_run "SV_261410r996645_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-041 PASS: auditd active and enabled" {
    fake_systemctl "auditd.service" "active" "enabled"
    patch_and_run "SV_261411r996646_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-041 FAIL: auditd active but disabled" {
    fake_systemctl "auditd.service" "active" "disabled"
    patch_and_run "SV_261411r996646_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-041 FAIL: auditd inactive" {
    fake_systemctl "auditd.service" "inactive" "disabled"
    patch_and_run "SV_261411r996646_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-042 PASS: disk_full_action = syslog" {
    fake_file "/etc/audisp/audisp-remote.conf" "disk_full_action = syslog"
    patch_and_run "SV_261417r996662_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-042 FAIL: disk_full_action = ignore" {
    fake_file "/etc/audisp/audisp-remote.conf" "disk_full_action = ignore"
    patch_and_run "SV_261417r996662_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-042 FAIL: disk_full_action missing" {
    fake_file "/etc/audisp/audisp-remote.conf" "queue_size = 2048"
    patch_and_run "SV_261417r996662_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-043 PASS: enable_krb5 = yes" {
    fake_file "/etc/audit/audisp-remote.conf" "enable_krb5 = yes"
    patch_and_run "SV_261421r996672_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-043 FAIL: enable_krb5 commented out" {
    fake_file "/etc/audit/audisp-remote.conf" "# enable_krb5 = yes"
    patch_and_run "SV_261421r996672_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-043 FAIL: enable_krb5 missing" {
    fake_file "/etc/audit/audisp-remote.conf" "queue_size = 2048"
    patch_and_run "SV_261421r996672_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
