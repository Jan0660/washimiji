#!/usr/bin/bash
# made for use by the backend
cp ../glyphs/radicals/*.svg $1
pushd ../font-maker
python3 ./main.py make-font $1 $2 $3
popd
