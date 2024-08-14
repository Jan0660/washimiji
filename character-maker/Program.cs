using System.CommandLine;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

var jsonOptions = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    PropertyNameCaseInsensitive = true,
    // once(if) this project is switched to .NET 9 in the future this can be uncommented and
    // the properties in MutilationDefinition made part of the record syntax (I hope)
    // RespectNullableAnnotations = true,
};
// var config = JsonSerializer.Deserialize<Config>(await File.ReadAllTextAsync("./config.json"), options: jsonOptions)!;
MutilationFile config;
var removeKanjiVGStrokeNumbers = true;
var removeKanjiVGProperties = true;
string outputDirectory = "";
string[] inputSvgDirectories = [];
// todo: clean this one up
Character[] charactersGlobal = null;
// var mutilationFile = JsonSerializer.Deserialize<MutilationFile>(await File.ReadAllTextAsync(config.MutilationFile), options: jsonOptions)!;

var pathRegex = new Regex("(?: |\n)d=\"((.|\n)+?)\"", RegexOptions.Compiled);
var viewboxRegex = new Regex("viewBox=\"(-?\\d+) (-?\\d+) (-?\\d+) (-?\\d+)\"", RegexOptions.Compiled);
var strokeOrderRegex = new Regex("<g id=\"kvg:StrokeNumbers_.+?>(.|\n)+</g>", RegexOptions.Compiled);
var kanjiVGPropertyRegex = new Regex("kvg:\\w+?=\".+?\"");
var svgContentRegex = new Regex("<svg(?:.|\n)+?>((?:.|\n)+?)</svg>", RegexOptions.Compiled);
var inkscapeJunkRegex = new Regex("<defs(?:.|\n)*?/>|<sodipodi:(?:.|\n)*?/>|sodipodi:(?:.|\n)*?\".*?\"", RegexOptions.Compiled);
var groupRegex = ("<g id=\".+?\" kvg:element=\"", "\"(?:.|\n)*?>(.|\n)+?</g>");
var hexRegex = new Regex("[0-9A-Fa-f]+", RegexOptions.Compiled);
var widthRegex = new Regex("width=\"[0-9]+\"", RegexOptions.Compiled);
var str = new StringBuilder();
var stopwatch = Stopwatch.StartNew();
var report = new Report();

var customCharacterCode = 0x100100;
var previousCustomCharacterCode = customCharacterCode;
var characterSvgs = new Dictionary<int, string>();
var customCharacterSvgs = new Dictionary<string, string>();
var todoCharacters = new List<Character>();
var createdCharacters = new StringBuilder();


var rootCommand = new RootCommand();

