export const $ = (sel: string, dom: Document | Element = document) => dom.querySelector<HTMLElement>(sel);
export const $$ = (sel: string, dom: Document | Element = document) => [...dom.querySelectorAll<HTMLElement>(sel)];

export const shake_dom = (dom?: HTMLElement) => {
    if (!dom) return;
    dom.classList.add("shake");
    setTimeout(() => {
      dom.classList.remove("shake");
    }, 1000);
  };

