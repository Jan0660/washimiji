import { createSignal, For, Show } from "solid-js";
import { Character } from "../../util/client";
import { client, config } from "../..";
import CharacterTerm from "../../components/CharacterTerm";
import { A } from "@solidjs/router";

const CharactersIndex = () => {
    const [characters, setCharacters] = createSignal(null as Character[] | null);
    client.characters.getAll().then(setCharacters);
    return <>
        <Show when={config.token}>
            <A href="/characters/new" class="link">Create New</A>
        </Show>
        <Show when={characters() != null} fallback={<h2>Loading...</h2>}>
            <div class="terms">
                <For each={characters()}>
                    {(char, index) => {
                        return <A href={`/characters/${char._id}`}><CharacterTerm character={char} /></A>
                    }}
                </For>
            </div>
        </Show>
    </>
}

export default CharactersIndex;