var generateCommand = new System.CommandLine.Command("generate", "Generate SVGs");
var outputOption = new Option<DirectoryInfo>("--output", () => new DirectoryInfo("./out"), "Directory to place resulting SVGs and extra info into. Deleted before generation.");
generateCommand.AddOption(outputOption);
var inputSvgOption = new Option<DirectoryInfo[]>("--input", () => [new DirectoryInfo("../glyphs/radicals"), new DirectoryInfo("../glyphs"), new DirectoryInfo("../submodules/kanjivg/kanji")], "directories to get input SVGs from");
generateCommand.AddOption(inputSvgOption);
var configOption = new Option<FileInfo>("--config", () => new FileInfo("./kanjivg-config.json"), "configuration JSON file");
generateCommand.AddOption(configOption);
var charactersOption = new Option<FileInfo>("--characters", () => new FileInfo("./custom-characters.json"));
generateCommand.AddOption(charactersOption);
rootCommand.AddCommand(generateCommand);
generateCommand.SetHandler(async c =>
{
    var output = c.ParseResult.GetValueForOption(outputOption)!;
    outputDirectory = output.FullName;
    if (output.Exists)
        Directory.Delete(outputDirectory, true);
    Directory.CreateDirectory(Path.Join(outputDirectory, "glyphs"));

    var inputSvgDirectoryInfos = c.ParseResult.GetValueForOption(inputSvgOption)!;
    inputSvgDirectories = new string[inputSvgDirectoryInfos.Length];
    for (var i = 0; i < inputSvgDirectories.Length; i++)
    {
        if (!inputSvgDirectoryInfos[i].Exists)
            throw new($"{inputSvgDirectoryInfos[i].FullName} does not exist!");
        inputSvgDirectories[i] = inputSvgDirectoryInfos[i].FullName;
    }

    var configFile = c.ParseResult.GetValueForOption(configOption)!;
    if (!configFile.Exists)
        throw new($"{configFile.FullName} does not exist!");
    config = JsonSerializer.Deserialize<MutilationFile>(await File.ReadAllTextAsync(configFile.FullName), options: jsonOptions)!;

    var charactersFile = c.ParseResult.GetValueForOption(charactersOption)!;
    if (!charactersFile.Exists)
        throw new($"{charactersFile.FullName} does not exist!");
    var characters = JsonSerializer.Deserialize<Character[]>(await File.ReadAllTextAsync(charactersFile.FullName), options: jsonOptions)!;
    charactersGlobal = characters;

    // take radicals
    if (config.TakeRadical != null)
    {
        removeKanjiVGProperties = false;
        var svgs = new Dictionary<int, string>();
        foreach (var (radical, character) in config.TakeRadical)
        {
            var radicalCode = BitConverter.ToInt32(Encoding.UTF32.GetBytes(radical));
            var svg = await GetCharacterSvgAsync(character);
            if (svg == null)
                throw new($"Invalid character '{character}' for taking radicals!");
            var group = Regex.Match(svg, groupRegex.Item1 + radical + groupRegex.Item2);
            if (!group.Success)
                throw new($"Failed to get radical '{radical}' out of '{character}'");
            var val = group.Captures[0].Value;
            val = kanjiVGPropertyRegex.Replace(val, "");
            var index = val.IndexOf('>');
            // todo
            val = val[..index] + " style=\"fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;\"" + val[index..];
            svgs[radicalCode] = val;
        }
        characterSvgs = svgs;
        removeKanjiVGProperties = true;
    }

    foreach (var character in characters)
    {
        try
        {
            await MakeCharacter(character);
        }
        catch (Exception _)
        {
            todoCharacters.Add(character);
        }
    }

    for (var previousTodoCount = todoCharacters.Count + 1; previousTodoCount != todoCharacters.Count;)
    {
        previousTodoCount = todoCharacters.Count;
        // todo(perf): do something else than ToArray() to get around the list being modified during the foreach
        foreach (var character in todoCharacters.ToArray())
        {
            Console.WriteLine($"todoing: {character.Name}");
            try
            {
                await MakeCharacter(character, true);
            }
            catch (Exception exc)
            {
                report.FailedCharacterExceptions[character.Name] = exc.Message;
                Console.WriteLine($"character '{character.Name}' failed with exception: {exc.GetType()} - {exc.Message}");
            }
        }
    }

    if (todoCharacters.Count != 0)
    {
        Console.WriteLine("Todo characters count is not zero - these characters are not valid!");
        foreach (var todoChar in todoCharacters)
        {
            report.FailedCharacters.Add(todoChar.Name);
            Console.WriteLine($"{todoChar.Name}");
        }
    }

    await File.WriteAllTextAsync(Path.Join(outputDirectory, "created-characters.txt"), createdCharacters.ToString());
    await File.WriteAllTextAsync(Path.Join(outputDirectory, "report.json"), JsonSerializer.Serialize(report));

    Console.WriteLine($"done in {stopwatch.ElapsedMilliseconds}ms");
});

