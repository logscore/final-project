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
        // ssl: { rejectUnauthorized: false },
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
  // Skip authentication for login routes and API endpoints
  if (
    req.path === "/" ||
    req.path === "/login" ||
    req.path === "/signup" ||
    req.path === "/logout" ||
    req.path.startsWith("/api/")
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
    // ssl: { rejectUnauthorized: false },
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
    .select("*")
    .where("email", sEmail)
    .first()
    .then((user) => {
      if (!user) {
        console.warn(`Failed login attempt for email: ${sEmail}`);
        return res.render("login", {
          error_message: "Invalid email or password",
        });
      }

      if (sPassword === user.password) {
        req.session.isLoggedIn = true;
        req.session.userId = user.id;
        req.session.email = user.email;
        req.session.name = user.name;
        console.log(`User logged in: ${user.email} (ID: ${user.id})`);
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

// ==============================
// DASHBOARD - Display all transactions
// ==============================
app.get("/dashboard", (req, res) => {
  const userId = req.session.userId;
  const searchTerm = req.query.search || "";
  const filterType = req.query.type || "all";

  let query = knex("transactions")
    .where("transactions.user_id", userId)
    .select("transactions.*", "categories.name as category_name")
    .leftJoin("categories", "transactions.category_id", "categories.id")
    .orderBy("transaction_date", "desc");

  // Apply search filter
  if (searchTerm) {
    query = query.where((builder) => {
      builder
        .where("description", "ilike", `%${searchTerm}%`)
        .orWhere("categories.name", "ilike", `%${searchTerm}%`);
    });
  }

  // Apply type filter
  if (filterType !== "all") {
    query = query.where("transactions.type", filterType);
  }

  query
    .then((transactions) => {
      // Calculate summary stats
      const stats = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: transactions.length,
      };

      transactions.forEach((t) => {
        if (t.type === "income") {
          stats.totalIncome += parseFloat(t.amount);
        } else {
          stats.totalExpense += parseFloat(t.amount);
        }
      });

      stats.balance = stats.totalIncome - stats.totalExpense;

      res.render("dashboard", {
        transactions,
        stats,
        userName: req.session.name,
        userEmail: req.session.email,
        searchTerm,
        filterType,
      });
    })
    .catch((err) => {
      console.error("Dashboard error:", err);
      res.render("dashboard", {
        transactions: [],
        stats: {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0,
        },
        userName: req.session.name,
        userEmail: req.session.email,
        searchTerm,
        filterType,
        error_message: "Error loading transactions",
      });
    });
});

// ==============================
// ADD TRANSACTION
// ==============================
app.get("/add-transaction", (req, res) => {
  knex("categories")
    .then((categories) => {
      res.render("add-transaction", {
        categories,
        userName: req.session.name,
      });
    })
    .catch((err) => {
      console.error("Categories error:", err);
      res.redirect("/dashboard");
    });
});

app.post("/add-transaction", (req, res) => {
  const { type, amount, description, category_id, transaction_date } = req.body;
  const userId = req.session.userId;

  if (!type || !amount || !description || !category_id || !transaction_date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  knex("transactions")
    .insert({
      user_id: userId,
      type,
      amount: parsedAmount,
      description,
      category_id: parseInt(category_id),
      transaction_date,
    })
    .then(() => {
      res.redirect("/dashboard");
    })
    .catch((err) => {
      console.error("Add transaction error:", err);
      res.status(500).json({ error: "Failed to add transaction" });
    });
});

// ==============================
// EDIT TRANSACTION
// ==============================
app.get("/edit-transaction/:id", (req, res) => {
  const transactionId = parseInt(req.params.id);
  const userId = req.session.userId;

  Promise.all([
    knex("transactions")
      .where("id", transactionId)
      .where("user_id", userId)
      .first(),
    knex("categories"),
  ])
    .then(([transaction, categories]) => {
      if (!transaction) {
        return res
          .status(404)
          .render("error", { message: "Transaction not found" });
      }

      // Format date for input field
      const transactionDate = transaction.transaction_date
        .toISOString()
        .split("T")[0];

      res.render("edit-transaction", {
        transaction: { ...transaction, transaction_date: transactionDate },
        categories,
        userName: req.session.name,
      });
    })
    .catch((err) => {
      console.error("Edit transaction error:", err);
      res.redirect("/dashboard");
    });
});

app.post("/edit-transaction/:id", (req, res) => {
  const transactionId = parseInt(req.params.id);
  const userId = req.session.userId;
  const { type, amount, description, category_id, transaction_date } = req.body;

  if (!type || !amount || !description || !category_id || !transaction_date) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  knex("transactions")
    .where("id", transactionId)
    .where("user_id", userId)
    .update({
      type,
      amount: parsedAmount,
      description,
      category_id: parseInt(category_id),
      transaction_date,
    })
    .then((rowsAffected) => {
      if (rowsAffected === 0) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.redirect("/dashboard");
    })
    .catch((err) => {
      console.error("Update transaction error:", err);
      res.status(500).json({ error: "Failed to update transaction" });
    });
});

// ==============================
// DELETE TRANSACTION
// ==============================
app.get("/delete-transaction/:id", (req, res) => {
  const transactionId = parseInt(req.params.id);
  const userId = req.session.userId;

  knex("transactions")
    .where("id", transactionId)
    .where("user_id", userId)
    .del()
    .then((rowsAffected) => {
      if (rowsAffected === 0) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.redirect("/dashboard");
    })
    .catch((err) => {
      console.error("Delete transaction error:", err);
      res.status(500).json({ error: "Failed to delete transaction" });
    });
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// start server
app.listen(port, "0.0.0.0", () => {
  console.log(`The server is listening port ${process.env.APP_PORT}`);
});
