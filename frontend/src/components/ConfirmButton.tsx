import { createSignal } from "solid-js";

export default function ConfirmButton(props: { initialText: string, doneText: string, action: () => Promise<void> }) {
    const [state, setState] = createSignal(0 as 0 | 1 | 2);
    return <a class="link" onclick={async () => {
        if (state() == 1) {
            await props.action();
            setState(2);
        } else if (state() == 0) {
            setState(1);
        }
    }}>{state() != 0 ? (state() == 1 ? "Are you sure?" : props.doneText) : props.initialText}</a>
}