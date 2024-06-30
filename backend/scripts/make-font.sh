#!/usr/bin/bash
# made for use by the backend
pushd ../font-maker
python3 ./main.py make-font $1 $2 $3
popd
