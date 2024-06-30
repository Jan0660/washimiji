import { createSignal, Show } from "solid-js";
import CharacterTerm from "../../components/CharacterTerm";
import { Character } from "../../util/client"
import { client } from "../..";
import { useParams } from "@solidjs/router";

export default function CharacterPage() {
    const [character, setCharacter] = createSignal(null as Character | null);
    const params = useParams();
    client.characters.get(params["id"]).then(setCharacter);

    return <Show when={character()} fallback={<h2>Loading...</h2>}>
        <CharacterTerm character={character()!} />
    </Show>
}