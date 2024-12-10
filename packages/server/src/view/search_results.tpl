<div id="search-overlay" class="nav-overlay active">
<div id="search-results">
{{#if results}}
{{#each results}}
<article class="course-search-result">
    <h5>{{this.name}}</h5>
    <p>{{this.description}}</p>
    <nav>
        <a href="#" class="button button-primary"
            hx-trigger="click"
            hx-post="/enroll/{{this.id}}"
            hx-vals="{'request_token': '{{../reqToken}}' }">{{i18n "course.enroll"}}</a>
    </nav>
</article>
{{/each}}
{{else}}
<article>
    <i class="extra">cancel</i>
    <h5>{{i18n "courses.search.noResults"}}</h5>
</article>
{{/if}}
</div>
</div>
