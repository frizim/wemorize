import './scss/base.scss';

import './img/logo.svg';
import './img/default_avatar.svg';

import 'htmx.org';
import 'beercss/dist/cdn/beer.js';

function toggle(elements: HTMLCollectionOf<Element>, htmlClass: string): void {
    for(const element of elements) {
        if(element.classList.contains(htmlClass)) {
            element.classList.remove(htmlClass);
        }
        else {
            element.classList.add(htmlClass);
        }
    }
}

if(document.getElementById("show-search")) {
    const overlays = document.getElementsByClassName("nav-overlay");

    document.getElementById("show-search")?.addEventListener("click", e => {
        toggle(overlays, "active");
        document.getElementById("course-search")?.focus();
    });
    document.getElementById("hide-search")?.addEventListener("click", e => {toggle(overlays, "active");});
}