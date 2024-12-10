{{#> base title=(i18n "pages.resetPassword") }}
{{#*inline "content"}}
<form method="post" action="{{baseUrl}}/reset-password">
    <h1>{{i18n "resetPassword.title"}}</h1>
    <div class="field border label">
        <label for="password">{{i18n "fields.password"}}</label>
        <input name="password" id="password" type="password" maxlength="501" autocomplete="new-password" required="required">
    </div>
    <div class="field border label">
        <label for="confirm_password">{{i18n "fields.confirmPassword"}}</label>
        <input name="confirm_password" id="confirm_password" type="password" maxlength="501" autocomplete="new-password" required="required">
    </div>

    <input name="token" type="hidden" value="{{token}}">
    {{reqTokenField reqToken}}
    <button type="submit" class="button primary">{{i18n "buttons.resetPassword"}}</button>
</form>
{{/inline}}
{{/base}}
