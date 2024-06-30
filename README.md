# WIP

# Washimiji

A kanji-based logographic script for English.

## Project layout

The project is composed of the following parts:

- `backend` written in Go with [Gin](https://gin-gonic.com/)
- `character-maker` written in C#
- `font-maker` written in Python utilizing [FontForge](https://fontforge.org/) and [freetype-py](https://github.com/rougier/freetype-py)
- `frontend` written in TS with [SolidJS](https://www.solidjs.com/)

# LICENSE

Everything in this repository is licensed under the [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.en.html)(license text in `/LICENSE`) except for the `/glyphs` folder which is licensed under the [Creative Commons Attribution-Share Alike 3.0 License](https://creativecommons.org/licenses/by-sa/3.0/)(license text in `/glyphs/LICENSE`). This project uses the [KanjiVG project](https://github.com/KanjiVG/kanjivg) which is copyright © 2009-2024 Ulrich Apel, licensed under the [Creative Commons Attribution-Share Alike 3.0 License](https://creativecommons.org/licenses/by-sa/3.0/) as a submodule and uses it to generate font files which are are also licensed under the same license.
