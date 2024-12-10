{{#> base title=(i18n "pages.settings") }}
{{#*inline "content"}}
<form method="post" action="{{baseUrl}}/settings">
    <h1>{{i18n "register.title"}}</h1>
        
    <div class="field border label">
        <input name="username" id="username" type="text" maxlength="200" required="required" value="{{user.name}}">
        <label for="username">{{i18n "fields.username"}}</label>
    </div>

    <div class="field border label suffix">
        <input name="email" id="email" type="email" maxlength="320" required="required" autocomplete="email" value="{{#if user.new_email}}{{user.new_email}}{{else}}{{user.email}}{{/if}}">
        <label for="email">{{i18n "fields.email"}}</label>
        <i>{{#if user.new_email}}warning <div class="tooltip">{{i18n "settings.emailState.verifyPending"}}</div>{{else}}check <div class="tooltip">{{i18n "settings.emailState.verified"}}</div>{{/if}}</i>
    </div>

    <div class="field border label">
        <input name="password" id="password" type="password" maxlength="501" autocomplete="new-password" placeholder=" ">
        <label for="password">{{i18n "fields.newPassword"}}</label>
    </div>
    <div class="field border label">
        <input name="confirm_password" id="confirm_password" type="password" maxlength="501" autocomplete="new-password" placeholder=" ">
        <label for="confirm_password">{{i18n "fields.confirmPassword"}}</label>
    </div>

    {{reqTokenField reqToken}}
    <dialog class="bottom">
        <div class="field border label">
            <input name="current_password" id="current_password" type="password" maxlength="500" required="required" autocomplete="current-password" placeholder=" ">
            <label for="current_password">{{i18n "fields.password"}}</label>
        </div>
        <button type="submit" class="button primary">{{i18n "settings.saveSettings"}}</button>
    </dialog>
</form>

<form method="post" enctype="multipart/form-data">
    {{reqTokenField reqToken}}
    <fieldset class="center-align">
        <legend>{{i18n "settings.avatar"}}</legend>
        <div class="medium-padding"><img class="avatar circle extra" src="{{baseUrl}}/{{avatarImg}}"></div>
        <button hx-post="/settings/avatar" hx-encoding="multipart/form-data" hx-trigger="change" hx-target="#new_avatar" data-refresh="true">
            <i>attach_file</i>
            <span>{{i18n "settings.uploadAvatar"}}</span>
            <input name="new_avatar" id="new_avatar" type="file">
        </button>
        {{#if user.avatar_id}}<button formaction="/settings/avatar" type="button" hx-post="/settings/avatar" hx-params="not new_avatar" data-refresh="true"><i>delete</i>{{i18n "settings.deleteAvatar"}}</button>{{/if}}
    </fieldset>
</form>

<div class="row center-align">
<form method="post" action="/data-archive">
    {{reqTokenField reqToken}}
    <button type="submit">{{i18n "settings.getDataArchive"}}</button>
</form>

<form method="post" action="/user/delete">
    {{reqTokenField reqToken}}
    <label class="button error" for="show-delete">{{i18n "settings.deleteAccount"}}</label>
    <input type="radio" id="show-delete" name="toggle-delete">
    <dialog class="bottom error-container">
        <nav class="right-align">
            <label class="button transparent"><i>close</i><input type="radio" name="toggle-delete" id="hide-delete"></label>
        </nav>
        <p class="medium-text">{{i18n "settings.deletionWarning"}}</p>
        <ul>
            <li>{{i18n "settings.deletionDataLoss.profile"}}</li>
            <li>{{i18n "settings.deletionDataLoss.progress"}}</li>
            <li>{{i18n "settings.deletionDataLoss.ranking"}}</li>
        </ul>
        <p class="medium-text">{{i18n "settings.deletionCourses"}}</p>
        <p class="medium-text">{{i18n "settings.deletionConfirm"}}</p>
        <nav class="no-space">
            <div class="max field border label left-round">
                <input name="current_password" id="current_password" type="password" maxlength="500" required="required" autocomplete="current-password" placeholder=" ">
                <label for="current_password">{{i18n "fields.password"}}</label>
            </div>
            <button type="submit" class="button error right-round large">{{i18n "settings.confirmDeletion"}}</button>
        </nav>
    </dialog>
</form>
</div>
{{/inline}}
{{/base}}
