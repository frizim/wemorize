import './scss/admin.scss';
import { WysiwygEditor } from "./editor";

let qEditor: WysiwygEditor;
let aEditor: WysiwygEditor;
let qOld: string;
let aOld: string;
const editor = document.getElementById("card-editor");
const closeBtn = document.getElementById("close-editor");
let edited = false;
let cardId = -1;
let row: HTMLElement | null | undefined = null;

interface HtmxEvent {
    detail: {
        elt: HTMLElement,
        xhr: XMLHttpRequest,
        target: HTMLElement,
        requestConfig: unknown,
        parameters: Record<string, unknown>,
        path: string
    }
}

function onUpdate(props: unknown) {
    if(!edited && closeBtn) {
        edited = true;
        document.getElementById("save-card")?.classList.add("active");
    }
}

function getCardContents(): {card_id: number, question: string, answer: string} {
    return {
        card_id: cardId,
        question: qEditor.getHTML(),
        answer: aEditor.getHTML()
    };
}

function wrapped(parent: HTMLElement, outer: string, inner: string, ...classesInner: string[]): HTMLElement {
    const outerEl = document.createElement(outer);
    const innerEl = document.createElement(inner);
    for(const cl of classesInner) {
        innerEl.classList.add(cl);
    }
    outerEl.appendChild(innerEl);
    parent.appendChild(outerEl);
    return innerEl;
}

document.getElementById("save-card")?.addEventListener("htmx:configRequest", (e: unknown) => {
    const hxe = e as HtmxEvent;
    if(hxe.detail.elt.id == "save-card") {
        const {question, answer} = getCardContents();
        hxe.detail.parameters.card_id = cardId;
        hxe.detail.parameters.question = question;
        hxe.detail.parameters.answer = answer;
    }
});

document.getElementById("add-card")?.addEventListener("htmx:configRequest", (e: unknown) => {
    const hxe = e as HtmxEvent;
    if(hxe.detail.elt.id == "add-card") {
        const {question, answer} = getCardContents();
        const prev: HTMLElement|null|undefined = row?.previousElementSibling?.querySelector("td:last-of-type > button");
        if(prev) {
            hxe.detail.parameters.prev_id = prev.dataset.card;
        }
        hxe.detail.parameters.module = row?.parentElement?.parentElement?.parentElement?.querySelector("summary article span")?.textContent;
        hxe.detail.parameters.value = 10;
        hxe.detail.parameters.question = question;
        hxe.detail.parameters.answer = answer;
    }
});

document.getElementById("save-card")?.addEventListener("htmx:afterSwap", (e: unknown) => {
    if(row) {
        const qCell = row.querySelector("td:nth-child(1) > article");
        const aCell = row.querySelector("td:nth-child(2) > article");

        if(qCell && aCell) {
            qCell.innerHTML = qEditor.getHTML();
            aCell.innerHTML = aEditor.getHTML();
        }
    }
});

document.getElementById("add-card")?.addEventListener("htmx:afterSwap", (e: unknown) => {
    if(row) {
        const hxe = e as HtmxEvent;

        const newRow = document.createElement("tr");
        const q = wrapped(newRow, "td", "article", "tiny-margin");
        const a = wrapped(newRow, "td", "article", "tiny-margin");
        q.innerHTML = qEditor.getHTML();
        a.innerHTML = aEditor.getHTML();
        const value = wrapped(newRow, "td", "div", "field", "border");
        value.innerHTML = '<input type="number" min="0" max="1000" value="10" placeholder=" ">';
        const ed = wrapped(newRow, "td", "button", "transparent", "circle", "edit-card");
        ed.innerHTML = "<i>edit</i>";
        ed.dataset.card = hxe.detail.xhr.responseText;
        document.querySelector(".module table tbody tr:nth-last-child(2)")?.after(newRow);

        qEditor.destroy();
        aEditor.destroy();
        editor?.classList.remove("active");
    }
});

document.getElementById("delete-card")?.addEventListener("htmx:configRequest", (e: unknown) => {
    const hxe = e as HtmxEvent;
    hxe.detail.path += cardId;
    hxe.detail.target = row!;
});

document.getElementById("delete-card")?.addEventListener("htmx:beforeSwap", (e: unknown) => {
    if(row) {
        (e as HtmxEvent).detail.target = row!;
        qEditor.destroy();
        aEditor.destroy();
        editor?.classList.remove("active");
        row = null;
    }
});

