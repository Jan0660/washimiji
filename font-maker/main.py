#!/usr/bin/python3
import os
import sys
import fontforge
import re
import json
from freetype import Face

print(sys.argv)

if sys.argv[1] == "extract-svgs":
    os.makedirs(sys.argv[3], exist_ok=True)
    font = fontforge.open(sys.argv[2], ("allglyphsinttc", "fstypepermitted", "alltables"))

    minusOneCount = 0
    count = 0
    print("glyph sum: %d" % sum(1 for _ in font.glyphs()))
    while True:
        print("cidsubfont: " + str(font.cidsubfont))
        print("__len__(): " + str(font.__len__()))
        for glyph in font.glyphs():
            if glyph.unicode == -1:
                minusOneCount += 1
                continue
            file = hex(glyph.unicode).removeprefix("0x").rjust(5, "0") + ".svg"
            glyph.removeOverlap()
            glyph.export(os.path.join(sys.argv[3], file))
            # if (glyph.unicode != -1):
            #     print(chr(glyph.unicode))
            #     print(glyph.width)
            #     # print(glyph.height)
            count += 1
        if font.cidsubfont + 1 < font.cidsubfontcnt:
            font.cidsubfont += 1
        else:
            break
    # code adapted from https://github.com/HinTak/freetype-py/blob/fontval-diag/examples/cjk-multi-fix.py
    # because some glyphs have multiple unicode codepoints assigned but FontForge only stores one
    # so it only loads 女 as U+2F25 "KANGXI RADICAL WOMAN" and U+5973 is nowhere to be found
    face = Face(sys.argv[2])
    face.set_charmap( face.charmap )
    reverse_lookup = {}
    charcode, gindex = face.get_first_char()
    codes = []
    while ( gindex ):
        codes.append(charcode)
        if ( gindex in reverse_lookup.keys() ):
            reverse_lookup[gindex].append( charcode )
        else:
            reverse_lookup[gindex] = [charcode]
        charcode, gindex = face.get_next_char( charcode, gindex )
    del face

    # font.cidsubfont = 0
    if ( font.cidfontname != "" and font.cidsubfontcnt != 0 ):
        font.cidFlatten()
    font.reencode("ucs4")
    destination_full_count = 0
    duplicate_count = 0
    # 2nd block of freetype-py code:
    for gindex in reverse_lookup.keys():
        # if ( len(reverse_lookup[gindex]) > 1 ):
            for x in range( len(reverse_lookup[gindex]) - 1 ):
                font.selection.select( reverse_lookup[gindex][-1] )
                if ( not (font[reverse_lookup[gindex][-1]]).isWorthOutputting() ):
                    print( 'Source Empty!' )
                font.copy()
                font.selection.select( reverse_lookup[gindex][x] )
                try:
                    font[reverse_lookup[gindex][x]]
                    for glyph in font.selection.byGlyphs:
                        unicode = reverse_lookup[gindex][x]
                        file = hex(unicode).removeprefix("0x").rjust(5, "0") + ".svg"
                        glyph.removeOverlap()
                        glyph.export(os.path.join(sys.argv[3], file))
                except TypeError:
                    # expect this!
                    pass
                # else:
                    # destination_full_count += 1
                    # print( 'Destination Full!' )
                # font.paste()
                #print( "copy %d to %d" % (reverse_lookup[gindex][-1], reverse_lookup[gindex][x]) )
                # duplicate_count += 1
    # end of adapted code
    print("exported SVG count: " + str(count))
    print("glyphs with .unicode equal to -1: " + str(minusOneCount))
elif sys.argv[1] == "make-font":
    font = fontforge.font()
    with open(sys.argv[4], "r") as json_data:
        config = json.load(json_data)
    for file in os.listdir(sys.argv[2]):
        if(file.__contains__("-")):
            continue
        unico = int(file.removesuffix(".svg"), 16)
        glyph = font.createChar(unico)
        with open(os.path.join(sys.argv[2], file), "r") as svg:
            svgWidth = float(re.search("width=\"([0-9]+(?:.[0-9]+)?)\"", svg.read()).groups()[0])
        glyph.width = int(1000 * (svgWidth / config["baseWidth"]))
        glyph.importOutlines(os.path.join(sys.argv[2], file))
        # glyph.removeOverlap()
    font.fontname=config["name"]
    font.fullname=config["name"]
    font.familyname=config["name"]
    font.comment=config.get("comment", "")
    font.copyright=config.get("copyright", "")
    if "strokedfont" in config:
        font.strokedfont = config["strokedfont"]
    if "strokewidth" in config:
        font.strokewidth = config["strokewidth"]
    if "version" in config:
        font.version = config["version"]
    print("generating font with " + str(sum(1 for _ in font.glyphs())) + " glyphs")
    font.generate(sys.argv[3])
else:
    print("read README.md for commands")
