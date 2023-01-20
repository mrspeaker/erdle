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
import type { Action, Dispatcher } from "./store";
import {
    isGAME_START,
    isLETTER_ADD,
    isLETTER_REMOVE,
    isWORD_GUESS,
} from "./store";

import { $, $$, add_class, remove_class, event, shake_dom } from "./dom";

async function init_app() {
    const params = get_params();
    const words = await load_words();
    const guess_doms = $$("#guesses > div").map((d) => $$("span", d));

    // == Here's where `game` gets mutated ==
    let game = init_game(words, guess_doms);
    const dispatch: Dispatcher = (action: Action) =>
        (game = reducer(game, action));

    $$(".again").forEach((d) =>
        event(d, "click", (e) => {
            e.preventDefault();
            dispatch({ type: "GAME_START" });
            document.activeElement.blur();
        })
    );
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
            dispatch({ type: "LETTER_ADD", payload: { key: key as Alpha } });
        }
    });

    const handleKeyboard = (target: HTMLElement) => {
        const { nodeName, innerText } = target;
        if (nodeName.trim().toLowerCase() === "span") {
            const key = innerText.trim().toLowerCase();
            if (key === "go") {
                dispatch({ type: "WORD_GUESS" });
            } else if (key === "del") {
                dispatch({ type: "LETTER_REMOVE" });
            } else {
                // TODO check key is [a-z]
                dispatch({
                    type: "LETTER_ADD",
                    payload: { key: key as Alpha },
                });
            }
        }
    };

    event($("#keyboard"), "touchstart", (e: Event) => {
        const touch = e as TouchEvent;
        const { target } = touch;
        if (!target) return;
        e.preventDefault(); // Don't trigger click
        handleKeyboard(target as HTMLElement);
    });

    event($("#keyboard"), "click", (e) => {
        const { target } = e;
        if (!target) return;
        handleKeyboard(target as HTMLElement);
    });

    dispatch({
        type: "GAME_START",
        payload: { custom: decode_param(params.word) },
    });
}
init_app();

// ===========================

const init_game = (
    words: string[],
    guess_doms: HTMLElement[][],
    target?: Word
): GameState => ({
    state: "GAME_INIT",
    target: target || (words[(Math.random() * words.length) | 0] as Word),
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

const reducer = (state: GameState, action: Action): GameState => {
    if (isGAME_START(action)) {
        const game = init_game(
            state.words,
            state.guess_doms,
            create_word(
                action.payload?.custom ??
                    state.words[(Math.random() * state.words.length) | 0]
            )
        );
        reset_dom(game.guess_doms);
        return {
            ...game,
            state: "GAME_IN_PROGRESS",
        };
    }

    if (isLETTER_ADD(action)) {
        return on_add_letter(state, action.payload.key);
    }

    if (isLETTER_REMOVE(action)) {
        return on_remove_letter(state);
    }

    if (isWORD_GUESS(action)) {
        return on_guess(state);
    }

    console.warn("unhandled action", action);
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
    if (next_guess.length === target.length) {
        if (!guess_is_valid_wordle(next_guess, game.words)) {
            add_class(guess_doms[guesses.length], "invalid");
        } else {
            remove_class(guess_doms[guesses.length], "invalid");
        }
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

    remove_class(guess_doms[guesses.length], "invalid");
    guess_doms[guesses.length][cur_guess.length - 1].innerText = "";
    return {
        ...game,
        cur_guess: cur_guess.slice(0, -1),
    };
};

const on_guess = (game: GameState): GameState => {
    const { cur_guess, guesses, guess_doms, max_guesses, target, words } = game;

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

const reset_dom = (doms: HTMLElement[][]) => {
    doms.map((ds) =>
        ds.forEach((d) => {
            d.classList.remove(
                "flip",
                "found",
                "misordered",
                "nope",
                "shake",
                "invalid"
            );
            d.innerText = "";
        })
    );
    $$("#keyboard > div > span").forEach((s) =>
        s.classList.remove("found", "nope", "misordered")
    );
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
