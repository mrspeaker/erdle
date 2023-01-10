import {
  create_word,
  decode_param,
  GuessState,
  guess_is_valid_wordle,
  is_solved,
  test_guess,
} from "./meedle";

import type { GameState, GuessStatus, Word } from "./meedle";

import { $, $$, event, shake_dom } from "./dom";

async function init_app() {
  const params = get_params();
  const words = await load_words();
  const target_word =
    decode_param(params.word) ?? words[(Math.random() * words.length) | 0];

  const guess_doms = $$("#guesses > div").map((d) => $$("span", d));

  // == Here's where game gets mutated ==
  const dispatch = (action: object) => (game = reducer(game, action));
  let game = init_game(create_word(target_word), words, guess_doms);
  // ====================================

  event(document.body, "keydown", (e) => {
    if (e.code === "Enter") {
      dispatch({ type: "WORD_GUESS" });
    } else if (e.code === "Backspace") {
      dispatch({ type: "LETTER_REMOVE" });
    } else if (e.code.startsWith("Key")) {
      dispatch({ type: "LETTER_ADD", key: e.key });
    }
  });

  event($("#keyboard"), "click", (e) => {
    const { target } = e;
    const { nodeName, innerText } = target;
    if (nodeName.trim().toLowerCase() === "span") {
      const key = innerText.trim().toLowerCase();
      if (key === "go") {
        dispatch({ type: "WORD_GUESS" });
      } else if (key === "del") {
        dispatch({ type: "LETTER_REMOVE" });
      } else {
        dispatch({ type: "LETTER_ADD", key });
      }
    }
  });

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
  alphabet: [],
});

// ============================
async function load_words() {
  return fetch("./words")
    .then((r) => r.text())
    .then((raw) => raw.split("\n"));
}

function get_params() {
  return Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
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
    case "LETTER_REMOVE":
      return on_remove_letter(state);
    case "WORD_GUESS":
      return on_guess(state);
    default:
      console.warn("unhandled action", action);
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

  // TODO: should at least be done in reducer
  guess_doms[guesses.length][next_guess.length - 1].innerText = ch_low;
  return {
    ...game,
    cur_guess: next_guess,
  };
};

const on_remove_letter = (game: GameState): GameState => {
  const { cur_guess, guesses, guess_doms } = game;
  if (!cur_guess.length) {
    return game;
  }

  // TODO: should at least be done in reducer
  guess_doms[guesses.length][cur_guess.length - 1].innerText = "";
  return {
    ...game,
    cur_guess: cur_guess.slice(0, -1),
  };
};

const on_guess = (game: GameState): GameState => {
  const { cur_guess, guesses, guess_doms, target, words } = game;

  const isFullGuess = cur_guess.length === 5;
  const result = test_guess(cur_guess, target);
  const solved = isFullGuess && is_solved(result);
  const valid = guess_is_valid_wordle(cur_guess, words);

  if (solved || valid) {
    // Add guess and reset current
    color_dom(guess_doms[guesses.length], result);
    // TODO: copy not mutate
    guesses.push([cur_guess.slice(0), result]);
    game.cur_guess = [];
    if (guesses.length === 6 || solved) {
      game.state = "GAME_OVER";
      if (!solved) {
        alert("Was: " + target.join(""));
      }
    }
    // TODO: set keyboard key colors
    return game;
  }
  if (!valid && isFullGuess) {
    shake_dom(guess_doms[guesses.length][0].parentNode as HTMLElement);
  }

  return game;
};

const color_dom = (doms: HTMLElement[], status: GuessStatus) =>
  doms.forEach((d, i) => {
    const key = $(
      `#keyboard > div > span[data-key="${d?.textContent.toLowerCase() ?? ""}"]`
    );
    d.classList.remove("misordered", "found");
    const t = i * 0.4;
    const t_delay = Math.max(0, t - 0.1);
    d.style.animationDelay = t_delay + "s";
    d.classList.add("flip");
    setTimeout(() => {
      if (status[i] === GuessState.misordered) {
        d.classList.add("misordered");
        if (!key?.classList.contains("found")) {
          key?.classList.add("misordered");
        }
      } else if (status[i] === GuessState.found) {
        d.classList.add("found");
        key?.classList.add("found");
      } else {
        key?.classList.add("nope");
      }
    }, t * 1000);
  });
