import { createSignal } from "solid-js";
import { client } from "../..";
import { useNavigate } from "@solidjs/router";
import { Word } from "../../util/client";
import WordEditor from "../../components/WordEditor";

export default function NewWordPage() {
    const [word, setWord] = createSignal({} as Word);
    const navigate = useNavigate();
    return <>
        <WordEditor word={word()} setWord={setWord} />
        <br />
        <button onClick={async () => {
            const char = await client.words.post(word());
            navigate("/words/" + char._id);
        }}>Create</button>
    </>
}