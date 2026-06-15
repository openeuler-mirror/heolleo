#!/usr/bin/env bash

load '../test_helper'

@test "TC-INT-001: full SSH hardening scan - all PASS" {
    fake_file "/etc/ssh/sshd_config" "PermitRootLogin no
PermitEmptyPasswords no
PermitUserEnvironment no
ClientAliveInterval 600
Ciphers aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-512,hmac-sha2-256
LogLevel VERBOSE
PrintLastLog yes"
    fake_systemctl "sshd.service" "active" "enabled"
    touch "${FAKE_ROOT}/usr/bin/ssh-keygen"
    chmod +x "${FAKE_ROOT}/usr/bin/ssh-keygen"
    fake_bin "ssh-keygen" 'echo "Permission denied" >&2; exit 1'

    patch_and_run "SV_261327r996450_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261328r996453_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261330r996457_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261332r996462_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261334r996467_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261335r996469_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261337r996844_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261338r996845_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261339r996480_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-INT-002: full SSH hardening scan - multiple FAIL" {
    fake_file "/etc/ssh/sshd_config" "PermitRootLogin yes
ClientAliveInterval 300
LogLevel INFO"
    fake_systemctl "sshd.service" "inactive" "disabled"

    patch_and_run "SV_261328r996453_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]

    patch_and_run "SV_261337r996844_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]

    patch_and_run "SV_261332r996462_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]

    patch_and_run "SV_261338r996845_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-INT-003: kernel parameter consistency scan" {
    fake_sysctl_n "kernel.randomize_va_space" "2"
    patch_and_run "SV_261271r996306_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    fake_sysctl_full "net.ipv6.conf.default.accept_source_route" "0"
    patch_and_run "SV_261322r996436_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-INT-004: audit system full scan - all PASS" {
    fake_systemctl "auditd.service" "active" "enabled"
    fake_bin "auditctl" 'echo "auditctl version 3.0"; exit 0'
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/usr/bin/chacl -F perm=x -F auid>=1000 -F auid!=4294967295 -k perm_chacl
-a always,exit -F path=/sbin/modprobe -F perm=x -F auid>=1000 -F auid!=4294967295 -k modules
-w /etc/shadow -p wa -k identity
-a always,exit -F arch=b32 -S chmod,fchmod,fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_chmod
-a always,exit -F arch=b64 -S chmod,fchmod,fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_chmod
-a always,exit -F arch=b32 -S mount -F auid>=1000 -F auid!=4294967295 -k mounts
-a always,exit -F arch=b64 -S mount -F auid>=1000 -F auid!=4294967295 -k mounts"
    fake_file "/etc/audisp/audisp-remote.conf" "disk_full_action = syslog"
    fake_file "/etc/audit/audisp-remote.conf" "enable_krb5 = yes"

    patch_and_run "SV_261410r996645_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261411r996646_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261417r996662_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261421r996672_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-INT-005: password policy consistency scan" {
    fake_file "/etc/pam.d/common-password" "password requisite pam_pwquality.so ucredit=-1 lcredit=-1 dcredit=-1 ocredit=-1 minlen=15"
    fake_file "/etc/login.defs" "ENCRYPT_METHOD SHA512
SHA_CRYPT_MAX_ROUNDS 5000
SHA_CRYPT_MIN_ROUNDS 5000"
    touch "${FAKE_ROOT}/etc/security/opasswd"

    patch_and_run "SV_261377r996566_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261378r996568_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261390r996595_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261391r996598_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261392r996600_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-INT-006: SELinux + FIPS combined scan" {
    fake_file "/etc/selinux/config" "SELINUX=enforcing
SELINUXTYPE=targeted"
    fake_file "/proc/sys/crypto/fips_enabled" "1"

    patch_and_run "SV_261369r996549_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261370r996551_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]

    patch_and_run "SV_261473r996824_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}
