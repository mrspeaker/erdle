import { $, event, show, hide } from "./dom";

const playDiv = $("#playDiv");
const badDiv = $("#badDiv");
const txtWord = $("#txtWord") as HTMLInputElement | null;
const link = $("#playIt") as HTMLLinkElement | null;

const test_word = () => {
    const word = txtWord?.value.toLowerCase() ?? "";
    if (word.match(/^[a-z]{5}$/)) {
        link?.setAttribute("href", `./?word=${btoa(word)}`);
        show(playDiv);
        hide(badDiv);
    } else {
        hide(playDiv);
        show(badDiv);
    }
};

hide(playDiv);
event(txtWord, "keyup", test_word);

export {};
