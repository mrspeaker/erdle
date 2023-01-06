import { useState } from "react";
import "./App.css";

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
type Alpha = typeof alphabet;
const Unguessed: unique symbol = Symbol("none");

type Guess = Alpha | typeof Unguessed;
type GuessState = Guess[];

const create_word = (str: string): GuessState => str.split("");
const reset_word = (word: GuessState): GuessState => word.map(() => Unguessed);

function App() {
  return <div className="App">hi</div>;
}

export default App;
