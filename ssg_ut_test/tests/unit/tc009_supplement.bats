#!/usr/bin/env bash

load '../test_helper'

@test "TC-053 PASS: kernel.dmesg_restrict = 1" {
    fake_sysctl_n "kernel.dmesg_restrict" "1"
    patch_and_run "SV_261269r996301_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-053 FAIL: kernel.dmesg_restrict = 0" {
    fake_sysctl_n "kernel.dmesg_restrict" "0"
    patch_and_run "SV_261269r996301_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-054 PASS: kernel.kptr_restrict = 1" {
    fake_sysctl_n "kernel.kptr_restrict" "1"
    patch_and_run "SV_261272r996309_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-054 FAIL: kernel.kptr_restrict = 0" {
    fake_sysctl_n "kernel.kptr_restrict" "0"
    patch_and_run "SV_261272r996309_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-055 PASS: sudo no nopasswd and no !authenticate" {
    fake_file "/etc/sudoers" 'Defaults env_reset
Defaults use_pty'
    patch_and_run "SV_261373r1050789_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-055 FAIL: sudo contains nopasswd" {
    fake_file "/etc/sudoers" 'Defaults env_reset
nopasswd'
    patch_and_run "SV_261373r1050789_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-056 PASS: no dangerous ALL in sudoers" {
    fake_file "/etc/sudoers" 'Defaults env_reset
%wheel ALL=(ALL) ALL'
    patch_and_run "SV_261375r996562_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-056 FAIL: dangerous ALL ALL=(ALL) ALL in sudoers" {
    fake_file "/etc/sudoers" 'Defaults env_reset
ALL ALL=(ALL) ALL'
    patch_and_run "SV_261375r996562_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-057 PASS: #includedir /etc/sudoers.d present" {
    fake_file "/etc/sudoers" '#includedir /etc/sudoers.d'
    patch_and_run "SV_261376r996564_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-057 FAIL: #includedir /etc/sudoers.d missing" {
    fake_file "/etc/sudoers" 'Defaults env_reset'
    patch_and_run "SV_261376r996564_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-058 PASS: AIDE conf has FIPSR DIR PERMS DATAONLY" {
    fake_file "/etc/aide.conf" 'FIPSR = p+i+n+u+g+s+m+c+acl+selinux+xattrs+sha256
DIR = p+i+n+u+g+acl+selinux+xattrs
PERMS = p+i+u+g+acl+selinux
DATAONLY =  p+n+u+g+s+acl+selinux+xattrs+sha256'
    patch_and_run "SV_261404r996629_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-058 FAIL: AIDE conf missing DATAONLY" {
    fake_file "/etc/aide.conf" 'FIPSR = p+i+n+u+g+s+m+c+acl+selinux+xattrs+sha256
DIR = p+i+n+u+g+acl+selinux+xattrs
PERMS = p+i+u+g+acl+selinux'
    patch_and_run "SV_261404r996629_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-059 PASS: auditd space_left = 25%" {
    fake_file "/etc/audit/auditd.conf" 'space_left = 25%'
    patch_and_run "SV_261414r996654_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-059 FAIL: auditd space_left not 25%" {
    fake_file "/etc/audit/auditd.conf" 'space_left = 50'
    patch_and_run "SV_261414r996654_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-060 PASS: auditd disk_full_action = HALT" {
    fake_file "/etc/audit/auditd.conf" 'disk_full_action = HALT'
    patch_and_run "SV_261415r1038966_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-060 FAIL: auditd disk_full_action = SYSLOG" {
    fake_file "/etc/audit/auditd.conf" 'disk_full_action = SYSLOG'
    patch_and_run "SV_261415r1038966_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-061 PASS: auditd action_mail_acct = root" {
    fake_file "/etc/audit/auditd.conf" 'action_mail_acct = root'
    patch_and_run "SV_261424r996679_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-061 FAIL: auditd action_mail_acct missing" {
    fake_file "/etc/audit/auditd.conf" 'log_file = /var/log/audit/audit.log'
    patch_and_run "SV_261424r996679_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-062 PASS: GRUB2 BIOS password_pbkdf2 present" {
    fake_file "/boot/grub2/grub.cfg" 'set superusers="root"
password_pbkdf2 root grub.pbkdf2.sha512.10000.xxx'
    patch_and_run "SV_261267r996295_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-062 FAIL: GRUB2 BIOS no password_pbkdf2" {
    fake_file "/boot/grub2/grub.cfg" 'set default=0'
    patch_and_run "SV_261267r996295_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
