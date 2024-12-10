{{#> base title=(i18n "pages.register") }}
{{#*inline "content"}}
<form method="post" action="{{baseUrl}}/register">
    <h1>{{i18n "register.title"}}</h1>
    
    {{#if message}}<div class="alert al-error">{{i18n message}}</div>{{/if}}
    
    <div class="field border label">
        <input name="username" id="username" type="text" maxlength="200" required="required" placeholder=" ">
        <label for="username">{{i18n "fields.username"}}</label>
    </div>

    <div class="field border label">
        <input name="email" id="email" type="email" maxlength="320" required="required" autocomplete="email" placeholder=" ">
        <label for="email">{{i18n "fields.email"}}</label>
    </div>

    <div class="field border label">
        <input name="password" id="password" type="password" maxlength="501" autocomplete="new-password" required="required" placeholder=" ">
        <label for="password">{{i18n "fields.password"}}</label>
    </div>
    <div class="field border label">
        <input name="confirm_password" id="confirm_password" type="password" maxlength="501" autocomplete="new-password" required="required" placeholder=" ">
        <label for="confirm_password">{{i18n "fields.confirmPassword"}}</label>
    </div>

    <label for="tos_accepted" class="checkbox">
        <input name="tos_accepted" id="tos_accepted" type="checkbox" required="required">
        <span>{{i18n "fields.tosAccepted"}}</span>
    </label>

    <label for="privacy_policy_accepted" class="checkbox">
        <input name="privacy_policy_accepted" id="privacy_policy_accepted" type="checkbox" required="required">
        <span>{{i18n "fields.privacyPolicyAccepted"}}</span>
    </label>

    {{reqTokenField reqToken}}
    <button type="submit" class="button primary">{{i18n "buttons.register"}}</button>
</form>
{{/inline}}
{{/base}}
