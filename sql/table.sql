DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, password TEXT);

-- WARNING: Storing plaintext passwords is a security risk. Use bcrypt or similar in production.
INSERT INTO users (id, name, email, password) VALUES
(1, 'Joe', 'user@gmail.com', 'password123');
