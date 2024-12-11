--VER=2
--DESC=Create schema for Wemorize course data

CREATE TYPE card_answer_mode AS ENUM('selftest', 'input', 'similar_alts');

CREATE TABLE courses (
    id bigint GENERATED ALWAYS AS IDENTITY,
    creator_id bigint NOT NULL,
    clicks integer NOT NULL DEFAULT 0,
    created timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_update timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    answer_mode card_answer_mode NOT NULL DEFAULT 'selftest',
    flip boolean NOT NULL DEFAULT false,
    randomize boolean NOT NULL DEFAULT false,
    show_first boolean NOT NULL DEFAULT true,
    
    CONSTRAINT course_id_pk PRIMARY KEY (id),
    CONSTRAINT course_creator_fk FOREIGN KEY (creator_id)
        REFERENCES users (id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE SET NULL,
    CONSTRAINT course_clicks_chk CHECK (clicks > -1)
);

CREATE TABLE course_languages (
    id bigint GENERATED ALWAYS AS IDENTITY,
    course_id bigint NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    language character varying(3) NOT NULL DEFAULT 'en',
    
    CONSTRAINT course_language_id_pk PRIMARY KEY (id),
    CONSTRAINT course_language_course_fk FOREIGN KEY (course_id)
        REFERENCES courses (id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE CASCADE
);

CREATE TABLE cards (
    id bigint GENERATED ALWAYS AS IDENTITY,
    course_lang_id bigint NOT NULL,
    question_content jsonb NOT NULL,
    answer_content jsonb NOT NULL,
    module smallint NOT NULL DEFAULT 1,
    next_id integer DEFAULT NULL,
    value smallint NOT NULL DEFAULT 0,
    
    CONSTRAINT card_id_pk PRIMARY KEY (id),
    CONSTRAINT card_course_lang_id_fk FOREIGN KEY (course_lang_id)
        REFERENCES course_languages (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT next_id_fk FOREIGN KEY (next_id)
        REFERENCES cards (id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE RESTRICT,
    CONSTRAINT next_id_uq UNIQUE NULLS NOT DISTINCT(module,next_id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT card_module_chk CHECK (module > 0),
    CONSTRAINT card_value_chk CHECK (value > -1)
);