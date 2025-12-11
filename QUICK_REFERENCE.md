# Personal Budget Planner - Quick Reference Guide

## 📍 Application Routes

### Public Routes (No Authentication Required)
- `GET /` - Landing page
- `GET /login` - Login form
- `POST /login` - Process login
- `GET /signup` - Signup form
- `POST /signup` - Process signup
- `GET /logout` - Logout user
- `GET /health` - Health check

### Protected Routes (Authentication Required)
- `GET /dashboard` - Main dashboard with transactions
- `GET /add-transaction` - Add transaction form
- `POST /add-transaction` - Save new transaction
- `GET /edit-transaction/:id` - Edit transaction form
- `POST /edit-transaction/:id` - Update transaction
- `GET /delete-transaction/:id` - Delete transaction

---

## 🔄 User Flow

### New User Flow
1. User visits `/` (landing page)
2. Clicks "Create Account" or "Sign Up"
3. Fills signup form with name, email, password
4. Password is hashed with bcrypt
5. Redirected to `/login`
6. User logs in with email/password
7. Session is created
8. Redirected to `/dashboard`

### Returning User Flow
1. User visits `/` (landing page)
2. Clicks "Login"
3. Enters email and password
4. bcrypt compares with stored hash
5. Session is created if match
6. Redirected to `/dashboard`

### Transaction Management Flow
1. User on dashboard clicks "Add Transaction"
2. Fills form: type, category, amount, description, date
3. Submits form to `/add-transaction`
4. Transaction saved to database
5. Redirected back to `/dashboard`
6. User can search, filter, edit, or delete

---

## 🔑 Key Features

### 1. Search & Filter
- **Search**: Find transactions by description or category name
- **Filter**: Show all, income only, or expenses only
- **Real-time**: Updates instantly on form submission

### 2. Statistics
- **Total Income**: Sum of all income transactions
- **Total Expenses**: Sum of all expense transactions
- **Balance**: Income minus Expenses
- **Count**: Number of transactions

### 3. Transaction Management
- **Add**: Create new income or expense record
- **Edit**: Modify existing transaction details
- **Delete**: Remove transaction with confirmation
- **Date**: Track when each transaction occurred

### 4. Categories
Pre-populated categories:
- **Income**: Salary, Freelance
- **Expenses**: Groceries, Utilities, Entertainment, Transportation, Health

---

## 🗄️ Database Queries

### Create User
```sql
INSERT INTO users (name, email, password) VALUES (?, ?, ?);
```

### Create Transaction
```sql
INSERT INTO transactions 
  (user_id, category_id, type, amount, description, transaction_date)
VALUES (?, ?, ?, ?, ?, ?);
```

### Get User Transactions with Search
```sql
SELECT transactions.*, categories.name as category_name
FROM transactions
LEFT JOIN categories ON transactions.category_id = categories.id
WHERE transactions.user_id = ?
  AND (transactions.description ILIKE ? OR categories.name ILIKE ?)
  AND transactions.type = ?
ORDER BY transaction_date DESC;
```

### Update Transaction
```sql
UPDATE transactions
SET type = ?, amount = ?, description = ?, category_id = ?, transaction_date = ?
WHERE id = ? AND user_id = ?;
```

### Delete Transaction
```sql
DELETE FROM transactions WHERE id = ? AND user_id = ?;
```

---

## 🎨 Color Scheme

| Element | Color | Hex | Use |
|---------|-------|-----|-----|
| Primary | Purple-Blue | #667eea | Buttons, Links |
| Secondary | Deep Purple | #764ba2 | Hover States |
| Success | Green | #28a745 | Income, Positive |
| Error | Red | #dc3545 | Expenses, Alerts |
| Background | Light Gray | #f4f6f8 | Page Background |
| Card | White | #ffffff | Cards, Forms |
| Text | Dark Gray | #333 | Main Text |

---

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: > 768px

All views are fully responsive with CSS media queries.

---

## 🔐 Security Implementation

1. **Password Hashing**
   - Algorithm: bcrypt
   - Salt Rounds: 10
   - No plaintext passwords stored

2. **Session Security**
   - Store: PostgreSQL
   - Max Age: 7 days
   - Secure: HTTPS ready

3. **User Isolation**
   - Query filters by user_id
   - Users can only access own data
   - No cross-user data leakage

4. **Input Validation**
   - Required field checks
   - Email format validation
   - Amount decimal validation
   - Date validation

---

## 🚀 Performance Considerations

1. **Database Indexes**
   - user_id on transactions
   - transaction_date for sorting
   - category_id for joins

2. **Query Optimization**
   - Uses LEFT JOIN for categories
   - Orders by date DESC for recent first
   - Limits search scope to single user

3. **Frontend**
   - Lightweight Bootstrap CDN
   - CSS variables for theming
   - Minimal JavaScript

---

## 📊 Example Transactions

| Date | Category | Description | Type | Amount |
|------|----------|-------------|------|--------|
| 2025-12-01 | Salary | Monthly salary | income | $3000.00 |
| 2025-11-28 | Groceries | Weekly shopping | expense | $150.50 |
| 2025-11-26 | Utilities | Electric bill | expense | $120.00 |

---

## ⚙️ Environment Variables

Required in `.env` file:

```env
# Server
APP_PORT=3000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=budget_planner

# Session
SESSION_SECRET=your_secret_key_here
```

---

## 🧪 Testing

### Test Account Credentials
- **Email**: user@gmail.com
- **Password**: password123

### Test Transactions
After login, try:
1. Adding an income transaction
2. Adding an expense transaction
3. Searching for a transaction
4. Filtering by transaction type
5. Editing a transaction
6. Deleting a transaction

---

## 🐛 Troubleshooting

### "Password mismatch" on login
- Ensure PostgreSQL has the sample user
- Check password is hashed (starts with $2b$)

### "Cannot find categories"
- Run SQL setup script
- Categories tied to user_id

### Transactions not showing
- Check you're logged in
- Verify user_id matches session
- Check transaction_date is not in future

### Date picker showing wrong date
- Date should be formatted as YYYY-MM-DD
- Check browser console for errors

---

## 📚 Additional Resources

- **Bootstrap**: https://getbootstrap.com/
- **EJS**: https://ejs.co/
- **bcrypt**: https://github.com/kelektiv/node.bcrypt.js
- **Knex.js**: http://knexjs.org/
- **PostgreSQL**: https://www.postgresql.org/

---

**Happy budgeting! 💰**
