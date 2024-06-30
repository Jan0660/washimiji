import { createEffect, createSignal, Show } from "solid-js";
import { client } from "..";
import { AxiosError, CanceledError } from "axios";
import { ConvertResponse } from "../util/client";

export default function Convert() {
    const [input, setInput] = createSignal("");
    const [output, setOutput] = createSignal("");
    const [error, setError] = createSignal("");
    const [way, setWay] = createSignal("to" as "to" | "from")
    const [vertical, setVertical] = createSignal(false);
    const [upright, setUpright] = createSignal(false);
    let abortController = new AbortController();
    createEffect(() => {
        abortController.abort();
        abortController = new AbortController();
        setError("");
        client.convert[way()](input(), abortController.signal).then((res: ConvertResponse) => setOutput(res.text)).catch((exception: any) => {
            console.log(exception);
            if (exception instanceof CanceledError) return;
            if (exception instanceof AxiosError) {
                setError(exception.response!.data.error);
            }
        });
    });
    setInput("Hello, world!");
    return <div>
        <textarea style="width: 90%; min-height: 40%;" value={input()} onInput={(ev) => setInput(ev.target.value)} placeholder="Input" />
        <select value={way()} onInput={(ev) => setWay(ev.target.value as any)}>
            <option value="to">English -&gt; Washimiji</option>
            <option value="from">Washimiji -&gt; English</option>
        </select>
        <label><input type="checkbox" checked={vertical()} onInput={ev => setVertical(ev.target.checked)}/>Vertical</label>
        <label><input type="checkbox" checked={upright()} onInput={ev => setUpright(ev.target.checked)}/>Upright</label>
        <Show when={error() == ""} fallback={<p style="color: red;">{error()}</p>}>
            <p style={(vertical() ? "writing-mode: vertical-rl;" : "") + (upright() ? "text-orientation: upright;" : "")}>{output()}</p>
        </Show>
    </div>
}