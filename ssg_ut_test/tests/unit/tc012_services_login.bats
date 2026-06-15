#!/usr/bin/env bash

load '../test_helper'

@test "TC-083 PASS: vlock installed" {
    fake_bin "vlock" 'exit 0'
    patch_and_run "SV_261276r996316_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-083 FAIL: vlock not installed" {
    fake_bin "vlock" 'echo "vlock: command not found" >&2; exit 127'
    patch_and_run "SV_261276r996316_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-084 PASS: autofs inactive and disabled" {
    fake_systemctl "autofs" "inactive" "disabled"
    patch_and_run "SV_261286r996338_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-084 FAIL: autofs active and enabled" {
    fake_systemctl "autofs" "active" "enabled"
    patch_and_run "SV_261286r996338_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-085 PASS: firewalld active and enabled" {
    fake_systemctl "firewalld.service" "active" "enabled"
    patch_and_run "SV_261310r996401_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-085 FAIL: firewalld inactive" {
    fake_systemctl "firewalld.service" "inactive" "disabled"
    patch_and_run "SV_261310r996401_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-086 PASS: CREATE_HOME yes in login.defs" {
    fake_file "/etc/login.defs" "CREATE_HOME yes"
    patch_and_run "SV_261348r996500_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-086 FAIL: CREATE_HOME missing in login.defs" {
    fake_file "/etc/login.defs" "PASS_MAX_DAYS 90"
    patch_and_run "SV_261348r996500_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-087 PASS: UMASK 077 in login.defs" {
    fake_file "/etc/login.defs" "UMASK 077"
    patch_and_run "SV_261349r996502_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-087 FAIL: UMASK 022 in login.defs" {
    fake_file "/etc/login.defs" "UMASK 022"
    patch_and_run "SV_261349r996502_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-088 PASS: fail_delay 5 in login.defs" {
    fake_file "/etc/login.defs" "fail_delay 5"
    patch_and_run "SV_261350r996504_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-088 FAIL: fail_delay missing in login.defs" {
    fake_file "/etc/login.defs" "PASS_MAX_DAYS 90"
    patch_and_run "SV_261350r996504_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-089 PASS: INACTIVE=35 in useradd" {
    fake_file "/etc/default/useradd" "INACTIVE=35"
    patch_and_run "SV_261360r996529_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-089 FAIL: INACTIVE missing in useradd" {
    fake_file "/etc/default/useradd" "SHELL=/bin/bash"
    patch_and_run "SV_261360r996529_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-090 PASS: no duplicate UIDs in passwd" {
    fake_file "/etc/passwd" "root:x:0:0:root:/root:/bin/bash
nobody:x:65534:65534:Nobody:/:/sbin/nologin"
    patch_and_run "SV_261361r996530_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-090 FAIL: duplicate UIDs in passwd" {
    fake_file "/etc/passwd" "root:x:0:0:root:/root:/bin/bash
admin:x:0:0:Admin:/home/admin:/bin/bash"
    patch_and_run "SV_261361r996530_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-091 PASS: pam_lastlog.so showfailed in login" {
    fake_file "/etc/pam.d/login" "session required pam_lastlog.so showfailed"
    patch_and_run "SV_261362r996533_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-091 FAIL: pam_lastlog.so showfailed missing" {
    fake_file "/etc/pam.d/login" "session required pam_sepermit.so"
    patch_and_run "SV_261362r996533_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-092 PASS: TMOUT=900 with readonly and export" {
    mkdir -p "${FAKE_ROOT}/etc/profile.d"
    printf 'TMOUT=900\nreadonly TMOUT\nexport TMOUT\n' > "${FAKE_ROOT}/etc/profile.d/autologout.sh"
    patch_and_run "SV_261363r996536_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-092 FAIL: TMOUT incomplete - missing readonly" {
    mkdir -p "${FAKE_ROOT}/etc/profile.d"
    printf 'TMOUT=900\nexport TMOUT\n' > "${FAKE_ROOT}/etc/profile.d/autologout.sh"
    patch_and_run "SV_261363r996536_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-093 PASS: pam_faillock.so configured" {
    fake_file "/etc/pam.d/common-auth" "auth required pam_faillock.so onerr=fail silent audit deny=3"
    fake_file "/etc/pam.d/common-account" "account required pam_faillock.so"
    patch_and_run "SV_261364r996863_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-093 FAIL: pam_faillock.so missing in common-account" {
    fake_file "/etc/pam.d/common-auth" "auth required pam_faillock.so onerr=fail silent audit deny=3"
    fake_file "/etc/pam.d/common-account" "account required pam_unix.so"
    patch_and_run "SV_261364r996863_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-094 PASS: pam_faildelay.so delay configured" {
    fake_file "/etc/pam.d/common-auth" "auth required pam_faildelay.so delay=5000000"
    patch_and_run "SV_261365r996541_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-094 FAIL: pam_faildelay.so missing" {
    fake_file "/etc/pam.d/common-auth" "auth required pam_env.so"
    patch_and_run "SV_261365r996541_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-095 PASS: /home separate mount with nosuid" {
    fake_bin "mount" 'echo "/dev/sda2 on /home type ext4 (rw,nosuid,nodev,relatime)"'
    patch_and_run "SV_261278r996320_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-095 FAIL: /home not separate mount" {
    fake_bin "mount" 'echo ""'
    patch_and_run "SV_261278r996320_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-096 PASS: /var separate mount" {
    fake_bin "mount" 'echo "/dev/sda3 on /var type ext4 (rw,relatime)"'
    patch_and_run "SV_261279r996322_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-096 FAIL: /var not separate mount" {
    fake_bin "mount" 'echo ""'
    patch_and_run "SV_261279r996322_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-097 PASS: /var/log/audit separate mount" {
    fake_bin "mount" 'echo "/dev/sda4 on /var/log/audit type ext4 (rw,relatime)"'
    patch_and_run "SV_261280r996324_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-097 FAIL: /var/log/audit not separate mount" {
    fake_bin "mount" 'echo ""'
    patch_and_run "SV_261280r996324_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-098 PASS: /persist/nfs with nosuid" {
    fake_bin "mount" 'echo "nfs-server:/data on /persist/nfs type nfs (rw,nosuid,relatime)"'
    patch_and_run "SV_261281r996326_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-098 FAIL: /persist/nfs without nosuid" {
    fake_bin "mount" 'echo "nfs-server:/data on /persist/nfs type nfs (rw,relatime)"'
    patch_and_run "SV_261281r996326_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-099 PASS: /persist/nfs with noexec" {
    fake_bin "mount" 'echo "nfs-server:/data on /persist/nfs type nfs (rw,noexec,relatime)"'
    patch_and_run "SV_261282r996328_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-099 FAIL: /persist/nfs without noexec" {
    fake_bin "mount" 'echo "nfs-server:/data on /persist/nfs type nfs (rw,relatime)"'
    patch_and_run "SV_261282r996328_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-100 PASS: NOT_CHECKED - SV_261274" {
    patch_and_run "SV_261274r996312_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_NOT_CHECKED" ]
}

@test "TC-101 PASS: NOT_CHECKED - SV_261283" {
    patch_and_run "SV_261283r996330_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_NOT_CHECKED" ]
}

@test "TC-102 PASS: NOT_CHECKED - SV_261345 GUI login" {
    patch_and_run "SV_261345r996493_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_NOT_CHECKED" ]
}

@test "TC-103 PASS: NOT_CHECKED - SV_261346 wireless" {
    patch_and_run "SV_261346r996496_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_NOT_CHECKED" ]
}

@test "TC-104 PASS: NOT_CHECKED - SV_261347 USB" {
    patch_and_run "SV_261347r996498_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_NOT_CHECKED" ]
}

@test "TC-105 PASS: PASS_MIN_DAYS 1 in login.defs" {
    fake_file "/etc/login.defs" "PASS_MIN_DAYS 1"
    patch_and_run "SV_261394r996604_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-105 FAIL: PASS_MIN_DAYS missing" {
    fake_file "/etc/login.defs" "PASS_MAX_DAYS 90"
    patch_and_run "SV_261394r996604_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-106 PASS: AIDE cron job present" {
    mkdir -p "${FAKE_ROOT}/etc/cron.daily"
    printf '#!/bin/sh\n/usr/sbin/aide --check\n' > "${FAKE_ROOT}/etc/cron.daily/aide"
    patch_and_run "SV_261407r996637_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-106 FAIL: AIDE cron job missing" {
    patch_and_run "SV_261407r996637_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-107 PASS: au-remote active = yes" {
    mkdir -p "${FAKE_ROOT}/etc/audit/plugins.d"
    printf 'active = yes\n' > "${FAKE_ROOT}/etc/audit/plugins.d/au-remote.conf"
    patch_and_run "SV_261412r996649_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-107 FAIL: au-remote active = no" {
    mkdir -p "${FAKE_ROOT}/etc/audit/plugins.d"
    printf 'active = no\n' > "${FAKE_ROOT}/etc/audit/plugins.d/au-remote.conf"
    patch_and_run "SV_261412r996649_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-108 PASS: remote_server configured in audisp" {
    fake_file "/etc/audisp/audisp-remote.conf" "remote_server = 10.0.0.1"
    patch_and_run "SV_261422r996674_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-108 FAIL: remote_server missing in audisp" {
    fake_file "/etc/audisp/audisp-remote.conf" "queue_size = 2048"
    patch_and_run "SV_261422r996674_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-109 PASS: network_failure_action = syslog" {
    fake_file "/etc/audit/audisp-remote.conf" "network_failure_action = syslog"
    patch_and_run "SV_261416r996660_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-109 FAIL: network_failure_action missing" {
    fake_file "/etc/audit/audisp-remote.conf" "queue_size = 2048"
    patch_and_run "SV_261416r996660_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-110 PASS: postmaster: root in aliases" {
    fake_file "/etc/aliases" "postmaster: root"
    patch_and_run "SV_261423r996677_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-110 FAIL: postmaster not root in aliases" {
    fake_file "/etc/aliases" "postmaster: admin"
    patch_and_run "SV_261423r996677_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-111 PASS: chage audit rule present" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/usr/bin/chage -F perm=x -F auid>=1000 -F auid!=4294967295 -k identity"
    patch_and_run "SV_261426r996685_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-111 FAIL: chage audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-w /etc/passwd -p wa -k identity"
    patch_and_run "SV_261426r996685_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-112 PASS: chcon audit rule present" {
    fake_file "/etc/audit/rules.d/audit.rules" "-a always,exit -F path=/usr/bin/chcon -F perm=x -F auid>=1000 -F auid!=4294967295 -k perm_chcon"
    patch_and_run "SV_261427r996688_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-112 FAIL: chcon audit rule missing" {
    fake_file "/etc/audit/rules.d/audit.rules" "-w /etc/passwd -p wa -k identity"
    patch_and_run "SV_261427r996688_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
