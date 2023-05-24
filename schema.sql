DROP TABLE IF EXISTS conversations;
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY,
  message TEXT NOT NULL,
  role TEXT CHECK(role IN ('user', 'assistant')) NOT NULL
);
