{{#> base title=(i18n "profile.title") }}
{{#*inline "content"}}
<div class="user-profile row top-align center-align wrap">
    <aside>
        <img class="avatar circle" src="{{baseUrl}}/avatar/{{avatar}}" alt="Avatar">
        <h4>{{profile.name}}</h4>
        <p>{{i18n "profile.enrolled_count" count=courseCount }}</p>
    </aside>
    <div class="padding grid max">
        {{#each courses}}
        <article class="s12 m12 l6">
            <span class="row">
                <h6 class="max">{{this.course_language.name}}</h6>
                <div class="rank-badge">
                    <div class="medal {{switch this.course_stats.rank 1="gold" 2="silver" 3="bronze" default=""}}"><span>{{this.course_stats.rank}}</span></div>
                    <div class="ribbon ribbon-left"></div>
                    <div class="ribbon ribbon-right"></div>
                </div>
            </span>
            <span class="row">
                <progress value="{{this.course_stats.progress}}" max="100"></progress>
                <span class="course-progress-pct">{{this.course_stats.progress}} %</span>
            </span>
        </article>
        {{/each}}
    </div>
</div>
{{/inline}}
{{/base}}