var cutSidesCommand = new System.CommandLine.Command("cut-sides", "Cut empty space at the left and right of an SVG. The arguments to this command are not validated.");
cutSidesCommand.AddOption(inputSvgOption);
cutSidesCommand.AddOption(outputOption);
var characterRangesOption = new Option<string>("--character-ranges", "Hex ranges of characters to perform this operation for, e.g. \"61,7A\" for lowercase ASCII letters.");
cutSidesCommand.AddOption(characterRangesOption);
var marginOption = new Option<decimal>("--margin", "The margin to leave at the sides.");
cutSidesCommand.Add(marginOption);
cutSidesCommand.SetHandler(async c =>
{
    var inputDirectories = c.ParseResult.GetValueForOption(inputSvgOption)!;
    var outputDirectory = c.ParseResult.GetValueForOption(outputOption)!;
    var characterRangesText = c.ParseResult.GetValueForOption(characterRangesOption)!;
    var characterRangeSize = 0;
    // start and end inclusive
    var characterRanges = new List<(int, int)>();
    {
        var matches = hexRegex.Matches(characterRangesText);
        for (var i = 0; i < matches.Count; i++)
        {
            var start = int.Parse(matches[i].Value, System.Globalization.NumberStyles.HexNumber);
            var end = int.Parse(matches[++i].Value, System.Globalization.NumberStyles.HexNumber);
            characterRanges.Add((start, end));
            characterRangeSize += end - start;
        }
    }
    var margin = c.ParseResult.GetValueForOption(marginOption);
    var done = new List<int>(characterRangeSize);
    foreach (var input in inputDirectories)
    {
        foreach (var file in Directory.GetFiles(input.FullName))
        {
            var name = Path.GetFileNameWithoutExtension(file);
            if (name.Contains('-'))
                continue;
            var code = int.Parse(name, System.Globalization.NumberStyles.HexNumber);
            var inRange = false;
            foreach (var range in characterRanges)
            {
                if (code >= range.Item1 && code <= range.Item2)
                    inRange = true;
            }
            if (!inRange || done.Contains(code))
                continue;
            var svg = await File.ReadAllTextAsync(file);
            var viewbox = GetViewbox(svg);
            var minX = 100000M;
            var maxX = 0M;

            foreach (var matchObj in pathRegex.Matches(svg))
            {
                var match = (Match)matchObj;
                var instructions = match.Groups[1].Value;
                var commands = ParsePath(instructions);
                commands = ToAbsolute(commands);

                foreach (var cmd in commands)
                {
                    switch (cmd.Instruction)
                    {
                        case 'H':
                            {
                                if (cmd.Args[0] < minX)
                                    minX = cmd.Args[0];
                                if (cmd.Args[0] > maxX)
                                    maxX = cmd.Args[0];
                                break;
                            }
                        case 'V':
                            break;
                        default:
                            if (cmd.Args[^2] < minX)
                                minX = cmd.Args[^2];
                            if (cmd.Args[^2] > maxX)
                                maxX = cmd.Args[^2];
                            break;
                    }
                }
            };
            var width = maxX - minX;
            viewbox = viewbox with
            {
                Width = width + margin * 2,
            };
            svg = pathRegex.Replace(svg, match =>
            {
                str.Clear();
                str.Append(" d=\"");
                var instructions = match.Groups[1].Value;
                var commands = ParsePath(instructions);
                commands = ToRelative(commands);
                commands[0].Args[0] -= minX - margin;
                WriteCommands(str, commands);
                str.Append('"');
                return str.ToString();
            });
            svg = viewboxRegex.Replace(svg, m => $"viewBox=\"{viewbox.X} {viewbox.Y} {viewbox.Width} {viewbox.Height}\"");
            svg = widthRegex.Replace(svg, _ => $"width=\"{viewbox.Width}\"");
            await File.WriteAllTextAsync(Path.Join(outputDirectory.FullName, code.ToString("x5") + ".svg"), svg);
            done.Add(code);
        }
    }
    Console.WriteLine($"Did {done.Count} characters in {stopwatch.ElapsedMilliseconds}ms.");
});
rootCommand.AddCommand(cutSidesCommand);
var preprocessAllCommand = new System.CommandLine.Command("preprocess-all", "Preprocesses every SVG in a directory, replacing them");
var dirOption = new Option<DirectoryInfo>("--dir")
{
    IsRequired = true
};
preprocessAllCommand.AddOption(dirOption);
preprocessAllCommand.AddOption(configOption);
preprocessAllCommand.SetHandler(async c =>
{
    var dir = c.ParseResult.GetValueForOption(dirOption);
    if (dir == null)
        throw new("dir not set");
    var configFile = c.ParseResult.GetValueForOption(configOption)!;
    if (!configFile.Exists)
        throw new($"{configFile.FullName} does not exist!");
    config = JsonSerializer.Deserialize<MutilationFile>(await File.ReadAllTextAsync(configFile.FullName), options: jsonOptions)!;
    if (config.Preprocess == null)
        throw new("config's preprocess is null!");
    foreach (var file in Directory.GetFiles(dir.FullName))
    {
        var svg = await File.ReadAllTextAsync(file);
        svg = Mutilate(svg, config.Preprocess);
        await File.WriteAllTextAsync(file, svg);
    }
    Console.WriteLine($"done in {stopwatch.ElapsedMilliseconds}ms");
});
rootCommand.Add(preprocessAllCommand);

