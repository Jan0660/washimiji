#!/usr/bin/bash
mkdir backend/static

rm -rf /tmp/make-kanjivg-font
mkdir /tmp/make-kanjivg-font
echo "Copying SVGs to tmp"
cp ./submodules/kanjivg/kanji/*.svg /tmp/make-kanjivg-font
pushd character-maker
echo "Cutting sides off of latin alphabet characters"
dotnet run -- cut-sides --output /tmp/make-kanjivg-font --character-ranges "41,90;61,7A" --margin 10 --input ../submodules/kanjivg/kanji
popd
pushd font-maker
echo "Generating font"
python3 ./main.py make-font /tmp/make-kanjivg-font ../backend/static/kanjivg-font.ttf ./kanjivg-base-config.json
popd
rm -rf /tmp/make-kanjivg-font
