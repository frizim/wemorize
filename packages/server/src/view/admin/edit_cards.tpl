{{#> base title=(i18n "pages.editCards") }}
{{#*inline "inHeader"}}
<script src="{{baseUrl}}/js/cards.js" defer="defer"></script>
<link rel="stylesheet" href="{{baseUrl}}/css/cards.css">
{{/inline}}
{{#*inline "content"}}
{{#each modules}}
    <details class="module" data-module="{{@key}}">
        <summary><article class="primary no-elevate"><span>{{i18n "module.title" number=@key}}</span><i>chevron_right</i></article></summary>
            <table class="border max">
            <thead>
                <tr>
                    <th class="max">{{i18n "cards.question"}}</th>
                    <th class="max">{{i18n "cards.answer"}}</th>
                    <th>{{i18n "cards.value"}}</th>
                    <th></th>
                </tr>
            </thead>
            {{#each this}}
            <tr hx-post="{{../../baseUrl}}/courses/{{../../course.id}}/languages/{{../../courseLangId}}/cards" hx-trigger="mouseup" hx-swap="none" hx-vals='{"request-token": "{{../../reqToken}}"}'>
                <td><article class="tiny-margin">{{{this.question.content.text}}}</article></td>
                <td><article class="tiny-margin">{{{this.answer.content.text}}}</article></td>
                <td class="card-value"><div class="field border"><input type="number" min="0" max="1000" value="{{this.value}}"></div></td>
                <td><button class="transparent circle edit-card" data-card="{{this.id}}"><i>edit</i></button></td>
            </tr>
            {{/each}}
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td><button class="primary circle edit-card" data-card="-1"><i>add</i></button></td>
            </tr>
            </table>
        </div>
    </details>
{{/each}}
<button class="extend square round" id="add-module"><i>add</i><span>{{i18n "module.add"}}</span></button>
<dialog id="card-editor">
    <form id="card-editor-vals">
        <nav class="max" hx-ext="remove-class">
            <button class="primary" id="delete-card" hx-delete="{{baseUrl}}/courses/{{course.id}}/languages/{{courseLangId}}/cards/" hx-headers='{"request-token": "{{reqToken}}"}' hx-swap="delete"><i>delete</i></button>
            <span class="max right-align">
                <button class="primary" id="add-card" hx-put="{{baseUrl}}/courses/{{course.id}}/languages/{{courseLangId}}/cards" hx-params="request-token" hx-swap="remove-class" hx-disabled-elt="#card-editor button"><i>add</i></button>
                <button class="primary" id="save-card" hx-post="{{baseUrl}}/courses/{{course.id}}/languages/{{courseLangId}}" hx-params="request-token" hx-swap="remove-class" hx-disabled-elt="#card-editor button"><i>save</i></button>
                <button class="transparent" id="close-editor"><i>close</i></button>
            </span>
        </nav>
        {{reqTokenField reqToken}}
        <h6>{{i18n "cards.question"}}</h6>
        <div class="editor" id="question-editor"></div>
        <h6>{{i18n "cards.answer"}}</h6>
        <div class="editor" id="answer-editor"></div>
    </form>
</dialog>
<template id="row">

</template>
<template id="module">
<details class="module">
    <summary><article class="primary no-elevate"><span>{{i18n "module.title" number="%d"}}</span><i>chevron_right</i></article></summary>
        <table class="border max">
        <thead>
            <tr>
                <th class="max">{{i18n "cards.question"}}</th>
                <th class="max">{{i18n "cards.answer"}}</th>
                <th>{{i18n "cards.value"}}</th>
                <th></th>
            </tr>
        </thead>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td><button class="primary circle edit-card" data-card="-1"><i>add</i></button></td>
        </tr>
        </table>
    </div>
</details>
</template>
{{/inline}}
{{/base}}