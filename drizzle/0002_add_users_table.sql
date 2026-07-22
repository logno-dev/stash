CREATE TABLE users (
  id text PRIMARY KEY NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  app_id text NOT NULL DEFAULT 'local',
  created_at text DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX users_email_unique_idx ON users (email);
