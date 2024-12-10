{{#> base title=(i18n "pages.forgotPassword") }}
{{#*inline "content"}}
<form method="post" action="{{baseUrl}}/forgot-password">
    <h1 class="title">{{i18n "forgotPassword.title"}}</h1>
    {{#if message}}<div class="alert al-error"><div class="message-body">{{i18n message}}</div></div>{{/if}}

    <div class="field border label">
        <input name="email" type="email" maxlength="320" required="required">
        <label for="email">{{i18n "fields.email"}}</label>
    </div>

    {{reqTokenField reqToken}}
    <button type="submit" class="button primary">{{i18n "buttons.forgotPassword"}}</button>
</form>
{{/inline}}
{{/base}}
