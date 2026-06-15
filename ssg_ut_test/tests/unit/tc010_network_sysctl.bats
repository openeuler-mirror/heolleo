#!/usr/bin/env bash

load '../test_helper'

@test "TC-063 PASS: net.ipv4.conf.all.accept_source_route = 0" {
    fake_sysctl_full "net.ipv4.conf.all.accept_source_route" "0"
    patch_and_run "SV_261313r996409_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-063 FAIL: net.ipv4.conf.all.accept_source_route = 1" {
    fake_sysctl_full "net.ipv4.conf.all.accept_source_route" "1"
    patch_and_run "SV_261313r996409_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-064 PASS: net.ipv4.conf.default.accept_source_route = 0" {
    fake_sysctl_full "net.ipv4.conf.default.accept_source_route" "0"
    patch_and_run "SV_261314r996412_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-064 FAIL: net.ipv4.conf.default.accept_source_route = 1" {
    fake_sysctl_full "net.ipv4.conf.default.accept_source_route" "1"
    patch_and_run "SV_261314r996412_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-065 PASS: net.ipv4.conf.all.accept_redirects = 0" {
    fake_sysctl_full "net.ipv4.conf.all.accept_redirects" "0"
    patch_and_run "SV_261315r996415_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-065 FAIL: net.ipv4.conf.all.accept_redirects = 1" {
    fake_sysctl_full "net.ipv4.conf.all.accept_redirects" "1"
    patch_and_run "SV_261315r996415_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-066 PASS: net.ipv4.conf.default.accept_redirects = 0" {
    fake_sysctl_full "net.ipv4.conf.default.accept_redirects" "0"
    patch_and_run "SV_261316r996418_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-066 FAIL: net.ipv4.conf.default.accept_redirects = 1" {
    fake_sysctl_full "net.ipv4.conf.default.accept_redirects" "1"
    patch_and_run "SV_261316r996418_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-067 PASS: net.ipv4.conf.all.send_redirects = 0" {
    fake_sysctl_n "net.ipv4.conf.all.send_redirects" "0"
    patch_and_run "SV_261317r996421_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-067 FAIL: net.ipv4.conf.all.send_redirects = 1" {
    fake_sysctl_n "net.ipv4.conf.all.send_redirects" "1"
    patch_and_run "SV_261317r996421_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-068 PASS: net.ipv4.conf.default.send_redirects = 0" {
    fake_sysctl_n "net.ipv4.conf.default.send_redirects" "0"
    patch_and_run "SV_261318r996424_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-068 FAIL: net.ipv4.conf.default.send_redirects = 1" {
    fake_sysctl_n "net.ipv4.conf.default.send_redirects" "1"
    patch_and_run "SV_261318r996424_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-069 PASS: net.ipv4.ip_forward = 0" {
    fake_sysctl_n "net.ipv4.ip_forward" "0"
    patch_and_run "SV_261319r996427_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-069 FAIL: net.ipv4.ip_forward = 1" {
    fake_sysctl_n "net.ipv4.ip_forward" "1"
    patch_and_run "SV_261319r996427_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-070 PASS: net.ipv4.tcp_syncookies = 1" {
    fake_sysctl_full "net.ipv4.tcp_syncookies" "1"
    patch_and_run "SV_261320r996861_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-070 FAIL: net.ipv4.tcp_syncookies = 0" {
    fake_sysctl_full "net.ipv4.tcp_syncookies" "0"
    patch_and_run "SV_261320r996861_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-071 PASS: net.ipv6.conf.all.accept_source_route = 0" {
    fake_sysctl_n "net.ipv6.conf.all.accept_source_route" "0"
    patch_and_run "SV_261321r996433_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-071 FAIL: net.ipv6.conf.all.accept_source_route = 1" {
    fake_sysctl_n "net.ipv6.conf.all.accept_source_route" "1"
    patch_and_run "SV_261321r996433_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-072 PASS: net.ipv6.conf.all.accept_redirects = 0" {
    fake_sysctl_full "net.ipv6.conf.all.accept_redirects" "0"
    patch_and_run "SV_261323r996439_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-072 FAIL: net.ipv6.conf.all.accept_redirects = 1" {
    fake_sysctl_full "net.ipv6.conf.all.accept_redirects" "1"
    patch_and_run "SV_261323r996439_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-073 PASS: net.ipv6.conf.default.accept_redirects = 0" {
    fake_sysctl_full "net.ipv6.conf.default.accept_redirects" "0"
    patch_and_run "SV_261324r996442_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-073 FAIL: net.ipv6.conf.default.accept_redirects = 1" {
    fake_sysctl_full "net.ipv6.conf.default.accept_redirects" "1"
    patch_and_run "SV_261324r996442_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-074 PASS: net.ipv6.conf.all.forwarding = 0" {
    fake_sysctl_full "net.ipv6.conf.all.forwarding" "0"
    patch_and_run "SV_261325r996445_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-074 FAIL: net.ipv6.conf.all.forwarding = 1" {
    fake_sysctl_full "net.ipv6.conf.all.forwarding" "1"
    patch_and_run "SV_261325r996445_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}

@test "TC-075 PASS: net.ipv6.conf.default.forwarding = 0" {
    fake_sysctl_full "net.ipv6.conf.default.forwarding" "0"
    patch_and_run "SV_261326r996448_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_PASS" ]
}

@test "TC-075 FAIL: net.ipv6.conf.default.forwarding = 1" {
    fake_sysctl_full "net.ipv6.conf.default.forwarding" "1"
    patch_and_run "SV_261326r996448_rule.sh"
    [ "$status" -eq "$XCCDF_RESULT_FAIL" ]
}
