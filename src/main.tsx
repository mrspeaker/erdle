// prettier-ignore
const alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"] as const;
type Alpha = typeof alphabet[number];
type Word = Alpha[];

enum GuessState {
  "none",
  "misordered",
  "found",
}
type GuessStatus = GuessState[];
type GuessResult = [Word, GuessStatus];
type GuessHistory = GuessResult[];
type GameState = {
  state: string;
  target: Word;
  guesses: GuessHistory[];
  guess_doms: HTMLElement[][];
  cur_guess: Word;
  words: string[];
};

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

const create_word = (str: string): Word =>
  str.split("").map((ch) => (alphabet.includes(ch) ? ch : "z"));

const is_solved = (guess: GuessStatus) =>
  guess.every((g) => g === GuessState.found);

const test_guess = (guess: Word, target: Word): GuessStatus => {
  if (guess.length !== target.length) {
    throw new Error("Bad word lengths");
  }

  // mark direct hits
  const marked = guess.map((ch, i) => ch === target[i]);
  return guess.map((ch, i) => {
    if (ch === target[i]) {
      return GuessState.found;
    }
    let state = GuessState.none;
    for (let j = 0; j < target.length; j++) {
      if (ch === target[j] && !marked[j]) {
        state = GuessState.misordered;
        marked[j] = true;
      }
    }
    return state;
  });
};

const add_guess = (
  guess: Word,
  target: Word,
  history: GuessHistory
): [GuessStatus, GuessHistory] => {
  const result = test_guess(guess, target);
  history.push([guess, result]);
  return [result, history];
};

const guess_is_valid_wordle = (guess: Word, wordles: string[]) =>
  wordles.includes(guess.join(""));

const decode_param = (coded?: string) => {
  if (!coded) return null;
  const uncoded = atob(coded);
  const word = uncoded.toLowerCase();
  if (word.match(/^[a-z]{5}$/)) {
    return word;
  }
  return null;
};

const load_words = async () =>
  fetch("./words")
    .then((r) => r.text())
    .then((raw) => raw.split("\n"));

async function init_app() {
  const params = Object.fromEntries(
    new URLSearchParams(window.location.search).entries()
  );
  const words = await load_words();
  const target_word =
    decode_param(params.word) ?? words[(Math.random() * words.length) | 0];

  let game = init_game(
    create_word(target_word),
    words,
    [...document.querySelectorAll("#guesses > div")].map((d) =>
      d.querySelectorAll("span")
    )
  );
  const dispatch = (action: object) => (game = reducer(game, action));

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

  document.getElementById("keyboard")?.addEventListener(
    "click",
    (e) => {
      if (e.target.nodeName.trim().toLowerCase() === "span") {
        const key = e.target.innerText.trim().toLowerCase();
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

const on_add_letter = (game: GameState, ch: string[1]): GameState => {
  const { cur_guess, target, guesses, guess_doms, state } = game;
  if (state !== "GAME_IN_PROGRESS") {
    return game;
  }
  const ch_low = ch.toLowerCase();
  const next_guess = cur_guess.slice(0);
  if (next_guess.length === target.length) {
    next_guess[next_guess.length - 1] = ch_low;
  } else {
    next_guess.push(ch_low);
  }
  // Hmmm...
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
  const result = test_guess(cur_guess, target);
  const solved = is_solved(result);
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
  } else if (!valid) {
    alert("bad word, try again!");
  }
};

const color_dom = (doms: HTMLElement[], status: GuessStatus) => {
  doms.forEach((d, i) => {
    d.classList.remove("misordered", "found");
    if (status[i] === 1) d.classList.add("misordered");
    if (status[i] === 2) d.classList.add("found");
  });
};

function init_game(
  target: Word,
  words: string[],
  guess_doms: HTMLElement[][]
): GameState {
  return {
    state: "GAME_INIT",
    target,
    guesses: [],
    guess_doms,
    cur_guess: [],
    words,
  };
}

init_app();
