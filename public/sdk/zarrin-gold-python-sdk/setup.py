"""
Zarrin Gold Payment Gateway SDK — Setup Configuration
=======================================================
تنظیمات نصب SDK درگاه پرداخت زرین گلد
"""

from setuptools import setup, find_packages

setup(
    name="zarrin-gold-sdk",
    version="1.0.0",
    description="Official Python SDK for Zarrin Gold payment gateway / SDK رسمی پایتون برای درگاه پرداخت زرین گلد",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="Zarrin Gold Team",
    author_email="dev@zarringold.com",
    url="https://zarringold.com",
    license="MIT",
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.25.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "mypy>=1.0.0",
            "ruff>=0.1.0",
        ],
    },
    packages=find_packages(exclude=["tests*", "examples*"]),
    package_data={
        "zarringold": ["py.typed"],
    },
    include_package_data=True,
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Office/Business :: Financial :: Payment",
        "Natural Language :: Persian",
        "Natural Language :: English",
    ],
    keywords=[
        "zarrin-gold",
        "zarringold",
        "payment-gateway",
        "gold-payment",
        "cryptocurrency",
        "python-sdk",
        "zarin-gold",
    ],
    project_urls={
        "Documentation": "https://zarringold.com/docs",
        "Source": "https://github.com/zarringold/python-sdk",
        "Bug Tracker": "https://github.com/zarringold/python-sdk/issues",
    },
)
