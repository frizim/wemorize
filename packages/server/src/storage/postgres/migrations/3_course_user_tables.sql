--VER=3
--DESC=Create schema for Wemorize course user data

CREATE TABLE course_enrollments (
    id bigint GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL,
    course_lang_id bigint NOT NULL,
    daily_goal smallint NOT NULL DEFAULT 1,
    reminder boolean NOT NULL DEFAULT false,
    enrolled timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT course_enrollments_pk PRIMARY KEY (id),
    CONSTRAINT enrollments_user_fk FOREIGN KEY (user_id)
        REFERENCES users(id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
    CONSTRAINT enrollments_course_lang_fk FOREIGN KEY (course_lang_id)
        REFERENCES course_languages(id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT enrollments_goal_chk CHECK(daily_goal > 0)
);

CREATE TABLE enrollment_daily_stats (
    enrollment_id bigint NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    correct integer NOT NULL DEFAULT 0,
    wrong integer NOT NULL DEFAULT 0,
    goal_met boolean NOT NULL DEFAULT false,
    
    CONSTRAINT enrollment_daily_stats_pk PRIMARY KEY (enrollment_id, date),
    CONSTRAINT enrollment_id_fk FOREIGN KEY (enrollment_id)
        REFERENCES course_enrollments (id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE CASCADE
);

CREATE TABLE enrollment_card_stats (
    enrollment_id bigint NOT NULL,
    card_id bigint NOT NULL,
    last_attempt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    correct integer NOT NULL DEFAULT 0,
    wrong integer NOT NULL DEFAULT 0,
    
    CONSTRAINT enrollment_card_stats_pk PRIMARY KEY (card_id, enrollment_id),
    CONSTRAINT card_stats_enrollment_fk FOREIGN KEY (enrollment_id)
        REFERENCES course_enrollments (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT enrollment_stats_card_fk FOREIGN KEY (card_id)
        REFERENCES cards (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);