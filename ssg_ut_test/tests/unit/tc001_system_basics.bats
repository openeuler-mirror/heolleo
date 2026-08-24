#!/usr/bin/env bash

load '../test_helper'

@test "TC-001 PASS: KubeOS detected" {
    fake_file "/etc/os-release" 'NAME="KubeOS"
VERSION="1.0"
ID=kubeos'
    patch_and_run "SV_261263r996826_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-001 FAIL: not KubeOS" {
    fake_file "/etc/os-release" 'NAME="openEuler"
VERSION="22.03"'
    patch_and_run "SV_261263r996826_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
    echo "$output" | grep -qi "not KubeOS"
}

@test "TC-002 NOT_CHECKED: terminal security tools" {
    patch_and_run "SV_261264r995659_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_NOT_CHECKED" ]
    echo "$output" | grep -qi "Question"
}

@test "TC-003 FAIL: no DOD banner" {
    fake_file "/etc/issue" "Welcome to openEuler"
    patch_and_run "SV_261265r996289_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-003 FAIL: empty /etc/issue" {
    fake_file "/etc/issue" ""
    patch_and_run "SV_261265r996289_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-004 PASS: ctrl-alt-del.target is masked" {
    fake_systemctl "ctrl-alt-del.target" "masked" ""
    patch_and_run "SV_261266r996292_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-004 FAIL: ctrl-alt-del.target is not masked" {
    fake_systemctl "ctrl-alt-del.target" "active" "enabled"
    patch_and_run "SV_261266r996292_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-005 PASS: GRUB2 UEFI password_pbkdf2 present" {
    fake_file "/boot/efi/EFI/openEuler/grub.cfg" 'set superusers="root"
password_pbkdf2 root grub.pbkdf2.sha512.10000.xxx'
    patch_and_run "SV_261268r996298_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-005 FAIL: GRUB2 UEFI no password_pbkdf2" {
    fake_file "/boot/efi/EFI/openEuler/grub.cfg" 'set default=0'
    patch_and_run "SV_261268r996298_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-006 PASS: kdump service not installed" {
    fake_systemctl "kdump.service" "not-found" ""
    patch_and_run "SV_261270r996860_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-006 FAIL: kdump service installed" {
    fake_systemctl "kdump.service" "active" "enabled"
    patch_and_run "SV_261270r996860_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