return await rootCommand.InvokeAsync(args);

Viewbox GetViewbox(string svg)
{
    var viewboxMatch = viewboxRegex.Match(svg);
    Debug.Assert(viewboxMatch.Success);
    return new Viewbox(decimal.Parse(viewboxMatch.Groups[1].ValueSpan),
        decimal.Parse(viewboxMatch.Groups[2].ValueSpan),
        decimal.Parse(viewboxMatch.Groups[3].ValueSpan),
        decimal.Parse(viewboxMatch.Groups[4].ValueSpan));
}

string Mutilate(string inputSvg, Mutilation mutilation)
{
    // replace paths
    inputSvg = pathRegex.Replace(inputSvg, match =>
    {
        str.Clear();
        str.Append(" d=\"");
        var instructions = match.Groups[1].Value;
        var commands = ParsePath(instructions);
        commands = ToRelative(commands);

        foreach (var command in commands)
        {
            for (var i = 0; i < command.Args.Length; i++)
            {
                if (command.Instruction is 'v' or 'V')
                    command.Args[i] *= mutilation.YMultiply;
                else
                    command.Args[i] *= i % 2 == 0 ? mutilation.XMultiply : mutilation.YMultiply;
            }
            if (char.IsAsciiLetterUpper(command.Instruction))
            {
                for (var i = 0; i < command.Args.Length; i++)
                {
                    command.Args[i] = ((i % 2 == 0 ? mutilation.XMove : mutilation.YMove) * (!mutilation.AbsoluteMove ? (i % 2 == 0 ? config.Viewbox.Width : config.Viewbox.Height) : 1)) + command.Args[i];
                }
            }
        }
        // write commands
        WriteCommands(str, commands);
        str.Append('"');
        return str.ToString();
    });
    if (mutilation.InsertSvg != null)
    {
        // var splitIndex = inputSvg.Find("</g>", 0, inputSvg.rfind("</g>"));
        var splitIndex = inputSvg.LastIndexOf("</g>");
        if (splitIndex == -1) { }
        splitIndex = inputSvg.LastIndexOf("</g>", splitIndex);
        if (splitIndex == -1) splitIndex = inputSvg.LastIndexOf("</svg>");
        inputSvg = inputSvg.Substring(0, splitIndex) + mutilation.InsertSvg + inputSvg.Substring(splitIndex);
    }

    return inputSvg;
}

void WriteCommands(StringBuilder str, Command[] commands)
{
    // noone's gonna meet numbers that are longer than 64 chars, right?
    Span<char> numberSpan = stackalloc char[64];
    foreach (var command in commands)
    {
        str.Append(command.Instruction);
        for (int i = 0; i < command.Args.Length; i++)
        {
            command.Args[i].TryFormat(numberSpan, out var charsWritten, "0.##");
            if (numberSpan[0] != '-' && i != 0)
            {
                str.Append(',');
            }
            str.Append(numberSpan[..charsWritten]);
        }
    }
}

