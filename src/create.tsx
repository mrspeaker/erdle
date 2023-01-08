const txt_word = document.getElementById("txtWord");
const link = document.getElementById("playIt");
const playDiv = document.getElementById("playDiv");
const badDiv = document.getElementById("badDiv");
const btnGo = document.getElementById("go");

playDiv.style.visibility = "hidden";

const test_word = () => {
  const word = txt_word.value.toLowerCase();
  if (word.match(/^[a-z]{5}$/)) {
    link.setAttribute("href", `/?word=${btoa(word)}`);
    playDiv.style.visibility = "visible";
    badDiv.style.visibility = "hidden";
  } else {
    badDiv.style.visibility = "visible";
    playDiv.style.visibility = "hidden";
  }
};

btnGo?.addEventListener("click", test_word, false);
txt_word?.addEventListener("keyup", () => test_word, false);
