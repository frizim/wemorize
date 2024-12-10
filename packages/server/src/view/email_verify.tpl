{{#> email}}
{{#*inline "content"}}
    <p>{{i18n "communications.greeting" username=username }}</p>
    <p>{{i18n "communications.welcome"}}</p>
    <p>{{i18n "communications.activationLink"}} <a href="{{baseUrl}}/verify/{{authToken}}">{{baseUrl}}/verify/{{authToken}}</a></p>
    <br/>
    <br/>
    <p>{{i18n "communications.nonIntentionalRegistration"}}</p>
    <br/>
    <br/>
    <p>{{i18n "communications.signoff"}}</p>
{{/inline}}
{{/email}}