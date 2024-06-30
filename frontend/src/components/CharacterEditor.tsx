import { createEffect, createSignal, For, Setter, Show } from "solid-js";
import { Character, CharacterMakePart } from "../util/client";
import { DumbArrayEditor } from "./DumbArrayEditor";

export default function CharacterEditor(props: { character: Character, setCharacter: Setter<Character>, }) {
    const { character, setCharacter } = props;
    console.log(character);
    const [name, setName] = createSignal(character.makeInfo?.name ?? "");
    const [code, setCode] = createSignal(character.makeInfo?.code ?? "");
    const [parts, setParts] = createSignal(character.makeInfo?.parts ?? [] as CharacterMakePart[]);
    createEffect(() => {
        console.log("CharacterEditor effect");
        let newCharacter = {
            _id: character._id,
            makeInfo: {
                name: name(),
                code: code() == "" ? undefined : code(),
                parts: parts(),
            },
        };
        setCharacter(newCharacter);
        console.log(newCharacter);
    });
    return <>
        <label for="nameInput">
            Name:
        </label>
        <input id="nameInput" type="text" placeholder="Name" value={props.character.makeInfo.name ?? ""} onInput={
            (e) => setName(e.target.value)
        } />
        <br />
        <label for="codeInput">
            Code:
        </label>
        <input id="codeInput" type="text" placeholder="Code" value={props.character.makeInfo.code ?? ""} onInput={
            (e) => setCode(e.target.value)
        } />
        <br />
        <label>Parts</label>
        <DumbArrayEditor makeEmpty={() => ({ type: "char" } as CharacterMakePart)} array={parts} setArray={setParts}
            renderItem={(item, index) => <PartEditor part={item} setPart={(part) => {
                const m = parts();
                m[index()] = part;
                setParts(m);
            }} />} />
    </>;
}

const validPartTypes = ["char", "unite", "2v", "2h", "4", "⻌", "門"];

function PartEditor(props: { part: CharacterMakePart, setPart: (part: CharacterMakePart) => void, }) {
    const { part, setPart } = props;
    const [type, setType] = createSignal(part.type ?? "char");
    const [character, setCharacter] = createSignal(part.character ?? "");
    const [parts, setParts] = createSignal(part.parts ?? [] as CharacterMakePart[]);
    createEffect(() => {
        setPart({
            type: type(),
            parts: parts().length == 0 ? undefined : parts(),
            character: character() == "" ? undefined : character(),
        });
    });
    return <div class="partEditor">
        <label>Type</label>
        <select value={type()} onchange={e => {
            setType(e.target.value);
        }}>
            <For each={validPartTypes}>
                {(item, _) => <option value={item}>{item}</option>}
            </For>
        </select>
        <input type="text" value={type()} onInput={ev => setType(ev.target.value)} />
        <Show when={parts().length == 0}>
            <br/>
            <input type="text" value={character()} onInput={ev => setCharacter(ev.target.value)} placeholder="Character"/>
        </Show>
        <Show when={character() == ""}>
            <br />
            <label>Parts</label>
            <DumbArrayEditor makeEmpty={() => ({ type: "char" } as CharacterMakePart)} array={parts} setArray={setParts}
                renderItem={(item, index) => <PartEditor part={item} setPart={(part) => {
                    const m = parts();
                    m[index()] = part;
                    setParts(m);
                }} />} />
        </Show>
    </div>;
}