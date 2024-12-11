import { ChainedCommands, Editor } from "@tiptap/core";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {process} from "htmx.org";

declare type ClickHandler = (cc: ChainedCommands) => boolean;

interface HtmxEvent extends Event {
    detail: Record<string, unknown>;
}

interface UploadResponse {
    image: string
}

export class WysiwygEditor {

    private readonly editor: Editor;
    private readonly bar: HTMLElement;
    private readonly editorContent: HTMLElement;
    private readonly id: number;

    private static lastId = 0;

    public constructor(element: HTMLElement, initialContent = "", onUpdate?: (props: { editor: Editor; transaction: unknown; }) => void) {
        this.id = WysiwygEditor.lastId++;
        this.bar = document.createElement("nav");
        this.bar.classList.add("editor-menu");
        this.editorContent = document.createElement("div");
        element.append(this.bar, this.editorContent);

        this.editor = new Editor({
            element: this.editorContent,
            content: initialContent,
            extensions: [
                TextStyle,
                Underline,
                TextAlign,
                Color.configure({types: [TextStyle.name]}),
                Image.configure({allowBase64: true}),
                Table.configure({resizable: true}),
                TableRow,
                TableCell,
                TableHeader,
                StarterKit
            ],
            onUpdate: onUpdate ?? (props => {/*No-Op*/})
        });

        this.eb("undo", cc => cc.undo().run()).disabled = true;
        this.eb("redo", cc => cc.redo().run()).disabled = true;
        this.gr();
        this.eb("format_bold", cc => cc.toggleBold().run());
        this.eb("format_italic", cc => cc.toggleItalic().run());
        this.eb("format_underlined", cc => cc.toggleUnderline().run());
        this.eb("format_strikethrough", cc => cc.toggleStrike().run());
        this.gr();
        this.eb("format_align_left", cc => cc.setTextAlign("left").run());
        this.eb("format_align_center", cc => cc.setTextAlign("center").run());
        this.eb("format_align_right", cc => cc.setTextAlign("right").run());
        this.gr();
        this.eb("format_list_bulleted", cc => cc.toggleBulletList().run());
        this.eb("format_list_numbered", cc => cc.toggleOrderedList().run());
        this.gr();
        this.color();
        this.gr();
        this.eb("table", cc => cc.insertTable().run());

        const imgUpload = document.createElement("input");
        imgUpload.type = "file";
        imgUpload.name = "add_image";
        imgUpload.id = "add_image_" + this.id;

        const imgBtn = this.eb("image", undefined, imgUpload);
        
        imgBtn.setAttribute("hx-put", "/card-image");
        imgBtn.setAttribute("hx-encoding", "multipart/form-data");
        imgBtn.setAttribute("hx-trigger", "change");
        imgBtn.setAttribute("hx-target", "#" + imgUpload.id);
        imgBtn.addEventListener("htmx:afterRequest", (e) => {
            const he = e as HtmxEvent;
            if(!he.detail.elt) {
                return;
            }
        
            if(he.detail.successful && he.detail.xhr) {
                const resp = JSON.parse((he.detail.xhr as XMLHttpRequest).responseText) as UploadResponse;
                this.editor.chain().focus().setImage({src: resp.image}).run();
            }
        });
        process(imgBtn);
    }

    public getHTML() {
        return this.editor.getHTML();
    }

    public destroy() {
        this.bar.remove();
        this.editor.destroy();
        this.editorContent.remove();
    }

    private eb(iconName: string, onclick?: ClickHandler, ...otherElements: HTMLElement[]): HTMLButtonElement {
        const el = document.createElement("button");
        el.classList.add("editor-button");
        const icon = document.createElement("i");
        icon.innerText = iconName;
        el.appendChild(icon);
        if(otherElements.length > 0) {
            el.append(...otherElements);
        }

        if(onclick) {
            el.addEventListener("click", e => {
                e.preventDefault();
                onclick(this.editor.chain().focus());
            });
        }

        this.bar.appendChild(el);
        return el;
    }

    private gr() {
        const el = document.createElement("p");
        el.classList.add("group-separator");
        this.bar.appendChild(el);
    }

    private color() {
        const color = document.createElement("input");
        color.style.display = "none";
        color.setAttribute("type", "color");
        this.bar.appendChild(color);
        color.addEventListener("change", e => {
            this.editor.chain().focus().setColor(color.value).run();
        }, false);
        this.eb("format_color_text", cc => {
            color.click();
            return true;
        });
    }

}