import { createSignal, For, Show } from "solid-js";
import { WordWithText } from "../../util/client"
import { client } from "../..";
import { useParams } from "@solidjs/router";
import WordTerm from "../../components/WordTerm";

export default function WordPage() {
    const [word, setWord] = createSignal(null as WordWithText | null);
    const [derivedWords, setDerivedWords] = createSignal([] as WordWithText[]);
    const params = useParams();
    client.words.getWithText(params["id"]).then(setWord);
    client.words.getDerived(params["id"]).then(setDerivedWords);

    return <>
        <Show when={word()} fallback={<h2>Loading...</h2>}>
            <WordTerm word={word()!} />
        </Show>
        <h2>Derived Words</h2>
        <Show when={derivedWords()}>
            <For each={derivedWords()}>
                {(item, _) => <WordTerm word={item} />}
            </For>
        </Show>
    </>
}