function onCardEdit(e: Event) {
    if(e.target instanceof HTMLElement && editor) {
        cardId = e.target.dataset.card ? Number.parseInt(e.target.dataset.card) : -1;
        qOld = "";
        aOld = "";

        row = e.target.parentElement?.parentElement;
        if(!row) {
            return;
        }

        if(cardId != -1) {
            qOld = row.querySelector("td:nth-child(1) > article")?.innerHTML ?? "";
            aOld = row.querySelector("td:nth-child(2) > article")?.innerHTML ?? "";
            edited = false;
            document.getElementById("save-card")?.classList.remove("active");
            document.getElementById("add-card")?.classList.remove("active");
        }
        else {
            document.getElementById("save-card")?.classList.remove("active");
            document.getElementById("add-card")?.classList.add("active");
        }

        qEditor = new WysiwygEditor(document.getElementById("question-editor")!, qOld, cardId > -1 ? onUpdate : undefined);
        aEditor = new WysiwygEditor(document.getElementById("answer-editor")!, aOld, cardId > -1 ? onUpdate : undefined);

        editor.classList.add("active");
    }
}

document.querySelectorAll(".edit-card").forEach(el => {
    el.addEventListener("click", onCardEdit);
});

let dragTarget: HTMLElement | null = null;
let origNext: HTMLElement | null = null;
const dragEvent = (e: MouseEvent) => {
    if(dragTarget) {
        let pos = document.elementFromPoint(e.screenX, e.screenY);
        while(pos && pos.tagName != "TR") {
            pos = pos.parentElement;
            if(pos?.tagName == "TR") {
                if(pos.parentElement?.tagName == "THEAD") {
                    break;
                }

                pos.before(dragTarget);
                break;
            }
        }
    }
};

document.addEventListener("mouseup", e => {
    if(dragTarget && origNext) {
        dragTarget.classList.remove("dragging");
        origNext.before(dragTarget);
        dragTarget = null;
        origNext = null;
        e.stopPropagation();
    }
});

document.querySelectorAll(".module tbody tr:not(:last-of-type)").forEach(el => {
    el.addEventListener("htmx:configRequest", (e: unknown) => {
        if(dragTarget) {
            const hxe = e as HtmxEvent;
            document.removeEventListener("mouseover", dragEvent);

            const prev: HTMLElement|null|undefined = dragTarget.previousElementSibling?.querySelector("td:last-of-type > button");
            const next: HTMLElement|null|undefined = dragTarget.nextElementSibling?.querySelector("td:last-of-type > button");
            const button: HTMLElement|null = dragTarget.querySelector("td:last-of-type > button");
            if(button) {
                hxe.detail.parameters.card_id = button.dataset.card;
                if(next?.dataset.card && next.dataset.card != "-1") {
                    hxe.detail.parameters.next_id = next.dataset.card;
                }
                if(prev?.dataset.card) {
                    hxe.detail.parameters.prev_id = prev.dataset.card;
                }
            }
            dragTarget.classList.remove("dragging");
            dragTarget = null;
        }
    });

    if(el.nextElementSibling) {
        el.addEventListener("mousedown", e => {
            if((e as MouseEvent).button != 0) {
                return;
            }
            dragTarget = el as HTMLElement;
            origNext = dragTarget.nextElementSibling as HTMLElement | null;
            el.classList.add("dragging");
            document.addEventListener("mouseover", dragEvent);
        });
    }
});

document.getElementById("add-module")?.addEventListener("click", e => {
    const module: HTMLElement = document.querySelector(".new-module")?.cloneNode(true) as HTMLElement;
    module.classList.remove("new-module");
    module.classList.add("module");
    module.querySelector(".edit-card")?.addEventListener("click", onCardEdit);
    const moduleNumber = (document.getElementsByClassName("module").length + 1);
    const titleElement: HTMLSpanElement = module.querySelector("summary article span")!;
    titleElement.innerText = titleElement.innerText.replace("%d", moduleNumber.toLocaleString());
    module.dataset.module = moduleNumber.toString();
    module.setAttribute("open", "open");
    document.querySelector(".new-module")?.before(module);
});

closeBtn?.addEventListener("click", e => {
    e.preventDefault();
    cardId = -1;
    qEditor.destroy();
    aEditor.destroy();
    editor?.classList.remove("active");
});