/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import { Client } from './util/client';
import localforage from 'localforage';
import Routing from './Routing';

type Config = {
  token?: string
}

export let config = ((await localforage.getItem("washimiji.config")) ?? {}) as Config;

export const saveConfig = async () => {
    await localforage.setItem("washimiji.config", config);
}

export const client = new Client(import.meta.env.VITE_API_URL, config.token);

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <Routing />, root!);
