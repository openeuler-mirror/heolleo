#!/bin/bash

set -e

packages_file="/tmp/eulerlive/packages.x86_64"

# Packages to add to the euleriso profile packages
packages=(
    gcc
    git
    pkgconfig
    python
    python-pip
    python-uv
    python-setuptools
    python-pyparted
    python-pydantic
)

mkdir -p /tmp/eulerlive/airootfs/root/eulerinstall-git
cp -r . /tmp/eulerlive/airootfs/root/eulerinstall-git

cat <<-_EOF_ | tee /tmp/eulerlive/airootfs/root/.zprofile
	cd eulerinstall-git
	rm -rf dist

	uv build --no-build-isolation --wheel
	uv pip install dist/*.whl --break-system-packages --system --no-build --no-deps

	echo "This is an unofficial ISO for development and testing of eulerinstall. No support will be provided."
	echo "This ISO was built from Git SHA $GITHUB_SHA"
	echo "Type eulerinstall to launch the installer."
_EOF_

pacman --noconfirm -S archiso

cp -r /usr/share/archiso/configs/releng/* /tmp/eulerlive

sed -i /eulerinstall/d "$packages_file"

# Add packages to the archiso profile packages
for package in "${packages[@]}"; do
    echo "$package" >>"$packages_file"
done

find /tmp/eulerlive
cd /tmp/eulerlive

mkarchiso -v -w work/ -o out/ ./
