import { createSignal } from "solid-js";
import { client, config, saveConfig } from "..";

export default function Admin() {
    const [token, setToken] = createSignal("");
    return <>
        <input type="text" value={token()} onInput={(e) => setToken(e.target.value)} placeholder="Token" />
        <button onClick={async () => {
            config.token = token();
            await saveConfig();
            window.location.reload();
        }}>Set Token</button>
        <br/>
        <button onClick={async () => {
            await client.makeFont();
            window.location.reload();
        }}>Make Font</button>
    </>
}