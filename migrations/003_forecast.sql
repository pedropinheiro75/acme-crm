-- 003: win probability per stage, for the weighted forecast (this branch only)
CREATE TABLE stage_probability (
  stage       text PRIMARY KEY,
  probability integer NOT NULL CHECK (probability BETWEEN 0 AND 100)
);

INSERT INTO stage_probability VALUES
  ('lead', 10), ('qualified', 30), ('proposal', 60), ('won', 100), ('lost', 0);
