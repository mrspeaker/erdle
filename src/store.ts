import type { Alpha } from "./meedle";

export interface Action {
    type: string;
    payload?: any;
}
export interface GameStartAction extends Action {
    type: "GAME_START";
    payload?: {
        custom?: string;
    };
}
export const isGAME_START = (action: Action): action is GameStartAction =>
    action.type === "GAME_START";

export interface LetterAddAction extends Action {
    type: "LETTER_ADD";
    payload: {
        key: Alpha;
    };
}
export const isLETTER_ADD = (action: Action): action is LetterAddAction =>
    action.type === "LETTER_ADD";

export interface LetterRemoveAction extends Action {
    type: "LETTER_REMOVE";
}
export const isLETTER_REMOVE = (action: Action): action is LetterRemoveAction =>
    action.type === "LETTER_REMOVE";

export interface WordGuessAction extends Action {
    type: "WORD_GUESS";
}
export const isWORD_GUESS = (action: Action): action is WordGuessAction =>
    action.type === "WORD_GUESS";

export type Dispatcher = (action: Action) => void;
