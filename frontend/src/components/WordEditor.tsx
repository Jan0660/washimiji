import { createEffect, createSignal, Setter } from "solid-js";
import { Word } from "../util/client";

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
        <input class="wideInput" id="wordsInput" type="text" placeholder="Words" value={word.words?.join(" ") ?? ""} onInput={
            (e) => setWords(e.target.value.trim().split(" "))
        } />
    </>;
}
