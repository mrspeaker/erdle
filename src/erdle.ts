// prettier-ignore
const alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"] as const;
type Alpha = typeof alphabet[number];
export type Word = Alpha[];

export enum GuessState {
  "none" = 0,
  "misordered" = 1,
  "found" = 2,
}
export type GuessStatus = GuessState[];
export type GuessResult = [Word, GuessStatus];
export type GuessHistory = GuessResult[];
export type GameState = {
  state: string;
  target: Word;
  guesses: GuessHistory[];
  guess_doms: HTMLElement[][];
  cur_guess: Word;
  words: string[];
};

export const create_word = (str: string): Word =>
  str.split("").map((ch) => (alphabet.includes(ch) ? ch : "z"));

export const is_solved = (guess: GuessStatus) =>
  guess.length && guess.every((g) => g === GuessState.found);

export const test_guess = (guess: Word, target: Word): GuessStatus => {
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

export const add_guess = (
  guess: Word,
  target: Word,
  history: GuessHistory
): [GuessStatus, GuessHistory] => {
  const result = test_guess(guess, target);
  history.push([guess, result]);
  return [result, history];
};

export const guess_is_valid_wordle = (guess: Word, wordles: string[]) =>
  wordles.includes(guess.join(""));

export const decode_param = (coded?: string) => {
  if (!coded) return null;
  const uncoded = atob(coded);
  const word = uncoded.toLowerCase();
  if (word.match(/^[a-z]{5}$/)) {
    return word;
  }
  return null;
};

