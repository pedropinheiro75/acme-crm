-- 002: deals and their stage in the funnel
CREATE TABLE deals (
  id          serial PRIMARY KEY,
  company_id  integer NOT NULL REFERENCES companies(id),
  title       text NOT NULL,
  value_cents integer NOT NULL DEFAULT 0,
  stage       text NOT NULL DEFAULT 'lead'
              CHECK (stage IN ('lead', 'qualified', 'proposal', 'won', 'lost')),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
