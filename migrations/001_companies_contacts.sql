-- 001: companies and the people we talk to
CREATE TABLE companies (
  id         serial PRIMARY KEY,
  name       text UNIQUE NOT NULL,
  industry   text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contacts (
  id         serial PRIMARY KEY,
  company_id integer NOT NULL REFERENCES companies(id),
  name       text NOT NULL,
  email      text UNIQUE NOT NULL,
  role       text NOT NULL DEFAULT ''
);
