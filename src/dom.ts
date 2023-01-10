export const $ = (sel: string, dom: Document | Element = document) => dom.querySelector<HTMLElement>(sel);
export const $$ = (sel: string, dom: Document | Element = document) => [...dom.querySelectorAll<HTMLElement>(sel)];

export const event = (dom: Element | null, name: string, f: (e: Event) => void) => 
  dom?.addEventListener(name, f, false);
  
export const show = (dom: HTMLElement | null) => dom && (dom.style.display = "");
export const hide = (dom: HTMLElement | null) => dom && (dom.style.display = "none");

export const shake_dom = (dom?: HTMLElement) => {
  if (!dom) return;
  dom.classList.add("shake");
  setTimeout(() => {
    dom.classList.remove("shake");
  }, 1000);
};


