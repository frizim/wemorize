<!doctype html>
<html lang="de">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="referrer" content="no-referrer">
        <meta http-equiv="content-security-policy" content="default-src 'none'; script-src 'self'; style-src 'self'{{#if inlineCss}} 'unsafe-inline'{{/if}}; img-src 'self'; media-src 'self' data:; font-src 'self'; form-action 'self'; connect-src 'self'; upgrade-insecure-requests">
        <meta name="color-scheme" content="light dark">
        <meta name="creator" content="Wemorize">

        <meta name="htmx-config" content='{"timeout": 30000, "allowEval": false, "includeIndicatorStyles": false}'>
        <title>{{ title }} - {{instanceName}}</title>
        <link rel="icon" href="{{baseUrl}}/img/favicon.svg">
        <link rel="stylesheet" href="{{baseUrl}}/css/base.css">
        <script src="{{baseUrl}}/js/base.js" defer="defer"></script>
        {{#> inHeader}}
        {{/inHeader}}
    </head>
    <body>
        <header class="primary-container">
            <nav aria-label="{{i18n "aria.headerMenu"}}">
                <a id="home-link" href="{{baseUrl}}">
                    <img src="{{baseUrl}}/img/{{logoFilename}}" alt="">
                    <h5>{{instanceName}}</h5>
                </a>
                <div class="max"></div>
                {{#if user}}
                <form id="course-search-form">
                    {{reqTokenField reqToken}}
                    <div id="course-search-bar" class="field fill suffix">
                        <input id="course-search" name="prefix" class="nav-overlay search-input" type="search" minlength="2" maxlength="200" required="required"
                            hx-validate="true"
                            hx-post="/courses/search"
                            hx-trigger="input changed delay:400ms, click from:#show-search"
                            hx-target="#search-overlay"
                            hx-swap="outerHTML">
                        <a href="" class="button transparent circle" id="toggle-search"><i class="nav-overlay active">search</i><i class="nav-overlay">close</i></a>
                    </div>
                </form>
                <span id="profile">
                    <button class="button transparent">
                        <span><img class="avatar circle" src="{{baseUrl}}/{{avatarImg}}" alt=""><span class="m l"> {{user.name}}</span></span>
                        <i>arrow_drop_down</i>
                    </button>
                    <menu>
                        <a href="{{baseUrl}}/profile/{{user.id}}" class="button transparent">{{i18n "userMenu.profile"}}</a>
                        <a href="{{baseUrl}}/settings" class="button transparent">{{i18n "userMenu.settings"}}</a>
                        <form action="{{baseUrl}}/logout" method="post">{{reqTokenField reqToken}}<button type="submit" class="button transparent">{{i18n "userMenu.logout"}}</button></form>
                    </menu>
                </span>
                {{else}}
                <div class="m l">
                    <a class="button transparent" href="{{baseUrl}}/login">{{i18n "login.title"}}</a>
                    <a class="button transparent" href="{{baseUrl}}/register">{{i18n "register.title"}}</a>
                </div>
                <div class="s">
                    <label for="open-nav" class="button transparent">
                        <input type="radio" id="open-nav" name="toggle-nav">
                        <i>menu</i>
                    </label>
                    <dialog class="right">
                        <nav class="drawer">
                            <label for="close-nav" class="button transparent">
                                <input type="radio" id="close-nav" name="toggle-nav">
                                <i>close</i>
                            </label>
                            <a href="{{baseUrl}}/login">{{i18n "login.title"}}</a>
                            <a href="{{baseUrl}}/register">{{i18n "register.title"}}</a>
                        </nav>
                    </dialog>
                </div>
                {{/if}}
            </nav>
        </header>
        {{#if user}} <div id="search-overlay" class="nav-overlay"></div> {{/if}}
        <main class="responsive">
            {{#> content}}
            {{/content}}
            <div id="error-message" class="snackbar error{{#if message}} active{{/if}}"><p class="max">{{#if message}}{{i18n message}}{{/if}}</p><label class="on-error" for="error-message__close"><input type="radio" id="error-message__close"><i>close</i></label></div>
        </main>
        <footer>
            <nav class="content" aria-label="{{i18n "aria.footerMenu"}}">
                <a href="{{baseUrl}}/info/legal">{{i18n "legalNotice.title"}}</a>
                <a href="{{baseUrl}}/info/privacy">{{i18n "privacyPolicy.title"}}</a>
                <a href="{{baseUrl}}/info/tos">{{i18n "tos.title"}}</a>
                <a href="{{baseUrl}}/help">{{i18n "help.title"}}</a>
            </nav>
        </footer>
    </body>
</html>