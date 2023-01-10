import { $, event, show, hide } from "./dom";

const txtWord = $("#txtWord");
const link = $("#playIt");
const playDiv = $("#playDiv");
const badDiv = $("#badDiv");

hide(playDiv);

const test_word = () => {
  const word = txtWord?.value.toLowerCase() ?? "";
  if (word.match(/^[a-z]{5}$/)) {
    link?.setAttribute("href", `/?word=${btoa(word)}`);
    show(playDiv);
    hide(badDiv);
  } else {
    hide(playDiv);
    show(badDiv);
  }
};

event(txtWord, "keyup",test_word);

export {}