import { createSignal, For, Show } from "solid-js";
import { WordWithText } from "../../util/client";
import { client, config } from "../..";
import WordTerm from "../../components/WordTerm";
import { A } from "@solidjs/router";

const WordsIndex = () => {
    const [words, setWords] = createSignal(null as WordWithText[] | null);
    client.words.getAllWithText().then(setWords);
    return <>
        <Show when={config.token}>
            <A href="/words/new" class="link">Create New</A>
        </Show>
        <Show when={words() != null} fallback={<h2>Loading...</h2>}>
            <div class="terms">
                <For each={words()}>
                    {(word, index) => {
                        return <A href={`/words/${word._id}`}><WordTerm word={word} /></A>
                    }}
                </For>
            </div>
        </Show>
    </>
}

export default WordsIndex;