#!/usr/bin/env bash

XCCDF_RESULT_PASS=102
XCCDF_RESULT_FAIL=101
XCCDF_RESULT_NOT_CHECKED=99

SCRIPTS_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")" && pwd)/../../scripts/scripts"
PROJECT_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")" && pwd)/../.."

setup() {
    export FAKE_ROOT="$(mktemp -d /tmp/scap_ut_XXXXXX)"
    export XCCDF_RESULT_PASS=102
    export XCCDF_RESULT_FAIL=101
    export XCCDF_RESULT_NOT_CHECKED=99
    mkdir -p "${FAKE_ROOT}/bin"
    mkdir -p "${FAKE_ROOT}/etc/ssh"
    mkdir -p "${FAKE_ROOT}/etc/pam.d"
    mkdir -p "${FAKE_ROOT}/etc/audit/rules.d"
    mkdir -p "${FAKE_ROOT}/etc/audisp"
    mkdir -p "${FAKE_ROOT}/etc/security"
    mkdir -p "${FAKE_ROOT}/etc/selinux"
    mkdir -p "${FAKE_ROOT}/etc/sudoers.d"
    mkdir -p "${FAKE_ROOT}/etc/skel"
    mkdir -p "${FAKE_ROOT}/boot/grub2"
    mkdir -p "${FAKE_ROOT}/boot/efi/EFI/openEuler"
    mkdir -p "${FAKE_ROOT}/lib"
    mkdir -p "${FAKE_ROOT}/lib64"
    mkdir -p "${FAKE_ROOT}/usr/lib"
    mkdir -p "${FAKE_ROOT}/usr/lib64"
    mkdir -p "${FAKE_ROOT}/usr/local/bin"
    mkdir -p "${FAKE_ROOT}/usr/local/sbin"
    mkdir -p "${FAKE_ROOT}/usr/sbin"
    mkdir -p "${FAKE_ROOT}/usr/bin"
    mkdir -p "${FAKE_ROOT}/proc/sys/crypto"
    mkdir -p "${FAKE_ROOT}/home"
    mkdir -p "${FAKE_ROOT}/root"
    mkdir -p "${FAKE_ROOT}/sbin"
}

teardown() {
    rm -rf "${FAKE_ROOT}"
}

fake_file() {
    local filepath="$1"
    local content="$2"
    local full_path="${FAKE_ROOT}${filepath}"
    mkdir -p "$(dirname "${full_path}")"
    printf '%s\n' "${content}" > "${full_path}"
}

fake_bin() {
    local name="$1"
    shift
    local content="$*"
    printf '#!/usr/bin/env bash\n%s\n' "${content}" > "${FAKE_ROOT}/bin/${name}"
    chmod +x "${FAKE_ROOT}/bin/${name}"
}

fake_sysctl_n() {
    local param="$1"
    local value="$2"
    cat > "${FAKE_ROOT}/bin/sysctl" << SYSCTL_EOF
#!/usr/bin/env bash
if [ "\$1" = "-n" ]; then
    shift
fi
case "\$*" in
${param})
    echo "${value}"
    exit 0
    ;;
*)
    echo "sysctl: cannot stat /proc/sys/\${1//\\//.}: No such file or directory" >&2
    exit 1
    ;;
esac
SYSCTL_EOF
    chmod +x "${FAKE_ROOT}/bin/sysctl"
}

fake_sysctl_full() {
    local param="$1"
    local value="$2"
    cat > "${FAKE_ROOT}/bin/sysctl" << SYSCTL_EOF
#!/usr/bin/env bash
if [ "\$1" = "-n" ]; then
    shift
fi
case "\$*" in
${param})
    echo "${param} = ${value}"
    exit 0
    ;;
*)
    echo "sysctl: cannot stat /proc/sys/\${1//\\//.}: No such file or directory" >&2
    exit 1
    ;;
esac
SYSCTL_EOF
    chmod +x "${FAKE_ROOT}/bin/sysctl"
}

fake_systemctl() {
    local unit="$1"
    local active="$2"
    local enabled="$3"
    cat > "${FAKE_ROOT}/bin/systemctl" << CTL_EOF
#!/usr/bin/env bash
case "\$1" in
    is-active)
        if [ "\$2" = "${unit}" ]; then
            echo "${active}"
            [ "${active}" = "active" ] && exit 0 || exit 3
        fi
        ;;
    is-enabled)
        if [ "\$2" = "${unit}" ]; then
            echo "${enabled}"
            [ "${enabled}" = "enabled" ] && exit 0 || exit 1
        fi
        ;;
    status)
        if [ "\$2" = "${unit}" ]; then
            if [ "${active}" = "masked" ]; then
                echo "masked"
                exit 0
            elif [ "${active}" = "not-found" ]; then
                echo "Unit ${unit} could not be found"
                exit 4
            elif [ "${active}" = "active" ]; then
                echo "active (running)"
                exit 0
            else
                echo "inactive (dead)"
                exit 3
            fi
        fi
        ;;
esac
exit 1
CTL_EOF
    chmod +x "${FAKE_ROOT}/bin/systemctl"
}

patch_and_run() {
    local script_name="$1"
    local script_path="${SCRIPTS_DIR}/${script_name}"
    [ ! -f "${script_path}" ] && script_path="${SCRIPTS_DIR}/${script_name}"
    local patched_file="${FAKE_ROOT}/.patched_script.sh"
    sed \
        -e "s|/etc/|${FAKE_ROOT}/etc/|g" \
        -e "s|/boot/|${FAKE_ROOT}/boot/|g" \
        -e "s|/proc/|${FAKE_ROOT}/proc/|g" \
        -e "s|/lib64/|${FAKE_ROOT}/lib64/|g" \
        -e "s|/lib/|${FAKE_ROOT}/lib/|g" \
        -e "s|/usr/lib64|${FAKE_ROOT}/usr/lib64|g" \
        -e "s|/usr/lib|${FAKE_ROOT}/usr/lib|g" \
        -e "s|/usr/local/|${FAKE_ROOT}/usr/local/|g" \
        -e "s|/usr/sbin/|${FAKE_ROOT}/usr/sbin/|g" \
        -e "s|/usr/bin/|${FAKE_ROOT}/usr/bin/|g" \
        -e "s|/home |${FAKE_ROOT}/home |g" \
        -e "s|/home$|${FAKE_ROOT}/home|g" \
        -e "s|/sbin/|${FAKE_ROOT}/sbin/|g" \
        -e "s|/root|${FAKE_ROOT}/root|g" \
        "${script_path}" > "${patched_file}"
    chmod +x "${patched_file}"
    run env \
        XCCDF_RESULT_PASS="${XCCDF_RESULT_PASS}" \
        XCCDF_RESULT_FAIL="${XCCDF_RESULT_FAIL}" \
        XCCDF_RESULT_NOT_CHECKED="${XCCDF_RESULT_NOT_CHECKED}" \
        PATH="${FAKE_ROOT}/bin:${PATH}" \
        bash "${patched_file}"
}
