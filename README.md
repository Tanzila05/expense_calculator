# Expense Calculator

A modern, responsive expense management application built with Flask, HTML5, CSS3, and JavaScript. Track your income and expenses with beautiful charts, budgets, and comprehensive transaction management.

## Features

### Dashboard
- **Total Income** - Sum of all income transactions
- **Total Expenses** - Sum of all expense transactions
- **Remaining Balance** - Income minus expenses
- **Transaction Count** - Total number of transactions
- **Current Month Summary** - Monthly financial overview

### Transaction Management
- Add income and expense transactions
- Edit existing transactions
- Delete transactions with confirmation
- Transaction history with detailed information
- Search transactions by title, category, or description
- Filter by type (income/expense), category, and date
- Sort by newest, oldest, highest amount, lowest amount, or A-Z

### Budget Feature
- Set monthly budget limits
- Track spending against budget
- Visual progress bar
- Warning notifications when approaching or exceeding budget

### Charts & Analytics
- **Expense by Category** - Doughnut chart showing expense distribution
- **Income vs Expenses** - Bar chart comparing income and expenses
- **Monthly Summary** - Select any month to view its financial summary

### Additional Features
- **Dark/Light Mode** - Toggle between themes (saved in localStorage)
- **Export to CSV** - Download all transactions as CSV file
- **Clear All** - Option to delete all transactions
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Keyboard Shortcuts** - Press Ctrl+N to quickly add a transaction
- **Toast Notifications** - Feedback for all actions
- **Indian Rupee Currency** - Formatted as ₹ (easily modifiable)

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **Database**: SQLite
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **Charts**: Chart.js
- **Styling**: Custom CSS with CSS variables for theming

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Steps

1. **Navigate to the project directory**
   ```bash
   cd "expense calculator"
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open in browser**
   - The application will start running on `http://127.0.0.1:5000`
   - Open this URL in your web browser

## Project Structure

```
expense-calculator/
│
├── app.py                 # Flask backend with API endpoints
├── database.db            # SQLite database (auto-created)
├── requirements.txt       # Python dependencies
├── README.md             # This file
│
├── templates/
│   └── index.html        # Main HTML template
│
└── static/
    ├── css/
    │   └── style.css     # Custom CSS styling
    │
    └── js/
        └── script.js     # Frontend JavaScript logic
```

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions (supports filtering, sorting, search)
- `POST /api/transactions` - Add a new transaction
- `PUT /api/transactions/<id>` - Update an existing transaction
- `DELETE /api/transactions/<id>` - Delete a transaction

### Summary & Analytics
- `GET /api/summary` - Get dashboard summary (income, expenses, balance)
- `GET /api/chart-data` - Get data for charts
- `GET /api/monthly-summary` - Get summary for a specific month

### Budget
- `GET /api/budget` - Get current budget status
- `POST /api/budget` - Set monthly budget

### Export & Utilities
- `GET /api/export-csv` - Export transactions as CSV
- `DELETE /api/clear-all` - Delete all transactions

## Usage Guide

### Adding a Transaction

1. Click the "Add Transaction" button (or press Ctrl+N)
2. Select transaction type (Income or Expense)
3. Enter the title and amount
4. Select a category (options change based on type)
5. Choose the date
6. Add an optional description
7. Click "Save"

### Editing a Transaction

1. Find the transaction in the history table
2. Click the edit (pencil) icon
3. Modify the desired fields
4. Click "Save"

### Deleting a Transaction

1. Find the transaction in the history table
2. Click the delete (trash) icon
3. Confirm the deletion in the modal

### Setting a Budget

1. Click the "Set Budget" button in the budget section
2. Enter your monthly budget amount
3. Click "Save Budget"
4. The progress bar will show your spending

### Filtering & Searching

- **Search**: Type in the search box to find transactions by title, category, or description
- **Filter Type**: Select "All", "Income", or "Expense"
- **Filter Category**: Select a specific category
- **Filter Date**: Choose "Today", "This Week", "This Month", or "This Year"
- **Sort**: Arrange by "Newest", "Oldest", "Highest Amount", "Lowest Amount", or "A-Z"

### Viewing Monthly Summary

1. Use the month selector in the "Monthly Summary" section
2. Select any month to view its income, expenses, and balance

### Exporting Data

1. Click the "Export CSV" button
2. The transactions will be downloaded as a CSV file
3. Open in Excel or any spreadsheet application

## Database Schema

### Transactions Table
- `id` - Primary key
- `type` - Transaction type (income/expense)
- `title` - Transaction title
- `amount` - Transaction amount
- `category` - Transaction category
- `description` - Optional description
- `date` - Transaction date
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Budgets Table
- `id` - Primary key
- `month` - Month identifier (YYYY-MM format)
- `amount` - Budget amount
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Customization

### Changing Currency

To change the currency from Indian Rupees (₹):

1. **Backend (app.py)**: No changes needed (amounts stored as numbers)
2. **Frontend (script.js)**: Update the `formatCurrency` function:
   ```javascript
   function formatCurrency(amount) {
       return '$' + parseFloat(amount).toLocaleString('en-US', {
           maximumFractionDigits: 2
       });
   }
   ```

3. **HTML (index.html)**: Update currency symbols in the UI

### Adding Categories

To add new categories:

1. **Backend**: No changes needed (categories stored as strings)
2. **HTML (index.html)**: Add options to the category select dropdown
3. **JavaScript (script.js)**: Update the `updateCategoryOptions` function

### Color Scheme

Colors are defined as CSS variables in `style.css`:
```css
:root {
    --primary-color: #4f46e5;
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* ... etc */
}
```

Modify these variables to change the color scheme.

## Sample Data for Testing

Here are some sample transactions to test the application:

### Income
- Salary: ₹40,000 (Salary category)
- Freelance: ₹8,000 (Freelance category)
- Investment: ₹2,000 (Other category)

### Expenses
- Food: ₹2,500 (Food category)
- Transport: ₹1,500 (Transport category)
- Shopping: ₹3,000 (Shopping category)
- Bills: ₹5,000 (Bills category)
- Entertainment: ₹1,500 (Entertainment category)
- Health: ₹2,000 (Health category)

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, modify the port in `app.py`:
```python
app.run(debug=True, port=5001)  # Change to 5001 or any available port
```

### Database Issues
If you encounter database errors, delete `database.db` and restart the application. The database will be recreated automatically.

### Dependencies Not Installing
If you have trouble installing dependencies, try:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## Security Notes

- This is a development application. For production use:
  - Disable debug mode
  - Use a production WSGI server (Gunicorn, uWSGI)
  - Implement user authentication
  - Add input validation and sanitization
  - Use environment variables for sensitive data
  - Implement CSRF protection
  - Add rate limiting

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please refer to the project documentation or contact the development team.

---

**Happy Budgeting! 💰**
