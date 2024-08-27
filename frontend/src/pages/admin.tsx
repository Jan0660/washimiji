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
        <button onClick={async () => {
            await client.admin.derivedWords();
            window.location.reload();
        }}>Make Derived Words</button>
        <br/>
        <label>
            <input type="checkbox" checked={config.checkAlways} onInput={async (ev) => {
                config.checkAlways = ev.target.checked;
                await saveConfig();
            }}/>
            Check for new font on every reload
        </label>
        <br />
        <label>
            <input type="checkbox" checked={config.showPartPlacement} onInput={async (ev) => {
                config.showPartPlacement = ev.target.checked;
                await saveConfig();
            }}/>
            Show manual move and multiply controls on character parts
        </label>
    </>
}