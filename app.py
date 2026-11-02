from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

DATABASE = 'database.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            description TEXT,
            date TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            month TEXT NOT NULL UNIQUE,
            amount REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    conn = get_db_connection()
    try:
        filter_type = request.args.get('type', 'all')
        category = request.args.get('category', 'all')
        date_filter = request.args.get('date', 'all')
        search = request.args.get('search', '')
        sort = request.args.get('sort', 'newest')
        
        query = 'SELECT * FROM transactions WHERE 1=1'
        params = []
        
        if filter_type != 'all':
            query += ' AND type = ?'
            params.append(filter_type)
        
        if category != 'all':
            query += ' AND category = ?'
            params.append(category)
        
        if date_filter == 'today':
            query += ' AND date = ?'
            params.append(datetime.now().strftime('%Y-%m-%d'))
        elif date_filter == 'week':
            week_ago = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            query += ' AND date >= ?'
            params.append(week_ago)
        elif date_filter == 'month':
            query += " AND strftime('%Y-%m', date) = ?"
            params.append(datetime.now().strftime('%Y-%m'))
        elif date_filter == 'year':
            query += " AND strftime('%Y', date) = ?"
            params.append(datetime.now().strftime('%Y'))
        
        if search:
            query += ' AND (title LIKE ? OR category LIKE ? OR description LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
        
        if sort == 'newest':
            query += ' ORDER BY date DESC, created_at DESC'
        elif sort == 'oldest':
            query += ' ORDER BY date ASC, created_at ASC'
        elif sort == 'highest':
            query += ' ORDER BY amount DESC'
        elif sort == 'lowest':
            query += ' ORDER BY amount ASC'
        elif sort == 'az':
            query += ' ORDER BY title ASC'
        
        cursor = conn.execute(query, params)
        transactions = cursor.fetchall()
        
        result = []
        for row in transactions:
            result.append({
                'id': row['id'],
                'type': row['type'],
                'title': row['title'],
                'amount': row['amount'],
                'category': row['category'],
                'description': row['description'],
                'date': row['date'],
                'created_at': row['created_at'],
                'updated_at': row['updated_at']
            })
        
        return jsonify(result)
    finally:
        conn.close()

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    conn = get_db_connection()
    try:
        data = request.get_json()
        
        if not data or 'amount' not in data or 'title' not in data or 'type' not in data or 'date' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        if float(data['amount']) <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO transactions (type, title, amount, category, description, date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['type'],
            data['title'],
            float(data['amount']),
            data.get('category', ''),
            data.get('description', ''),
            data['date']
        ))
        
        conn.commit()
        return jsonify({'success': True, 'id': cursor.lastrowid})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    conn = get_db_connection()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'amount' in data and float(data['amount']) <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE transactions 
            SET type = ?, title = ?, amount = ?, category = ?, description = ?, date = ?, updated_at = ?
            WHERE id = ?
        ''', (
            data.get('type'),
            data.get('title'),
            float(data.get('amount', 0)),
            data.get('category', ''),
            data.get('description', ''),
            data.get('date'),
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            transaction_id
        ))
        
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/summary', methods=['GET'])
def get_summary():
    conn = get_db_connection()
    try:
        cursor = conn.execute('SELECT type, SUM(amount) as total FROM transactions GROUP BY type')
        rows = cursor.fetchall()
        
        summary = {'income': 0, 'expenses': 0, 'balance': 0, 'transaction_count': 0}
        
        for row in rows:
            if row['type'] == 'income':
                summary['income'] = row['total'] or 0
            elif row['type'] == 'expense':
                summary['expenses'] = row['total'] or 0
        
        summary['balance'] = summary['income'] - summary['expenses']
        
        cursor = conn.execute('SELECT COUNT(*) as count FROM transactions')
        summary['transaction_count'] = cursor.fetchone()['count']
        
        current_month = datetime.now().strftime('%Y-%m')
        cursor = conn.execute('''
            SELECT type, SUM(amount) as total 
            FROM transactions 
            WHERE strftime('%Y-%m', date) = ?
            GROUP BY type
        ''', (current_month,))
        rows = cursor.fetchall()
        
        summary['month_income'] = 0
        summary['month_expenses'] = 0
        
        for row in rows:
            if row['type'] == 'income':
                summary['month_income'] = row['total'] or 0
            elif row['type'] == 'expense':
                summary['month_expenses'] = row['total'] or 0
        
        summary['month_balance'] = summary['month_income'] - summary['month_expenses']
        
        return jsonify(summary)
    finally:
        conn.close()

@app.route('/api/chart-data', methods=['GET'])
def get_chart_data():
    conn = get_db_connection()
    try:
        cursor = conn.execute('''
            SELECT category, SUM(amount) as total 
            FROM transactions 
            WHERE type = 'expense' 
            GROUP BY category
        ''')
        rows = cursor.fetchall()
        
        expense_by_category = {}
        for row in rows:
            if row['category']:
                expense_by_category[row['category']] = row['total'] or 0
        
        cursor = conn.execute('''
            SELECT type, SUM(amount) as total 
            FROM transactions 
            GROUP BY type
        ''')
        rows = cursor.fetchall()
        
        income_vs_expense = {'income': 0, 'expense': 0}
        for row in rows:
            if row['type'] == 'income':
                income_vs_expense['income'] = row['total'] or 0
            elif row['type'] == 'expense':
                income_vs_expense['expense'] = row['total'] or 0
        
        return jsonify({
            'expense_by_category': expense_by_category,
            'income_vs_expense': income_vs_expense
        })
    finally:
        conn.close()

@app.route('/api/monthly-summary', methods=['GET'])
def get_monthly_summary():
    conn = get_db_connection()
    try:
        month = request.args.get('month', datetime.now().strftime('%Y-%m'))
        
        cursor = conn.execute('''
            SELECT type, SUM(amount) as total 
            FROM transactions 
            WHERE strftime('%Y-%m', date) = ?
            GROUP BY type
        ''', (month,))
        rows = cursor.fetchall()
        
        summary = {'income': 0, 'expenses': 0, 'balance': 0}
        for row in rows:
            if row['type'] == 'income':
                summary['income'] = row['total'] or 0
            elif row['type'] == 'expense':
                summary['expenses'] = row['total'] or 0
        
        summary['balance'] = summary['income'] - summary['expenses']
        
        return jsonify(summary)
    finally:
        conn.close()

@app.route('/api/budget', methods=['GET'])
def get_budget():
    conn = get_db_connection()
    try:
        current_month = datetime.now().strftime('%Y-%m')
        cursor = conn.execute('SELECT amount FROM budgets WHERE month = ?', (current_month,))
        row = cursor.fetchone()
        
        if row:
            budget = row['amount']
        else:
            budget = 0
        
        cursor = conn.execute('''
            SELECT SUM(amount) as total 
            FROM transactions 
            WHERE type = 'expense' AND strftime('%Y-%m', date) = ?
        ''', (current_month,))
        row = cursor.fetchone()
        spent = row['total'] or 0
        
        return jsonify({
            'budget': budget,
            'spent': spent,
            'remaining': budget - spent
        })
    finally:
        conn.close()

@app.route('/api/budget', methods=['POST'])
def set_budget():
    conn = get_db_connection()
    try:
        data = request.get_json()
        
        if not data or 'amount' not in data:
            return jsonify({'error': 'Missing amount'}), 400
        
        current_month = datetime.now().strftime('%Y-%m')
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM budgets WHERE month = ?', (current_month,))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute('''
                UPDATE budgets SET amount = ?, updated_at = ? WHERE month = ?
            ''', (float(data['amount']), datetime.now().strftime('%Y-%m-%d %H:%M:%S'), current_month))
        else:
            cursor.execute('''
                INSERT INTO budgets (month, amount) VALUES (?, ?)
            ''', (current_month, float(data['amount'])))
        
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    conn = get_db_connection()
    try:
        cursor = conn.execute('SELECT * FROM transactions ORDER BY date DESC')
        transactions = cursor.fetchall()
        
        csv_content = 'ID,Type,Title,Amount,Category,Description,Date,Created At\n'
        for row in transactions:
            csv_content += f"{row['id']},{row['type']},{row['title']},{row['amount']},{row['category']},{row['description']},{row['date']},{row['created_at']}\n"
        
        return csv_content, 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=transactions.csv'
        }
    finally:
        conn.close()

@app.route('/api/clear-all', methods=['DELETE'])
def clear_all_transactions():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM transactions')
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
