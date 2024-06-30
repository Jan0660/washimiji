import { createSignal, Show } from "solid-js";
import { Character } from "../../util/client";
import CharacterEditor from "../../components/CharacterEditor";
import { client } from "../..";
import { useNavigate, useParams } from "@solidjs/router";

export default function EditCharacterPage() {
    const [character, setCharacter] = createSignal(null as Character | any);
    const params = useParams();
    client.characters.get(params["id"]).then(setCharacter);
    const navigate = useNavigate();
    return <Show when={character()} fallback={<h2>Loading...</h2>}>
        <CharacterEditor character={character()} setCharacter={setCharacter} />
        <button onClick={async () => {
            await client.characters.patch(character());
            navigate("/characters/" + character()._id);
        }}>Edit</button>
    </Show>
}