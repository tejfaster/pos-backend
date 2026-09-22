CREATE TABLE email_otp_challenges (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,

    purpose VARCHAR(50) NOT NULL,

    otp_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    attempts INTEGER NOT NULL DEFAULT 0,

    max_attempts INTEGER NOT NULL DEFAULT 5,

    verified_at TIMESTAMPTZ,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT email_otp_purpose_check
        CHECK (
            purpose IN (
                'PASSWORD_RESET'
            )
        ),

    CONSTRAINT email_otp_attempts_check
        CHECK (
            attempts >= 0
        ),

    CONSTRAINT email_otp_max_attempts_check
        CHECK (
            max_attempts > 0
        )
);

CREATE INDEX email_otp_user_id_idx
    ON email_otp_challenges(user_id);

CREATE INDEX email_otp_email_idx
    ON email_otp_challenges(email);

CREATE INDEX email_otp_expires_at_idx
    ON email_otp_challenges(expires_at);

CREATE INDEX email_otp_active_idx
    ON email_otp_challenges(
        user_id,
        purpose,
        created_at
    );