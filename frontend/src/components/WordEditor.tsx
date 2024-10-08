import { createEffect, createSignal, Setter } from "solid-js";
import { Word, WordForm } from "../util/client";
import { DumbArrayEditor } from "./DumbArrayEditor";

export default function WordEditor(props: { word: Word, setWord: Setter<Word>, }) {
    const { word, setWord } = props;
    const [characters, setCharacters] = createSignal(word.characters ?? []);
    const [words, setWords] = createSignal(word.words ?? []);
    const [derivedFrom, setDerivedFrom] = createSignal(word.derivedFrom ?? "");
    const [derivedName, setDerivedName] = createSignal(word.derivedName ?? "");
    createEffect(() => {
        console.log("CharacterEditor effect");
        let newWord = {
            _id: word._id,
            characters: characters(),
            words: words(),
            derivedFrom: word.derivedFrom == "" ? undefined : word.derivedFrom,
            derivedName: word.derivedName == "" ? undefined : word.derivedName,
        };
        setWord(newWord);
        console.log(newWord);
    });
    return <>
        <label for="charsInput">
            Characters (space-separated)
        </label>
        <br />
        <input class="wideInput" id="charsInput" type="text" placeholder="Characters" value={word.characters?.join(" ") ?? ""} onInput={
            (e) => setCharacters(e.target.value.trim().split(" "))
        } />
        <br />
        <label for="wordsInput">
            Words (space-separated)
        </label>
        <br />
        <DumbArrayEditor makeEmpty={() => ({text: ""} as WordForm)} array={words} setArray={setWords} renderItem={(wordForm, index) => {
            return <div>
                <label>Word</label>
                <input id="wordsInput" type="text" placeholder="Words" value={wordForm.text} onInput={
                    (e) => {
                        const m = words();
                        m[index()] = {
                            ...m[index()],
                            text: e.target.value,
                        };
                        setWords(m);
                    }
                } />
                <br/>
                <label>Etymology Number</label>
                <input id="wordsInput" type="text" placeholder="Etymology Number" value={wordForm.etymologyNumber ?? ""} onInput={
                    (e) => {
                        const m = words();
                        m[index()] = {
                            ...m[index()],
                            etymologyNumber: e.target.value == "" ? undefined : +e.target.value,
                        };
                        setWords(m);
                    }
                } />
            </div>
        }}/>
        <label for="derivedFromInput">
            Derived From ID
        </label>
        <br />
        <input class="wideInput" id="derivedFromInput" type="text" placeholder="Derived From ID" value={derivedFrom()} onInput={
            (e) => setDerivedFrom(e.target.value)
        } />
        <br/>
        <label for="derivedNameInput">
            Derived Name
        </label>
        <br />
        <input class="wideInput" id="derivedNameInput" type="text" placeholder="Derived Name" value={derivedName()} onInput={
            (e) => setDerivedName(e.target.value)
        } />
    </>;
}
