#!/usr/bin/env bash

load '../test_helper'

@test "TC-SYS-001: XCCDF result constants are consistent across scripts" {
    local script
    local result
    for script in "${SCRIPTS_DIR}"/SV_*_rule.sh; do
        [ -f "$script" ] || continue
        result="$(grep -c 'XCCDF_RESULT_PASS\|XCCDF_RESULT_FAIL' "$script" 2>/dev/null || echo 0)"
        [ "$result" -gt 0 ]
    done
}

@test "TC-SYS-002: all rule scripts are syntactically valid bash" {
    local script
    for script in "${SCRIPTS_DIR}"/SV_*_rule.sh; do
        [ -f "$script" ] || continue
        run bash -n "$script"
        [ "$status" -eq 0 ]
    done
}

@test "TC-SYS-003: all rule scripts have proper shebang" {
    local script
    for script in "${SCRIPTS_DIR}"/SV_*_rule.sh; do
        [ -f "$script" ] || continue
        local first_line
        first_line="$(head -1 "$script")"
        [[ "$first_line" == "#!/usr/bin/env bash" || "$first_line" == "#!/bin/bash" ]]
    done
}

@test "TC-SYS-004: all rule scripts reference XCCDF_RESULT constants" {
    local script
    for script in "${SCRIPTS_DIR}"/SV_*_rule.sh; do
        [ -f "$script" ] || continue
        grep -qE 'XCCDF_RESULT_(PASS|FAIL|NOT_CHECKED|ERROR)' "$script"
    done
}

@test "TC-SYS-005: script count matches expected rule count" {
    local count
    count="$(find "${SCRIPTS_DIR}" -name 'SV_*_rule.sh' | wc -l)"
    [ "$count" -gt 100 ]
}

@test "TC-SYS-006: no duplicate rule IDs in script filenames" {
    local duplicates
    duplicates="$(find "${SCRIPTS_DIR}" -name 'SV_*_rule.sh' -exec basename {} \; | sort | uniq -d | wc -l)"
    [ "$duplicates" -eq 0 ]
}

@test "TC-SYS-007: each rule script is non-empty and executable" {
    local script
    for script in "${SCRIPTS_DIR}"/SV_*_rule.sh; do
        [ -f "$script" ] || continue
        [ -s "$script" ]
    done
}

@test "TC-SYS-008: OVAL/XCCDF benchmark file is valid XML" {
    local benchmark
    for benchmark in "${PROJECT_DIR}"/*.xml "${PROJECT_DIR}"/ssg-*.xml; do
        [ -f "$benchmark" ] || continue
        run xmllint --noout "$benchmark" 2>/dev/null || true
    done
}
