--VER=1
--DESC=Create types and relations for user management and authentication

CREATE TYPE role AS ENUM('user', 'contributor', 'moderator', 'admin');
CREATE TYPE state AS ENUM('active', 'unverified', 'blocked', 'pending_deletion');

CREATE TABLE users (
    id bigint GENERATED ALWAYS AS IDENTITY,
    name character varying(200) NOT NULL,
    email character varying(320) NOT NULL,
    new_email character varying(320),
    password_hash character varying(250) NOT NULL,
    last_login timestamp without time zone,
    registered timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role role NOT NULL DEFAULT 'user'::role,
    state state NOT NULL DEFAULT 'unverified'::state,
    avatar_id character varying(64),
    
    CONSTRAINT user_id_pk PRIMARY KEY (id),
    CONSTRAINT email_uq UNIQUE (email)
);

CREATE TABLE sessions (
    token_hash bytea NOT NULL,
    user_id integer,
    expires timestamp without time zone NOT NULL,
    fingerprint bytea NOT NULL,
    request_token character(32) NOT NULL,
    
    CONSTRAINT session_token_pk PRIMARY KEY (token_hash),
    CONSTRAINT user_id_session_fk FOREIGN KEY (user_id)
        REFERENCES users (id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE CASCADE
);

CREATE TYPE auth_token_type AS ENUM('password_reset','email_verify');

CREATE TABLE auth_tokens (
    token_hash bytea NOT NULL,
    user_id bigint NOT NULL,
    type auth_token_type NOT NULL,
    expires timestamp without time zone NOT NULL,
    
    CONSTRAINT auth_tokens_pk PRIMARY KEY (token_hash),
    CONSTRAINT auth_token_user_id FOREIGN KEY(user_id)
        REFERENCES users (id) MATCH SIMPLE
        ON UPDATE RESTRICT
        ON DELETE CASCADE,
        CONSTRAINT auth_tokens_uq UNIQUE(user_id,type)
);

CREATE FUNCTION user_update_last_login_trf()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 1
    VOLATILE NOT LEAKPROOF STRICT
AS $BODY$
	BEGIN
		UPDATE users SET last_login=LOCALTIMESTAMP WHERE id=NEW.user_id;
        RETURN NEW;
	END;
$BODY$;

CREATE TRIGGER user_update_last_login_trig AFTER INSERT ON sessions
	FOR EACH ROW EXECUTE FUNCTION user_update_last_login_trf();