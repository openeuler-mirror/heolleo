#!/usr/bin/env bash

load '../test_helper'

@test "TC-024 PASS: ssh-keygen exists" {
    touch "${FAKE_ROOT}/usr/bin/ssh-keygen"
    chmod +x "${FAKE_ROOT}/usr/bin/ssh-keygen"
    patch_and_run "SV_261327r996450_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-024 FAIL: ssh-keygen not found" {
    patch_and_run "SV_261327r996450_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-025 PASS: sshd service active" {
    fake_systemctl "sshd.service" "active" "enabled"
    patch_and_run "SV_261328r996453_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-025 FAIL: sshd service inactive" {
    fake_systemctl "sshd.service" "inactive" "disabled"
    patch_and_run "SV_261328r996453_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-026 PASS: SSH PermitEmptyPasswords no + PermitUserEnvironment no" {
    fake_file "/etc/ssh/sshd_config" "PermitEmptyPasswords no
PermitUserEnvironment no"
    patch_and_run "SV_261330r996457_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-026 FAIL: only PermitEmptyPasswords no" {
    fake_file "/etc/ssh/sshd_config" "PermitEmptyPasswords no"
    patch_and_run "SV_261330r996457_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-026 FAIL: both SSH settings missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261330r996457_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-027 PASS: ClientAliveInterval 600" {
    fake_file "/etc/ssh/sshd_config" "ClientAliveInterval 600"
    patch_and_run "SV_261332r996462_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-027 FAIL: ClientAliveInterval 300" {
    fake_file "/etc/ssh/sshd_config" "ClientAliveInterval 300"
    patch_and_run "SV_261332r996462_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-027 FAIL: ClientAliveInterval missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261332r996462_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-028 PASS: SSH Ciphers correct" {
    fake_file "/etc/ssh/sshd_config" "Ciphers aes256-ctr,aes192-ctr,aes128-ctr"
    patch_and_run "SV_261334r996467_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-028 FAIL: SSH weak Ciphers" {
    fake_file "/etc/ssh/sshd_config" "Ciphers aes256-cbc,aes128-cbc"
    patch_and_run "SV_261334r996467_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-028 FAIL: SSH Ciphers missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261334r996467_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-029 PASS: SSH MACs correct" {
    fake_file "/etc/ssh/sshd_config" "MACs hmac-sha2-512,hmac-sha2-256"
    patch_and_run "SV_261335r996469_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-029 FAIL: SSH weak MACs" {
    fake_file "/etc/ssh/sshd_config" "MACs hmac-md5,hmac-sha1"
    patch_and_run "SV_261335r996469_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-030 PASS: SSH PermitRootLogin no" {
    fake_file "/etc/ssh/sshd_config" "PermitRootLogin no"
    patch_and_run "SV_261337r996844_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-030 FAIL: SSH PermitRootLogin yes" {
    fake_file "/etc/ssh/sshd_config" "PermitRootLogin yes"
    patch_and_run "SV_261337r996844_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-030 FAIL: SSH PermitRootLogin missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261337r996844_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-031 PASS: SSH LogLevel VERBOSE" {
    fake_file "/etc/ssh/sshd_config" "LogLevel VERBOSE"
    patch_and_run "SV_261338r996845_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-031 FAIL: SSH LogLevel INFO" {
    fake_file "/etc/ssh/sshd_config" "LogLevel INFO"
    patch_and_run "SV_261338r996845_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-031 FAIL: SSH LogLevel missing" {
    fake_file "/etc/ssh/sshd_config" "Port 22"
    patch_and_run "SV_261338r996845_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-032 PASS: SSH PrintLastLog yes" {
    fake_file "/etc/ssh/sshd_config" "PrintLastLog yes"
    patch_and_run "SV_261339r996480_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-032 FAIL: SSH PrintLastLog no" {
    fake_file "/etc/ssh/sshd_config" "PrintLastLog no"
    patch_and_run "SV_261339r996480_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-033 PASS: SSH host key permission denied" {
    fake_bin "ssh-keygen" 'echo "Permission denied" >&2; exit 1'
    patch_and_run "SV_261342r996488_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-033 FAIL: SSH host key accessible" {
    fake_bin "ssh-keygen" 'echo "ssh-dss AAAAB3NzaC1kc3MAAACB..."; exit 0'
    patch_and_run "SV_261342r996488_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
