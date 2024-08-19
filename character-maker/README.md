# character-maker

## Prerequisites

- .NET 8.0

## Commands

See `--help`.

## Config

Full config for use with KanjiVG is available in `kanjivg-config.json`

```json
{
    "svgPrefix": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!-- Generated SVG using Washimiji (https://github.com/Jan0660/washimiji) using SVGs from the KanjiVG project (http://kanjivg.tagaini.net) which is distributed under the Creative Commons Attribution-Share Alike 3.0 License and so is this SVG. See http://creativecommons.org/licenses/by-sa/3.0/ for more details. -->\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"109\" height=\"109\" viewBox=\"0 0 109 109\">",
    "svgSuffix": "</svg>",
    "viewbox": {
        "x": 0,
        "y": 0,
        "width": 109,
        "height": 109
    },
    "mutilations": [
        {
            "name": "⻌",
            "baseCharacter": "⻌",
            "partCount": 1,
            "parts": [
                {
                    "absoluteMove": true,
                    "xmove": 20,
                    "ymove": 2,
                    "xmultiply": 0.8,
                    "ymultiply": 0.8
                }
            ]
        }
    ]
}
```

- `svgPrefix`: string - what the SVG should start with - take this from the SVGs you get by extracting SVGs from a font up to the first `<svg>`
- `svgSuffix`: string - `</svg>`
- `viewbox`: object - take this from the numbers in `viewBox` in the `svgPrefix` in the following order:
    - `x`: decimal number
    - `y`: decimal number
    - `width`: decimal number
    - `height`: decimal number
- `preprocess`: object(same as in `parts` of `mutilations`) - a mutilation to be applied to every character before further processing
- `mutilations`: array of
    - `name`: string
    - `baseCharacter`?: string
    - `partCount`: number
    - `parts`: array of mutilations that will be applied to parts in order
        - `absoluteMove`: boolean(default `false`) - if `false` then a `ymove` value of `1` will move the part by the entire height of the character
        - `xmove`
        - `ymove`
        - `xmultiply`
        - `ymultiply`
- `substitutions`: dictionary of
    - key: original character code in hex without the `0x` prefix padded with `0` to 5 characters
    - value: the code of the character that should be used instead

## `custom-characters.json`

```json
[
    {
        "name": "michi",
        "parts": [
            {
                "type": "⻌",
                "parts": [
                    {
                        "type": "char",
                        "character": "首"
                    }
                ]
            }
        ],
        "code": "100100"
    }
]
```

Array of:

- `name`: string
- `parts`: array of
    - `type`: string - `"char"` or a mutilation defined in your config
    - `parts`: array of this - mutually exclusive with `character`
    - `character`: string
- `code`: string - codepoint to assign to the character in hex, without the `0x` prefix

## Available KanjiVG Mutilations

If part count is not specified assume 1.

- `2v` - part count: 2 - arranges two parts vertically 50/50
- `2h` - part count: 2 - arranges two parts horizontally 50/50
- `4` - part count: 4 - arranges 4 parts in a 2x2 grid
- 2 strokes
    - `亻`
    - `冫`
    - `亠`
    - `冖`
    - `卩`
    - `𠂇`
    - `冂`
    - `凵`
    - `匸`
    - `匚`
    - `勹`
    - `几` - more like the one from 凧
- 3 strokes
    - `彳`
    - `扌`
    - `忄`
    - `氵`
    - `犭` - actually ⺨
    - `艹`
    - `⻏` - on the right as in 邸
    - `⻖` - on the left as in 阪
    - `⻌`
    - `廴`
    - `尸`
    - `囗`
- 4 strokes
    - `礻`
    - `牜`
    - `⺩`
    - `⺧`
    - `灬`
    - `气`
- 5 strokes
    - `衤`
    - `癶`
    - `疒`
- 6 strokes
    - `⺮`
    - `覀`
- 7 strokes
    - `⻊`
    - `訁`
- 8 strokes
    - `釒`
    - `飠`
    - `門`
- 10 strokes
    - `鬥`
