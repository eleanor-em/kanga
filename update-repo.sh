#!/bin/bash

REPO=https://github.com/eleanor-em/roo-compiler/
REPO_DIR=roo-compiler

rm -rf src/bin
mkdir src/bin
mkdir download
cd download
git clone $REPO
cp -r $REPO_DIR/* ../src/bin/
cd ..
rm -rf download
cd src/bin
mkdir src
touch src/.keep
make
cd oz
make