async Task<string?> GetCharacterSvgAsync(string character)
{
    // character is a custom character name
    string svg;
    if (customCharacterSvgs.TryGetValue(character, out svg!))
        return svg;
    if (Array.Exists(charactersGlobal, (i) => i.Name == character))
        return null;
    // character is a character (in text, e.g. "塩")
    // todo(perf): don't use GetBytes
    var originalCode = BitConverter.ToInt32(Encoding.UTF32.GetBytes(character));
    var originalCodeStr = originalCode.ToString("x5");
    if (config.Substitutions != null)
    {
        if (config.Substitutions.TryGetValue(originalCodeStr, out var val))
        {
            originalCodeStr = val;
            originalCode = int.Parse(val, System.Globalization.NumberStyles.HexNumber);
        }
    }
    if (characterSvgs.TryGetValue(originalCode, out var value))
        return value;
    else
    {
        foreach (var inputSvgDirectory in inputSvgDirectories)
        {
            var inputFile = Path.Join(inputSvgDirectory, originalCodeStr + ".svg");
            if (File.Exists(inputFile))
            {
                svg = await File.ReadAllTextAsync(inputFile);
                if (removeKanjiVGStrokeNumbers)
                    svg = strokeOrderRegex.Replace(svg, "");
                if (removeKanjiVGProperties)
                    svg = kanjiVGPropertyRegex.Replace(svg, "");
                svg = inkscapeJunkRegex.Replace(svg, "");
                if (config.Preprocess != null)
                    svg = Mutilate(svg, config.Preprocess);
                characterSvgs[originalCode] = svg;
                return svg;
            }
        }
    }
    return null;
}

async Task<string?> GetCharacterSvgContentAsync(string character)
{
    var svg = await GetCharacterSvgAsync(character);
    if (svg == null)
        return null;
    return GetSvgContent(svg);
}

async Task<string?> GetArgsSvgContent(Part part)
{
    if (part.Character != null)
        return await GetCharacterSvgContentAsync(part.Character!);
    return await MakePart(part);
}

async Task<string[]?> GetArgsSvgContents(Part part)
{
    var parts = part.Parts;
    var character = part.Character;
    if (parts != null)
    {
        var res = new string[parts.Length];
        for (var i = 0; i < parts.Length; i++)
        {
            var svg = await GetArgsSvgContent(parts[i]);
            if (svg == null)
                return null;
            res[i] = svg;
        }
        return res;
    }
    if (character != null)
    {
        var svg = await GetCharacterSvgContentAsync(character);
        if (svg == null)
            return null;
        return [svg];
    }
    throw new("Oops!");
}

async Task<string?> MakePart(Part part)
{
    if ((part.Parts == null && part.Character == null) || (part.Parts != null && part.Character != null))
        throw new("Either args or character must be set and not both");
    string? svg;
    switch (part.Type)
    {
        case "char":
            // todo: check null and make proper exception
            svg = await GetCharacterSvgAsync(part.Character!);
            if (svg == null)
                return null;
            svg = GetSvgContent(svg);
            break;
        case "unite":
            {
                var svgs = await GetArgsSvgContents(part);
                if (svgs == null)
                    return null;
                svg = string.Join("", svgs);
                break;
            }
        default:
            if (config.Mutilations.FirstOrDefault(m => m.Name == part.Type) is not null and var mutilationDefinition)
            {
                var svgs = await GetArgsSvgContents(part);
                if (svgs == null)
                    return null;
                if (svgs.Length != mutilationDefinition.PartCount)
                    throw new($"There must be {mutilationDefinition.PartCount} parts for part type '{mutilationDefinition.Name}'");
                for (var i = 0; i < svgs.Length; i++)
                    svgs[i] = Mutilate(svgs[i], mutilationDefinition.Parts[i]);
                svg = string.Join("", svgs);
                if (mutilationDefinition.BaseCharacter != null)
                {
                    var baseSvg = await GetCharacterSvgContentAsync(mutilationDefinition.BaseCharacter);
                    if (baseSvg == null)
                        return null;
                    svg += baseSvg;
                }
                break;
            }
            throw new($"Invalid part type: {part.Type}");
    }
    if (svg == null)
        throw new("Oops! Variable svg shouldn't be null");
    svg = Mutilate(svg, new Mutilation(part.Move?[0] ?? 0,
        part.Move?[1] ?? 0,
        part.Multiply?[0] ?? 1.0M,
        part.Multiply?[1] ?? 1.0M));
    return svg;
}

