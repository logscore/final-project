-- script to create tables for a personal finance management application
-- Drop existing tables in correct order
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table for transaction categorization
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Insert sample user for testing
INSERT INTO users (name, email, password) VALUES
('Joe', 'user@gmail.com', '$2b$10$u9k7.U8.H7LZ1zU3.L0K2eZzC.7FUzYvH8JXgpqXJ1I6Qs8Q.8f52');

-- Get the user ID and insert sample data
DO $$
DECLARE
  v_user_id INT;
  v_salary_id INT;
  v_groceries_id INT;
  v_utilities_id INT;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = 'user@gmail.com';
  
  -- Insert sample categories
  INSERT INTO categories (name, type, user_id) VALUES
  ('Salary', 'income', v_user_id),
  ('Freelance', 'income', v_user_id),
  ('Groceries', 'expense', v_user_id),
  ('Utilities', 'expense', v_user_id),
  ('Entertainment', 'expense', v_user_id),
  ('Transportation', 'expense', v_user_id),
  ('Health', 'expense', v_user_id);
  
  -- Get category IDs
  SELECT id INTO v_salary_id FROM categories WHERE name = 'Salary' AND user_id = v_user_id;
  SELECT id INTO v_groceries_id FROM categories WHERE name = 'Groceries' AND user_id = v_user_id;
  SELECT id INTO v_utilities_id FROM categories WHERE name = 'Utilities' AND user_id = v_user_id;
  
  -- Insert sample transactions
  INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date) VALUES
  (v_user_id, v_salary_id, 'income', 3000.00, 'Monthly salary', CURRENT_DATE - INTERVAL '10 days'),
  (v_user_id, v_groceries_id, 'expense', 150.50, 'Weekly groceries', CURRENT_DATE - INTERVAL '5 days'),
  (v_user_id, v_utilities_id, 'expense', 120.00, 'Electric bill', CURRENT_DATE - INTERVAL '3 days');
END $$;
