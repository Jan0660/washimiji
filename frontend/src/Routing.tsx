import { Router, Route } from '@solidjs/router';
import { Component } from 'solid-js';

import App from './App';
import Index from './pages/index'
import NotFound from './pages/404';
import CharactersIndex from './pages/characters';
import NewCharacterPage from './pages/characters/new';
import EditCharacterPage from './pages/characters/edit';
import CharacterPage from './pages/characters/character';
import Admin from './pages/admin';
import WordsIndex from './pages/words/index';
import NewWordPage from './pages/words/new';
import EditWordPage from './pages/words/edit';
import WordPage from './pages/words/word';
import Convert from './pages/convert';
import Info from './pages/info';

const Routing: Component = () => {
    return <Router root={App}>
          <Route path="/" component={Index} />
          <Route path="/characters">
            <Route path="/" component={CharactersIndex} />
            <Route path="/new" component={NewCharacterPage} />
            <Route path="/:id/edit" component={EditCharacterPage} />
            <Route path="/:id" component={CharacterPage} />
          </Route>
          <Route path="/words">
            <Route path="/" component={WordsIndex} />
            <Route path="/new" component={NewWordPage} />
            <Route path="/:id/edit" component={EditWordPage} />
            <Route path="/:id" component={WordPage} />
          </Route>
          <Route path="/convert" component={Convert} />
          <Route path="/info" component={Info} />
          <Route path="/admin" component={Admin} />
          <Route path="*404" component={NotFound} />
    </Router>
}

export default Routing