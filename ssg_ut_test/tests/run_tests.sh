#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BATS_VERSION="1.11.0"
BATS_DIR="${PROJECT_DIR}/.bats"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ensure_bats() {
    if command -v bats &>/dev/null; then
        echo -e "${GREEN}[INFO] bats already installed: $(bats --version 2>&1 | head -1)${NC}"
        return 0
    fi

    if [ -x "${BATS_DIR}/bin/bats" ]; then
        echo -e "${GREEN}[INFO] bats found at ${BATS_DIR}${NC}"
        export PATH="${BATS_DIR}/bin:${PATH}"
        return 0
    fi

    echo -e "${YELLOW}[INFO] Installing bats ${BATS_VERSION}...${NC}"
    mkdir -p "${BATS_DIR}"
    git clone --depth 1 --branch "v${BATS_VERSION}" https://github.com/bats-core/bats-core.git "${BATS_DIR}/bats-core" 2>/dev/null
    "${BATS_DIR}/bats-core/install.sh" "${BATS_DIR}"
    rm -rf "${BATS_DIR}/bats-core"
    export PATH="${BATS_DIR}/bin:${PATH}"
    echo -e "${GREEN}[INFO] bats ${BATS_VERSION} installed${NC}"
}

run_unit_tests() {
    echo -e "${YELLOW}[UNIT] Running unit tests...${NC}"
    local unit_files=("${SCRIPT_DIR}/unit/"*.bats)
    bats --recursive "${SCRIPT_DIR}/unit/" 2>&1
}

run_integration_tests() {
    echo -e "${YELLOW}[INTEGRATION] Running integration tests...${NC}"
    bats "${SCRIPT_DIR}/integration/" 2>&1
}

run_system_tests() {
    echo -e "${YELLOW}[SYSTEM] Running system tests...${NC}"
    bats "${SCRIPT_DIR}/system/" 2>&1
}

run_all_tests() {
    echo -e "${YELLOW}[ALL] Running all tests...${NC}"
    bats --recursive "${SCRIPT_DIR}/" 2>&1
}

main() {
    ensure_bats

    local target="${1:-all}"
    local exit_code=0

    case "$target" in
        unit)
            run_unit_tests || exit_code=$?
            ;;
        integration)
            run_integration_tests || exit_code=$?
            ;;
        system)
            run_system_tests || exit_code=$?
            ;;
        all)
            run_all_tests || exit_code=$?
            ;;
        *)
            echo "Usage: $0 {unit|integration|system|all}"
            exit 1
            ;;
    esac

    if [ "$exit_code" -eq 0 ]; then
        echo -e "${GREEN}[PASS] All tests passed!${NC}"
    else
        echo -e "${RED}[FAIL] Some tests failed (exit code: ${exit_code})${NC}"
    fi

    exit "$exit_code"
}

main "$@"
