from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="eulerinstall",
    version="3.0.9",
    description="EulerOS installer - guided, templates etc.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Anton Hvornum",
    author_email="anton@hvornum.se",
    license="GPL-3.0-only",
    packages=find_packages(exclude=["tests", "tests.*"]),
    package_data={
        "eulerinstall": [
            "**/*.py",
            "**/*.mo",
            "**/*.po",
            "**/*.pot",
            "**/*.json",
        ]
    },
    python_requires=">=3.11",
    install_requires=[
        "pyparted>=3.13.0",
        "pydantic==2.11.7",
        "cryptography>=44.0.2",
        "typing_extensions>=4.12.0",
    ],
    extras_require={
        "log": ["systemd_python==235"],
        "dev": [
            "mypy==1.17.1",
            "flake8==7.3.0",
            "pre-commit==4.2.0",
            "ruff==0.12.7",
            "pylint==3.3.7",
            "pylint-pydantic==0.3.5",
            "pytest==8.4.1",
        ],
        "doc": ["sphinx"],
    },
    entry_points={
        "console_scripts": [
            "eulerinstall=eulerinstall:run_as_a_module",
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 3.12",
        "Operating System :: POSIX :: Linux",
    ],
    keywords=["linux", "euler", "eulerinstall", "installer"],
)