async Task<string?> MakeParts(Part[] parts)
{
    // todo(perf):
    var svg = new StringBuilder();
    foreach (var part in parts)
    {
        var partSvg = await MakePart(part);
        if (partSvg == null)
            return null;
        svg.Append(partSvg);
    }
    return svg.ToString();
}

int GetNewCustomCharacterCode()
{
    previousCustomCharacterCode = customCharacterCode;
    for (; characterSvgs.ContainsKey(customCharacterCode); customCharacterCode++) { }
    while (true)
    {
        var i = 0;
        for (; i < charactersGlobal.Length; i++)
        {
            if (charactersGlobal[i].CodeParsed == customCharacterCode)
                break;
        }
        if (i == charactersGlobal.Length)
            break;
        customCharacterCode++;
    }
    return customCharacterCode;
}


void FreeCustomCharacterCode()
{
    customCharacterCode = previousCustomCharacterCode;
}

async Task MakeCharacter(Character character, bool isTodo = false)
{
    var newCode = character.Code != null ? int.Parse(character.Code, System.Globalization.NumberStyles.HexNumber) : GetNewCustomCharacterCode();
    var newCodeStr = newCode.ToString("x5");
    var newSvg = await MakeParts(character.Parts);
    if (newSvg == null)
    {
        if (!isTodo)
            todoCharacters.Add(character);
        if (character.Code == null)
            FreeCustomCharacterCode();
        return;
    }
    if (isTodo)
        todoCharacters.Remove(character);
    newSvg = config.SvgPrefix + newSvg + config.SvgSuffix;
    await File.WriteAllTextAsync(Path.Join(outputDirectory, "glyphs", newCodeStr + ".svg"), newSvg);
    characterSvgs[newCode] = newSvg;
    customCharacterSvgs[character.Name] = newSvg;
    // todo(perf): can probably use something other than GetString
    var createdCharacter = Encoding.UTF32.GetString(BitConverter.GetBytes(newCode));
    createdCharacters.Append(createdCharacter);
    report.MadeCharacters.Add(character.Name, newCodeStr);
    Console.WriteLine($"Made character '{createdCharacter}'({newCodeStr}) named '{character.Name}'");
}

Command[] ParsePath(string d)
{
    var res = new List<Command>();
    var instruction = ' ';
    var argArray = new List<decimal>(12);
    for (int i = 0; i < d.Length; i++)
    {
        if (char.IsAsciiLetter(d[i]))
        {
            if (instruction != ' ')
            {
                res.Add(new Command(instruction, argArray.ToArray()));
                argArray.Clear();
                instruction = ' ';
            }
            instruction = d[i];
        }
        else if (char.IsDigit(d[i]) || d[i] == '-')
        {
            var j = i + 1;
            for (; j < d.Length && (d[j] == '.' || char.IsAsciiDigit(d[j])); j++) { }
            argArray.Add(decimal.Parse(d.AsSpan()[i..j]));
            i = j - 1;
        }
    }
    res.Add(new Command(instruction, argArray.ToArray()));
    return res.ToArray();
}

