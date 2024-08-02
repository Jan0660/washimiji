import { createEffect, createSignal, Setter } from "solid-js";
import { Word, WordForm } from "../util/client";
import { DumbArrayEditor } from "./DumbArrayEditor";

export default function WordEditor(props: { word: Word, setWord: Setter<Word>, }) {
    const { word, setWord } = props;
    const [characters, setCharacters] = createSignal(word.characters);
    const [words, setWords] = createSignal(word.words);
    createEffect(() => {
        console.log("CharacterEditor effect");
        let newWord = {
            _id: word._id,
            characters: characters(),
            words: words(),
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
                <input id="wordsInput" type="text" placeholder="Words" value={wordForm.text} onInput={
                    (e) => {
                        const m = words();
                        m[index()] = {
                            text: e.target.value,
                        };
                        setWords(m);
                    }
                } />
            </div>
        }}/>
    </>;
}
