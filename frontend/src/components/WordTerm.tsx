import { Show } from "solid-js";
import { WordWithText } from "../util/client";
import { config } from "..";
import { A } from "@solidjs/router";

export default function WordTerm(props: { word: WordWithText }) {
    const word = props.word;
    return <div class="termBox">
        <span class="term">{word.text ?? "???"}</span>
        <br />
        <span><b>Words: </b>{word.words?.map(w => w.text)?.join(", ")}</span>
        <br />
        <span><b>Characters: </b>{word.characters?.join(", ")}</span>
        <Show when={config.token}>
            <br/>
            <p class="termLinks">
                <A href={"/words/" + word._id + "/edit"} class="link">Edit</A>
            </p>
        </Show>
    </div>
}