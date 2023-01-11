import {
    create_word,
    decode_param,
    GuessResult,
    GuessState,
    guess_is_valid_wordle,
    is_solved,
    test_guess,
} from "./meedle";

import type { Alpha, GameState, GuessStatus, Word } from "./meedle";

import { $, $$, event, shake_dom } from "./dom";

async function init_app() {
    const params = get_params();
    const words = await load_words();
    const target_word =
        decode_param(params.word) ?? words[(Math.random() * words.length) | 0];

    const guess_doms = $$("#guesses > div").map((d) => $$("span", d));

    // == Here's where `game` gets mutated ==
    const dispatch = (action: Action) => (game = reducer(game, action));
    let game = init_game(create_word(target_word), words, guess_doms);
    
    $$(".again").forEach(d => event(d, "click", (e) => {
        e.preventDefault();
        // Reset DOM
        //game = init_game(create_word(words[(Math.random() * words.length) | 0]), words, guess_doms);
        //dispatch({ type: "GAME_START" });
        window.location = "./index.html";
    }));
    // ====================================

    event(document.body, "keydown", (e: Event) => {
        const code = (e as KeyboardEvent).code;
        const key = (e as KeyboardEvent).key;
        if (code === "Enter") {
            dispatch({ type: "WORD_GUESS" });
        } else if (code === "Backspace") {
            dispatch({ type: "LETTER_REMOVE" });
        } else if (code.startsWith("Key")) {
            // TODO check key is [a-z]
            dispatch({ type: "LETTER_ADD", key: key as Alpha });
        }
    });

    event($("#keyboard"), "click", (e) => {
        const { target } = e;
        if (!target) return;
        
        const { nodeName, innerText } = target as HTMLElement;
        if (nodeName.trim().toLowerCase() === "span") {
            const key = innerText.trim().toLowerCase();
            if (key === "go") {
                dispatch({ type: "WORD_GUESS" });
            } else if (key === "del") {
                dispatch({ type: "LETTER_REMOVE" });
            } else {
                // TODO check key is [a-z]
                dispatch({ type: "LETTER_ADD", key: key as Alpha });
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
    max_guesses: 6,
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

function get_params() {
    return Object.fromEntries(
        new URLSearchParams(window.location.search).entries()
    );
}

// =========================

type Action = { type: string, key?: Alpha };

const reducer = (state: GameState, action: Action): GameState => {
    console.log("ho", action.type);
    switch (action.type) {
        case "GAME_START":
            return {
                ...state,
                state: "GAME_IN_PROGRESS",
            };
        case "LETTER_ADD":
            return on_add_letter(state, action.key as Alpha);
        case "LETTER_REMOVE":
            return on_remove_letter(state);
        case "WORD_GUESS":
            return on_guess(state);
        default:
            console.warn("unhandled action", action);
    }
    return state;
};

// ============== Reducer functions ================

const on_add_letter = (game: GameState, ch: Alpha): GameState => {
    const { cur_guess, target, guesses, guess_doms, state } = game;
    if (state !== "GAME_IN_PROGRESS") {
        return game;
    }
    
    const next_guess: Word = cur_guess.slice(0);

    if (next_guess.length === target.length) {
        // Just update the last character
        next_guess[next_guess.length - 1] = ch;
    } else {
        next_guess.push(ch);
    }

    guess_doms[guesses.length][next_guess.length - 1].innerText = ch;
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

    guess_doms[guesses.length][cur_guess.length - 1].innerText = "";
    return {
        ...game,
        cur_guess: cur_guess.slice(0, -1),
    };
};

const on_guess = (game: GameState): GameState => {
    const { cur_guess, guesses, guess_doms, max_guesses, target, words } = game;
    
    console.log(JSON.stringify(cur_guess), JSON.stringify(guesses));

    const result = test_guess(cur_guess, target);
    const solved = is_solved(result, target.length);
    const valid = guess_is_valid_wordle(cur_guess, words);

    if (!solved && !valid) {
        // bad guess
        shake_dom(guess_doms[guesses.length][0].parentNode as HTMLElement);
        return game;
    }

    // ============= DOM Updates =============

    color_dom(guess_doms[guesses.length], result);

    const newGuess: GuessResult = [cur_guess.slice(0), result];
    const isGameOver = guesses.length + 1 === max_guesses || solved;
    isGameOver && show_word_dom(target.join(""));
    
    return {
        ...game,
        state: isGameOver ? "GAME_OVER" : game.state,
        cur_guess: [],
        guesses: [...guesses, newGuess],
    };
};

const color_dom = (doms: HTMLElement[], status: GuessStatus) =>
    doms.forEach((d, i) => {
        const key = $(
            `#keyboard > div > span[data-key="${
                d?.textContent?.toLowerCase() ?? ""
            }"]`
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

const show_word_dom = (target: string) => {
    const wordLink = $("#target-word") as HTMLLinkElement;
    const infoDiv = $("#target-info") as HTMLDivElement;
    
    wordLink.href = "https://www.thefreedictionary.com/" + target;
    wordLink.textContent = target;    
    infoDiv.style.visibility = "visible";
};
