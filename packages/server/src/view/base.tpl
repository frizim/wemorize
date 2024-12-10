<!doctype html>
<html lang="de">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="referrer" content="no-referrer">
        <meta name="color-scheme" content="light dark">
        <meta name="creator" content="Wemorize">

        <title>{{ title }} - {{instanceName}}</title>
        <link rel="icon" href="{{baseUrl}}/img/logo.svg">
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
                <button class="transparent nav-overlay active" id="show-search"><i>search</i></button>
                <div class="nav-overlay max" id="course-search-bar">
                    <form class="field fill">
                        {{reqTokenField reqToken}}
                        <input id="course-search" name="prefix" class="search-input" type="search" minlength="2" maxlength="200" required="required"
                            hx-validate="true"
                            hx-post="/courses/search"
                            hx-trigger="input changed delay:400ms, click from:#show-search"
                            hx-target="#search-overlay"
                            hx-swap="outerHTML">
                    </form>
                    <button class="transparent" id="hide-search"><i>close</i></button>
                </div>
                <span id="profile">
                    <button class="button transparent">
                        <span><img src="{{baseUrl}}/{{avatarImg}}" alt=""> {{user.name}}</span>
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
        {{#if user}} <div id="search-overlay"></div> {{/if}}
        <main class="responsive">
            {{#> content}}
            {{/content}}
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