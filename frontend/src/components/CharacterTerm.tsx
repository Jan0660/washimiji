import { Show } from "solid-js";
import { Character } from "../util/client";
import { config } from "..";
import { A } from "@solidjs/router";

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
            </p>
        </Show>
    </div>
}