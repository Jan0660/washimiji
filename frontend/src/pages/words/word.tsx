import { createSignal, Show } from "solid-js";
import { WordWithText } from "../../util/client"
import { client } from "../..";
import { useParams } from "@solidjs/router";
import WordTerm from "../../components/WordTerm";

export default function WordPage() {
    const [word, setWord] = createSignal(null as WordWithText | null);
    const params = useParams();
    client.words.getWithText(params["id"]).then(setWord);

    return <Show when={word()} fallback={<h2>Loading...</h2>}>
        <WordTerm word={word()!} />
    </Show>
}