string GetSvgContent(string svg)
{
    var val = svgContentRegex.Match(svg).Groups[1].Value;
    // might already be just the SVG content
    return string.IsNullOrEmpty(val) ? svg : val;
}

// translated from https://github.com/adobe-webplatform/Snap.svg/blob/master/src/path.js#L532
// todo(perf): optimize this
Command[] ToRelative(Command[] cmds)
{
    var res = new List<Command>();
    var (x, y, mx, my, start) = (0M, 0M, 0M, 0M, 0);
    if (cmds[0].Instruction == 'M')
    {
        x = cmds[0].Args[0];
        y = cmds[0].Args[1];
        mx = x;
        my = y;
        start++;
        res.Add(new Command('M', [x, y]));
    }
    for (var i = start; i < cmds.Length; i++)
    {
        var wasUpperM = false;
        char? instruction = null;
        var args = new List<decimal>();
        var origCmd = cmds[i];
        if (char.IsUpper(origCmd.Instruction))
        {
            instruction = char.ToLowerInvariant(origCmd.Instruction);
            switch (instruction)
            {
                case 'a':
                    args.Add(origCmd.Args[0]);
                    args.Add(origCmd.Args[1]);
                    args.Add(origCmd.Args[2]);
                    args.Add(origCmd.Args[3]);
                    args.Add(origCmd.Args[4]);
                    args.Add(origCmd.Args[5] - x);
                    args.Add(origCmd.Args[6] - y);
                    break;
                case 'v':
                    args.Add(origCmd.Args[0] - y);
                    break;
                case 'm':
                    mx = origCmd.Args[0];
                    my = origCmd.Args[1];
                    wasUpperM = true;
                    for (var j = 0; j < origCmd.Args.Length; j++)
                    {
                        args.Add(origCmd.Args[j] - (j % 2 == 0 ? x : y));
                    }
                    break;
                default:
                    for (var j = 0; j < origCmd.Args.Length; j++)
                    {
                        args.Add(origCmd.Args[j] - (j % 2 == 0 ? x : y));
                    }
                    break;
            }
        }
        else
        {
            if (origCmd.Instruction == 'm')
            {
                mx = origCmd.Args[0] + x;
                my = origCmd.Args[1] + y;
            }
            instruction = origCmd.Instruction;
            for (var j = 0; j < origCmd.Args.Length; j++)
            {
                args.Add(origCmd.Args[j]);
            }
        }
        var len = args.Count;
        switch (instruction)
        {
            case 'z':
                x = mx;
                y = my;
                break;
            case 'h':
                x += args[len - 1];
                break;
            case 'v':
                y += args[len - 1];
                break;
            case 'm' when wasUpperM:
                break;
            default:
                x += args[len - 2];
                y += args[len - 1];
                break;
        }
        res.Add(new Command(instruction.Value, args.ToArray()));
    }
    return res.ToArray();
}

