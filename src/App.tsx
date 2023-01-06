import { useState } from "react";
import "./App.css";

const letters = "abcdefghijklmnopqrstuvwxyz".split("");
type letter = typeof letters;
const no_letter: unique symbol = Symbol("none");

type letter_guess = letter | typeof no_letter;
type Guess = [
  letter_guess,
  letter_guess,
  letter_guess,
  letter_guess,
  letter_guess
];

const create_word = (str: string) => str.split("");
const reset_word = (word: Guess): Guess => word.map(() => no_letter);

function App() {
  return <div className="App">hi</div>;
}

export default App;
