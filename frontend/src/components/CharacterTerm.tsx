import { Show } from "solid-js";
import { Character } from "../util/client";
import { client, config } from "..";
import { A } from "@solidjs/router";
import ConfirmButton from "./ConfirmButton";

export default function CharacterTerm(props: { character: Character }) {
    const char = props.character;
    return <div class="termBox">
        <span class="term">{char.makeInfo.code ? String.fromCodePoint(parseInt(char.makeInfo.code, 16)) : "???"}</span>
        <br />
        <span><b>Name: </b>{char.makeInfo.name}</span>
        <Show when={char.makeInfo.code}>
            <br />
            <span><b>Code: </b>{char.makeInfo.code}</span>
        </Show>
        <Show when={config.token}>
            <br/>
            <p class="termLinks">
                <A href={"/characters/" + char._id + "/edit"} class="link">Edit</A>
                {" "}
                <ConfirmButton initialText="Delete" doneText="Done" action={async () => {
                    await client.characters.delete(char._id);
                }} />
            </p>
        </Show>
    </div>
}