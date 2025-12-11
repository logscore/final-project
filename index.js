// import express
const express = require("express");
const connectPgSimple = require("connect-pg-simple");

// create express object
const app = express();

// import express-session to create a session variable
const session = require("express-session");
const PgSession = connectPgSimple(session);

app.use(express.static("public"));

// load environment variables from the .env file
require("dotenv").config();

// set the port using the .env file
const port = process.env.APP_PORT;

// use ejs for the webpages - refer to the views directory
app.set("view engine", "ejs");

// tells express how to read form data in the body of a request
app.use(express.urlencoded({ extended: true }));

// set the session variable
app.use(
  session({
    store: new PgSession({
      conObject: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
        ssl: { rejectUnauthorized: false },
      },
      createTableIfMissing: true, // auto-creates a session table
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }),
);

// global authentication middleware
app.use((req, res, next) => {
  // Skip authentication for login routes
  if (
    req.path === "/" ||
    req.path === "/login" ||
    req.path === "/signup" ||
    req.path === "/logout"
  ) {
    return next();
  }

  // Check if user is logged in
  if (req.session.isLoggedIn) {
    next();
  } else {
    res.render("login", { error_message: "Please log in to access this page" });
  }
});

// ==============================
// DATABASE CONNECTION (POSTGRES + KNEX)
// ==============================
const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.POSTGRES_HOST,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: process.env.POSTGRES_PORT,
    ssl: { rejectUnauthorized: false },
  },
  wrapIdentifier: (value, origImpl) => origImpl(value.toLowerCase()),
});

// ==============================
// LOGIN
// ==============================
app.post("/login", (req, res) => {
  let sEmail = req.body.email ? req.body.email.toLowerCase().trim() : "";
  let sPassword = req.body.password || "";

  if (!sEmail || !sPassword) {
    return res.render("login", {
      error_message: "Please enter email and password",
    });
  }

  knex("users")
    .select("email", "password")
    .where("email", sEmail)
    .andWhere("password", sPassword)
    .then((users) => {
      if (users.length > 0 && users[0].password === sPassword) {
        req.session.isLoggedIn = true;
        req.session.userId = users[0].id;
        req.session.email = users[0].email;
        console.log(`User logged in: ${users[0].email} (ID: ${users[0].id})`);
        res.redirect("/dashboard");
      } else {
        console.warn(`Failed login attempt for email: ${sEmail}`);
        res.render("login", { error_message: "Invalid email or password" });
      }
    })
    .catch((err) => {
      console.error("Login error:", err);
      res.render("login", {
        error_message: "Database error. Please try again.",
      });
    });
});

app.get("/login", (req, res) => {
  if (req.session.isLoggedIn) {
    res.redirect("dashboard");
  } else {
    res.render("login", { error_message: "" });
  }
});

app.get("/signup", (req, res) => {
  if (req.session.isLoggedIn) return res.redirect("/dashboard");
  res.render("signup", { error_message: "" });
});

app.post("/signup", (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.toLowerCase().trim();
  const password = req.body.password?.trim();

  if (!name || !email || !password) {
    return res.render("signup", {
      error_message: "All fields are required.",
    });
  }

  knex("users")
    .select("email")
    .where("email", email)
    .then((users) => {
      if (users.length > 0) {
        return res.render("signup", {
          error_message: "Email already exists.",
        });
      }

      return knex("users")
        .insert({ name, email, password })
        .then(() => {
          console.log(`New user created: ${email}`);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      console.error("Signup error:", err);
      res.render("signup", {
        error_message: "Database error. Please try again.",
      });
    });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect("/");
  });
});

// public landing page
app.get("/", (req, res) => {
  res.render("index", { isLoggedIn: req.session.isLoggedIn || false });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// start server
app.listen(port, "0.0.0.0", () => {
  console.log(`The server is listening port ${process.env.APP_PORT}`);
});
