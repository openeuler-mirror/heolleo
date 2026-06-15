#!/usr/bin/env bash

load '../test_helper'

@test "TC-044 PASS: chacl audit rule present and uncommented" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/usr/bin/chacl -F perm=x -F auid>=1000 -F auid!=4294967295 -k perm_chacl"
    patch_and_run "SV_261425r996682_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-044 FAIL: chacl audit rule commented" {
    fake_file "/etc/audit/rules.d/audit.rules" "# -a always,exit -F path=/usr/bin/chacl -F perm=x -F auid>=1000 -F auid!=4294967295 -k perm_chacl"
    patch_and_run "SV_261425r996682_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-044 FAIL: chacl audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/usr/bin/passwd -k identity"
    patch_and_run "SV_261425r996682_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-045 PASS: modprobe audit rule present and uncommented" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/sbin/modprobe -F perm=x -F auid>=1000 -F auid!=4294967295 -k modules"
    patch_and_run "SV_261435r996712_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-045 FAIL: modprobe audit rule commented" {
    fake_file "/etc/audit/rules.d/audit.rules" "# -a always,exit -F path=/sbin/modprobe -F perm=x -k modules"
    patch_and_run "SV_261435r996712_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-045 FAIL: modprobe audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/usr/bin/passwd -k identity"
    patch_and_run "SV_261435r996712_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-046 PASS: shadow audit rule present and uncommented" {
    fake_file "/etc/audit/rules.d/audit.rules" "-w /etc/shadow -p wa -k identity"
    patch_and_run "SV_261452r996763_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-046 FAIL: shadow audit rule commented" {
    fake_file "/etc/audit/rules.d/audit.rules" "# -w /etc/shadow -p wa -k identity"
    patch_and_run "SV_261452r996763_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-046 FAIL: shadow audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-w /etc/passwd -p wa -k identity"
    patch_and_run "SV_261452r996763_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-047 PASS: chmod audit rule with b32 and b64" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F arch=b32 -S chmod,fchmod,fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_chmod
-a always,exit -F arch=b64 -S chmod,fchmod,fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_chmod"
    patch_and_run "SV_261453r996848_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-047 FAIL: chmod audit rule only b32" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F arch=b32 -S chmod,fchmod,fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_chmod"
    patch_and_run "SV_261453r996848_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-047 FAIL: chmod audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-w /etc/passwd -p wa -k identity"
    patch_and_run "SV_261453r996848_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-048 PASS: mount audit rule with b32 and b64" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F arch=b32 -S mount -F auid>=1000 -F auid!=4294967295 -k mounts
-a always,exit -F arch=b64 -S mount -F auid>=1000 -F auid!=4294967295 -k mounts"
    patch_and_run "SV_261458r996781_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-048 FAIL: mount audit rule only b64" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F arch=b64 -S mount -F auid>=1000 -F auid!=4294967295 -k mounts"
    patch_and_run "SV_261458r996781_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-048 FAIL: mount audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-w /etc/passwd -p wa -k identity"
    patch_and_run "SV_261458r996781_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-049 PASS: extended attribute audit rule with b32 and b64" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F arch=b32 -S setxattr,fsetxattr,lsetxattr,removexattr,fremovexattr,lremovexattr -F auid>=1000 -F auid!=4294967295 -k perm_xattr
-a always,exit -F arch=b64 -S setxattr,fsetxattr,lsetxattr,removexattr,fremovexattr,lremovexattr -F auid>=1000 -F auid!=4294967295 -k perm_xattr"
    patch_and_run "SV_261459r996784_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-049 FAIL: extended attribute audit rule only b32" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F arch=b32 -S setxattr,fsetxattr,lsetxattr,removexattr,fremovexattr,lremovexattr -k perm_xattr"
    patch_and_run "SV_261459r996784_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-050 PASS: setfiles audit rule present and uncommented" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/usr/sbin/setfiles -F perm=x -F auid>=1000 -F auid!=4294967295 -k selinux"
    patch_and_run "SV_261466r996805_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-050 FAIL: setfiles audit rule commented" {
    fake_file "/etc/audit/rules.d/audit.rules" "# -a always,exit -F path=/usr/sbin/setfiles -F perm=x -k selinux"
    patch_and_run "SV_261466r996805_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-050 FAIL: setfiles audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-w /etc/passwd -p wa -k identity"
    patch_and_run "SV_261466r996805_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-051 PASS: semanage audit rule present and uncommented" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/usr/sbin/semanage -F perm=x -F auid>=1000 -F auid!=4294967295 -k selinux"
    patch_and_run "SV_261467r996808_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-051 FAIL: semanage audit rule commented" {
    fake_file "/etc/audit/rules.d/audit.rules" "# -a always,exit -F path=/usr/sbin/semanage -F perm=x -k selinux"
    patch_and_run "SV_261467r996808_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-051 FAIL: semanage audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-w /etc/passwd -p wa -k identity"
    patch_and_run "SV_261467r996808_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-052 PASS: FIPS mode enabled" {
    fake_file "/proc/sys/crypto/fips_enabled" "1"
    patch_and_run "SV_261473r996824_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-052 FAIL: FIPS mode disabled" {
    fake_file "/proc/sys/crypto/fips_enabled" "0"
    patch_and_run "SV_261473r996824_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
