import styles from './App.module.css';
import { A, RouteSectionProps } from '@solidjs/router';

const App = (props: RouteSectionProps<unknown>) => {
  return (
    <div class={styles.App}>
      <div class={styles.body}>
        <A href="/" style="text-decoration: none;">
          <h1 class={styles.header}>
            Washimiji
          </h1>
        </A>
        <div class={styles.linkBar}>
          <A href="/words" class="link">Words</A>
          <A href="/characters" class="link">Characters</A>
          <A href="/convert" class="link">Translator</A>
          <A href="/info" class="link">Info</A>
        </div>
        {props.children}
      </div>
    </div>
  );
};

export default App;