Command[] ToAbsolute(Command[] cmds)
{
    var res = new List<Command>();
    var (x, y, mx, my, start, pa0) = (0M, 0M, 0M, 0M, 0, ' ');
    if (cmds[0].Instruction == 'M')
    {
        x = cmds[0].Args[0];
        y = cmds[0].Args[1];
        mx = x;
        my = y;
        start++;
        res.Add(new Command('M', [x, y]));
    }
    var crz = cmds.Length == 3 && cmds[0].Instruction == 'M' &&
        char.ToUpperInvariant(cmds[1].Instruction) == 'R' &&
        char.ToLowerInvariant(cmds[2].Instruction) == 'Z';
    for (var i = start; i < cmds.Length; i++)
    {
        // r
        var pa = cmds[i];
        char? instruction = null;
        var args = new List<decimal>();
        pa0 = pa.Instruction;
        if (pa0 != char.ToUpperInvariant(pa0))
        {
            instruction = char.ToUpperInvariant(pa0);
            switch (instruction)
            {
                case 'A':
                    args.Add(pa.Args[0]);
                    args.Add(pa.Args[1]);
                    args.Add(pa.Args[2]);
                    args.Add(pa.Args[3]);
                    args.Add(pa.Args[4]);
                    args.Add(pa.Args[5] + x);
                    args.Add(pa.Args[6] + y);
                    break;
                case 'V':
                    args.Add(pa.Args[1] + y);
                    break;
                case 'H':
                    args.Add(pa.Args[1] + x);
                    break;
                case 'R':
                    throw new NotImplementedException();
                    decimal[] dots = [x, y, .. pa.Args];
                    for (var j = 2; j < dots.Length; j++)
                    {
                        dots[j] = dots[j] + x;
                        dots[++j] = dots[j] + y;
                    }
                    // res.pop() ??
                    // res.concat() ???
                    break;
                case 'O':
                    throw new NotImplementedException();
                    break;
                case 'U':
                    throw new NotImplementedException();
                    break;
                case 'M':
                    mx = pa.Args[0] + x;
                    my = pa.Args[1] + y;
                    break;
                default:
                    for (var j = 0; j < pa.Args.Length; j++)
                    {
                        // TODO: might need to be switched
                        args.Add(pa.Args[j] + (j % 2 == 0 ? x : y));
                    }
                    break;
            }
        }
        else if (pa0 == 'R')
        {
            throw new NotImplementedException();
        }
        else if (pa0 == 'O')
        {
            throw new NotImplementedException();
        }
        else if (pa0 == 'U')
        {
            throw new NotImplementedException();
        }
        else
        {
            instruction = pa0;
            foreach (var arg in pa.Args)
            {
                args.Add(arg);
            }
        }
        pa0 = char.ToUpperInvariant(pa0);
        if (pa0 != '0')
        {
            switch (pa0)
            {
                case 'Z':
                    x = mx;
                    x = my;
                    break;
                case 'H':
                    x = args[1];
                    break;
                case 'V':
                    y = args[1];
                    break;
                case 'M':
                    mx = args[^2];
                    my = args[^1];
                    break;
                default:
                    x = args[^2];
                    y = args[^1];
                    break;
            }
        }
        res.Add(new Command(instruction.Value, args.ToArray()));
    }

    return res.ToArray();
}

public record Command(char Instruction, decimal[] Args);

public record Viewbox(decimal X, decimal Y, decimal Width, decimal Height);

public record Mutilation(decimal XMove = 0, decimal YMove = 0, decimal XMultiply = 1M, decimal YMultiply = 1M, decimal[]? FitInto = null)
{
    public string? InsertSvg { get; init; }
    public bool AbsoluteMove { get; init; } = false;
}

public record MutilationFile(Dictionary<string, string>? Substitutions, MutilationDefinition[] Mutilations, Mutilation? Preprocess = null, Dictionary<string, string>? TakeRadical = null)
{
    public required string SvgPrefix { get; init; }
    public required string SvgSuffix { get; init; }
    public required Viewbox Viewbox { get; init; }
}

public record MutilationDefinition(string Name, string? BaseCharacter, int PartCount, Mutilation[] Parts);

public class Character
{
    public required string Name { get; init; }
    public required Part[] Parts { get; init; }
    public string? Code { get; init; }
    public int? CodeParsed
    {
        get
        {
            if (Code == null) return null;
            if (_codeParsed != null) return _codeParsed.Value;
            return int.Parse(Code, System.Globalization.NumberStyles.HexNumber);
        }
    }
    private int? _codeParsed;
}

public class Part
{
    public required string Type { get; init; }
    public Part[]? Parts { get; init; }
    public string? Character { get; init; }
    public decimal[]? Move { get; init; }
    public decimal[]? Multiply { get; init; }
    public decimal[]? FitInto { get; init; }
}

public class Report
{
    public Dictionary<string, string> MadeCharacters { get; } = new();
    public List<string> FailedCharacters { get; } = new();
    public Dictionary<string, string> FailedCharacterExceptions { get; } = new();
}
