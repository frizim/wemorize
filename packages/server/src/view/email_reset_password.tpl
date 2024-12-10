{{#> email}}
{{#*inline "content"}}
    <p>{{i18n "communications.greeting" username=username }}</p>
    <p>{{i18n "communications.resetPassword"}} <a href="{{baseUrl}}/reset-password/{{authToken}}">{{baseUrl}}/reset-password/{{authToken}}</a></p>
    <br/>
    <br/>
    <p>{{i18n "communications.nonIntentionalReset"}}</p>
    <br/>
    <br/>
    <p>{{i18n "communications.signoff"}}</p>
{{/inline}}
{{/email}}