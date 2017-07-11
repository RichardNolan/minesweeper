import React, { Component } from 'react';
import Minesweeper from './components/minesweeper.jsx';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Minesweeper/>
      </div>
    );
  }
}

export default App;
