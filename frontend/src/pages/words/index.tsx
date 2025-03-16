import { createSignal, For, Show } from "solid-js";
import { WordWithText } from "../../util/client";
import { client, config } from "../..";
import WordTerm from "../../components/WordTerm";
import { A } from "@solidjs/router";

const WordsIndex = () => {
    const [words, setWords] = createSignal(null as WordWithText[] | null);
    let abortController = new AbortController();
    client.words.search("#notderived", abortController.signal).then(setWords);
    const [lastSearched, setLastSearched] = createSignal("");
    return <>
        <Show when={config.token}>
            <A href="/words/new" class="link">Create New</A>
        </Show>
        <input placeholder="Search for English word or Washimiji word" style="width: 100%; margin-top: 12px; margin-bottom: 12px;"
            onKeyPress={(ev) => {
                if (ev.key == "Enter") {
                    abortController.abort();
                    abortController = new AbortController();
                    // @ts-ignore
                    client.words.search(ev.target.value == "" ? "#notderived" : ev.target.value, abortController.signal).then(setWords);
                    // @ts-ignore
                    setLastSearched(ev.target.value);
                }
            }} ></input>
        <Show when={words() != null} fallback={<h2>Loading...</h2>}>
            <div class="terms">
                <For each={words()} fallback={
                    <>
                        <p>Couldn't find anything for "{lastSearched()}". :(</p>
                    </>
                }>
                    {(word, index) => {
                        return <A href={`/words/${word._id}`}><WordTerm word={word} /></A>
                    }}
                </For>
            </div>
        </Show>
    </>
}

export default WordsIndex;