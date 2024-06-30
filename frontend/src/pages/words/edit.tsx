import { createSignal, Show } from "solid-js";
import { client } from "../..";
import { useNavigate, useParams } from "@solidjs/router";
import { Word } from "../../util/client";
import WordEditor from "../../components/WordEditor";

export default function EditWordPage() {
    const [word, setWord] = createSignal(null as Word | any);
    const params = useParams();
    client.words.get(params["id"]).then(setWord);
    const navigate = useNavigate();
    return <Show when={word()} fallback={<h2>Loading...</h2>}>
        <WordEditor word={word()} setWord={setWord} />
        <br />
        <button onClick={async () => {
            await client.words.patch(word());
            navigate("/words/" + word()._id);
        }}>Edit</button>
    </Show>
}