{{#> base title=(i18n "pages.login") }}
{{#*inline "content"}}
<form method="post" action="{{baseUrl}}/login">
    <h1 class="title">{{i18n "login.title"}}</h1>
    
    {{#if message}}<div class="alert al-error">{{i18n message}}</div>{{/if}}

    <div class="field border label">
        <input name="email" id="email" type="email" maxlength="320" required="required" autocomplete="email" placeholder=" ">
        <label for="email">{{i18n "fields.email"}}</label>
    </div>

    <div class="field border label">
        <input name="password" id="password" type="password" maxlength="500" required="required" autocomplete="current-password" placeholder=" ">
        <label for="password">{{i18n "fields.password"}}</label>
        <a class="helper" href="{{baseUrl}}/forgot-password">{{i18n "forgotPassword.link" }}</a>
    </div>

    {{reqTokenField reqToken}}
    <button type="submit" class="button primary">{{i18n "buttons.login"}}</button>
</form>
{{/inline}}
{{/base}}
