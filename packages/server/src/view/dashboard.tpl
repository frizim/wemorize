{{#> base title=(i18n "pages.dashboard") }}
{{#*inline "content"}}
<section class="cards">
{{#if courses}}
{{#each courses}}
<div class="course-card">
    <article class="card-inner">
    <div class="card-front">
        <div class="card-title">
            <div>
                <h4>{{this.course_language.name}}</h4>
                <h5>{{i18n "course.madeBy" creator=this.course_language.course.creator.name}}</h5>
            </div>
            <div class="rank-badge">
                <div class="medal {{switch this.course_stats.rank 1="gold" 2="silver" 3="bronze" default=""}}"><span>{{this.course_stats.rank}}</span></div>
                <div class="ribbon ribbon-left"></div>
                <div class="ribbon ribbon-right"></div>
            </div>
        </div>
        <div class="card-body">
            <progress value="{{this.course_stats.progress}}" max="100"></progress>
            <p class="course-goal-{{this.daily_goal}}">{{i18n "course.dailyGoal" goal=this.daily_goal}}</p>
        </div>
        <nav>
            <a href="#" class="button transparent">{{i18n "course.startRegular"}}</a>
            <a href="#" class="button transparent">{{i18n "course.startRep"}}</a>
            <label class="button circle transparent" for="show-settings-{{@index}}"><input type="radio" id="show-settings-{{@index}}" name="toggle-settings-{{@index}}" class="show-settings"><i>settings</i></label>
        </nav>
    </div>
    <div class="card-back">
        <div class="card-title">
            <div>
                <h4>{{this.course_language.name}}</h4>
                <h5>{{i18n "course.settings"}}</h5>
            </div>
        </div>
        <div class="card-body">
            <form action="#">
                <label for="daily_goal" class="daily-goal field">{{i18n "fields.dailyGoal.prefix"}}<input type="number" min="1" max="100" value="{{this.daily_goal}}" name="daily_goal" required="required"> {{i18n "fields.dailyGoal.unit"}}</label>
                <label for="reminder" class="checkbox"><input type="checkbox" name="reminder" {{#if this.reminder}}checked{{/if}}><span>{{i18n "fields.enableReminder"}}</span></label>
            </form>
        </div>
        <nav>
            <a href="#" class="button transparent error-text">{{i18n "course.leave"}}</a>
            <label class="button circle transparent" for="hide-settings-{{@index}}"><input type="radio" id="hide-settings-{{@index}}" name="toggle-settings-{{@index}}"><i>close</i></label>
        </nav>
    </div>
    </article>
</div>
{{/each}}
{{else}}
<article id="no-courses" class="medium middle-align center-align">
    <i class="extra">unknown_document</i>
    <h5>{{i18n "courses.noneAvailable"}}</h5>
    <nav class="center-align">
        <a class="button primary">{{i18n "courses.openList"}}</a>
    </nav>
</article>
{{/if}}
</section>
{{/inline}}
{{/base}}