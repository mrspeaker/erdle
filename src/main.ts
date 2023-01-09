import {
  create_word,
  decode_param,
  GuessState,
  guess_is_valid_wordle,
  is_solved,
  test_guess,
} from "./erdle";

import type {
  GameState,
  GuessStatus,
  Word,
} from "./erdle";

import { $, $$, shake_dom } from "./dom";

async function init_app() {
  const params = get_params();
  const words = await load_words();
  const target_word =
    decode_param(params.word) ?? words[(Math.random() * words.length) | 0];
    
  const guess_doms = $$("#guesses > div").map((d) => $$("span", d));

  // == Here's where game gets mutated ==
  let game = init_game(
    create_word(target_word),
    words,
    guess_doms
  );
  const dispatch = (action: object) => (game = reducer(game, action));
  // ====================================
  
  document.body.addEventListener(
    "keydown",
    (e) => {
      if (e.code === "Enter") {
        on_guess(game);
      } else if (e.code === "Backspace") {
        on_remove_letter(game);
      } else if (e.code.startsWith("Key")) {
        dispatch({ type: "LETTER_ADD", key: e.key });
      }
    },
    false
  );

  $("#keyboard")?.addEventListener(
    "click",
    (e) => {
      const { target } = e;
      const { nodeName, innerText } = target;
      if (nodeName.trim().toLowerCase() === "span") {
        const key = innerText.trim().toLowerCase();
        if (key === "go") {
          on_guess(game);
        } else if (key === "del") {
          on_remove_letter(game);
        } else {
          dispatch({ type: "LETTER_ADD", key });
        }
      }
    },
    false
  );

  dispatch({ type: "GAME_START" });
}
init_app();

// ===========================
const init_game = (
  target: Word,
  words: string[],
  guess_doms: HTMLElement[][]
): GameState => ({
  state: "GAME_INIT",
  target,
  guesses: [],
  guess_doms,
  cur_guess: [],
  words,
});

// ============================
async function load_words() {
  return fetch("./words")
    .then((r) => r.text())
    .then((raw) => raw.split("\n"));
}

function get_params () {
  return Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  )
}

const reducer = (state: GameState, action: object): GameState => {
  console.log("Action:", action.type);
  switch (action.type) {
    case "GAME_START":
      return {
        ...state,
        state: "GAME_IN_PROGRESS",
      };
    case "LETTER_ADD":
      return on_add_letter(state, action.key);
  }
  return state;
};

const on_add_letter = (game: GameState, ch: string[1]): GameState => {
  const { cur_guess, target, guesses, guess_doms, state } = game;
  if (state !== "GAME_IN_PROGRESS") {
    return game;
  }
  const ch_low = ch.toLowerCase();
  const next_guess = cur_guess.slice(0);
  
  if (next_guess.length === target.length) {
    // Just update the last character
    next_guess[next_guess.length - 1] = ch_low;
  } else {
    next_guess.push(ch_low);
  }
  // Hmmm... bad mutatin'... but it's the DOM. What to do?
  guess_doms[guesses.length][next_guess.length - 1].innerText = ch_low;
  return {
    ...game,
    cur_guess: next_guess,
  };
};

const on_remove_letter = (game: GameState) => {
  const { cur_guess, guesses, guess_doms } = game;
  if (cur_guess.length) {
    guess_doms[guesses.length][cur_guess.length - 1].innerText = "";
    cur_guess.pop();
  }
};

const on_guess = (game: GameState) => {
  const { cur_guess, guesses, guess_doms, target, words } = game;
  
  const isFullGuess = cur_guess.length === 5;
  const result = test_guess(cur_guess, target);
  const solved = isFullGuess && is_solved(result);
  const valid = guess_is_valid_wordle(cur_guess, words);

  if (solved || valid) {
    // Add guess and reset current
    color_dom(guess_doms[guesses.length], result);
    guesses.push([cur_guess.slice(0), result]);
    game.cur_guess = [];
    if (guesses.length === 6 || solved) {
      game.state = "GAME_OVER";
      alert(solved ? "success!" : "was: " + target.join(""));
    }
  } else if (!valid && isFullGuess) {
    shake_dom(guess_doms[guesses.length][0].parentNode as HTMLElement);    
  }
};

const color_dom = (doms: HTMLElement[], status: GuessStatus) => 
  doms.forEach((d, i) => {
    d.classList.remove("misordered", "found");
    if (status[i] === GuessState.misordered) d.classList.add("misordered");
    if (status[i] === GuessState.found) d.classList.add("found");
  });
