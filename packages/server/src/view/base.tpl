<!doctype html>
<html lang="de" style="width: 100%; height:100%">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
        <title>{{ title }} - {{rootTitle}}</title>
        <link rel="icon" type="image/png" href="favicon.png">
        <link rel="stylesheet" href="css/bootstrap.min.css">
        <link rel="stylesheet" href="css/base.css">
        {{#if page-style}}<link rel="stylesheet" href="css/{{page_style}}">{{/if}}
    </head>
    <body>
        <header>

        </header>
        <main>
            {{#> content}}
            {{/content}}
        </main>
        <footer>

        </footer>
    </body>
</html>