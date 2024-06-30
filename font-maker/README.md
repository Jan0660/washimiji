# font-maker

## Prerequisites

- Python 3
- [FontForge](https://fontforge.org/) (with the Python library accessible)
    - `fontforge` package in the official Arch Linux repositories
- the pip packages specified in `requirements.txt`

## Commands

- `extract-svgs <font file> <output directory>`
- `make-font <directory with svgs> <output font file> <font config JSON file>`

## Config

```json
{
    "name": "Washimiji font",
    "baseWidth": 109,
    "copyright": "...",
    "comment": "...",
    "strokedfont": true,
    "strokewidth": 3,
    "version": "0.1.0"
}
```

- `name`: string - name of the font
- `baseWidth`: number - glyph with is calculated like `int(1000 * (svgWidth / config["baseWidth"]))` e.g. if the `width="..."` in an SVG is equal to `baseWidth`, the glyph width is `1000`(full-width)
- `copyright`: string - copyright information to be included in the font file
- `comment`: string - comment to be included in the font file
- `strokedFont`: boolean
- `strokeWidth`: number
- `version`: string
