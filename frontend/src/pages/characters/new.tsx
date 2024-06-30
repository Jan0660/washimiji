import { createSignal } from "solid-js";
import { Character } from "../../util/client";
import CharacterEditor from "../../components/CharacterEditor";
import { client } from "../..";
import { useNavigate } from "@solidjs/router";

export default function NewCharacterPage() {
    const [character, setCharacter] = createSignal({makeInfo: {}} as Character);
    const navigate = useNavigate();
    return <>
        <CharacterEditor character={character()} setCharacter={setCharacter} />
        <button onClick={async () => {
            const char = await client.characters.post(character());
            navigate("/characters/" + char._id);
        }}>Create</button>
    </>
}