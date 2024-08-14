/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import { Client } from './util/client';
import localforage from 'localforage';
import Routing from './Routing';

type Config = {
  token?: string
  fontMTime?: number
  kanjiVGFontMTime?: number
  mTimeCheck?: number
  checkAlways?: boolean
}

export let config = ((await localforage.getItem("washimiji.config")) ?? {}) as Config;

export const saveConfig = async () => {
  await localforage.setItem("washimiji.config", config);
}

// @ts-ignore
globalThis.washimijiConfig = config;
// @ts-ignore
globalThis.washimijiSaveConfig = saveConfig;

export const client = new Client(import.meta.env.VITE_API_URL, config.token);

export const setFontStyles = () => {
  let style = document.getElementById("font-styles")!;
  style.innerHTML = `
@font-face {
          font-family: kanjivg-font;
          src: url(${import.meta.env.VITE_STATIC_FILES}/kanjivg-font.ttf?t=${config.kanjiVGFontMTime});
      }
      @font-face {
          font-family: washimiji-font;
          src: url(${import.meta.env.VITE_STATIC_FILES}/font.ttf?t=${config.fontMTime});
      }`
  
};

if ((!config.mTimeCheck || config.mTimeCheck < Date.now() - 10 * 60 * 1000) || config.checkAlways) {
  client.mtimes().then((mtimes) => {
    let firstCheck = !config.fontMTime;
    let different = mtimes["font.ttf"] != config.fontMTime || mtimes["kanjivg-font.tff"] != config.kanjiVGFontMTime;
    config.fontMTime = mtimes["font.ttf"];
    config.kanjiVGFontMTime = mtimes["kanjivg-font.ttf"];
    if (!firstCheck && different) {
      setFontStyles();
    }
    config.mTimeCheck = Date.now();
    saveConfig();
  })
}

if (config.fontMTime) {
  setFontStyles();
}

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <Routing />, root!);
