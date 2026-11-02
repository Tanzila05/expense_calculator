// Global variables
let expenseChart = null;
let incomeExpenseChart = null;
let transactionModal = null;
let budgetModal = null;
let deleteModal = null;
let toast = null;
let deleteTransactionId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap modals
    transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    toast = new bootstrap.Toast(document.getElementById('toast'));
    
    // Load theme from localStorage
    loadTheme();
    
    // Set default date for transaction form
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    // Set default month for month selector
    document.getElementById('monthSelector').value = new Date().toISOString().slice(0, 7);
    
    // Load initial data
    loadDashboard();
    loadTransactions();
    loadBudget();
    updateCharts();
    loadMonthlySummary();
    
    // Event listeners
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Add transaction button
    document.getElementById('addTransactionBtn').addEventListener('click', showAddTransactionModal);
    
    // Save transaction button
    document.getElementById('saveTransactionBtn').addEventListener('click', saveTransaction);
    
    // Set budget button
    document.getElementById('setBudgetBtn').addEventListener('click', showBudgetModal);
    
    // Save budget button
    document.getElementById('saveBudgetBtn').addEventListener('click', saveBudget);
    
    // Confirm delete button
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(loadTransactions, 300));
    
    // Filter and sort controls
    document.getElementById('filterType').addEventListener('change', loadTransactions);
    document.getElementById('filterCategory').addEventListener('change', loadTransactions);
    document.getElementById('filterDate').addEventListener('change', loadTransactions);
    document.getElementById('sortBy').addEventListener('change', loadTransactions);
    
    // Export CSV button
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    
    // Clear all button
    document.getElementById('clearAllBtn').addEventListener('click', clearAllTransactions);
    
    // Month selector
    document.getElementById('monthSelector').addEventListener('change', loadMonthlySummary);
    
    // Transaction type change
    document.getElementById('transactionType').addEventListener('change', updateCategoryOptions);
    
    // Keyboard shortcut for adding transaction (Ctrl+N)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            showAddTransactionModal();
        }
    });
}

// Theme functions
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    
    // Update charts for theme
    updateCharts();
}

// Format currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        maximumFractionDigits: 2
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Load dashboard data
async function loadDashboard() {
    try {
        const response = await fetch('/api/summary');
        const data = await response.json();
        
        document.getElementById('totalIncome').textContent = formatCurrency(data.income);
        document.getElementById('totalExpenses').textContent = formatCurrency(data.expenses);
        document.getElementById('remainingBalance').textContent = formatCurrency(data.balance);
        document.getElementById('transactionCount').textContent = data.transaction_count;
        
        document.getElementById('monthIncome').textContent = formatCurrency(data.month_income);
        document.getElementById('monthExpenses').textContent = formatCurrency(data.month_expenses);
        document.getElementById('monthBalance').textContent = formatCurrency(data.month_balance);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load transactions
async function loadTransactions() {
    try {
        const filterType = document.getElementById('filterType').value;
        const filterCategory = document.getElementById('filterCategory').value;
        const filterDate = document.getElementById('filterDate').value;
        const search = document.getElementById('searchInput').value;
        const sort = document.getElementById('sortBy').value;
        
        const url = `/api/transactions?type=${filterType}&category=${filterCategory}&date=${filterDate}&search=${search}&sort=${sort}`;
        
        const response = await fetch(url);
        const transactions = await response.json();
        
        displayTransactions(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Display transactions in table
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionTableBody');
    const emptyState = document.getElementById('emptyState');
    
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="transaction-badge ${transaction.type}">${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
            </td>
            <td>${transaction.title}</td>
            <td>${transaction.category || '-'}</td>
            <td class="transaction-amount ${transaction.type}">${formatCurrency(transaction.amount)}</td>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description || '-'}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editTransaction(${transaction.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show add transaction modal
function showAddTransactionModal() {
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionDate').valueAsDate = new Date();
    updateCategoryOptions();
    transactionModal.show();
}

// Edit transaction
async function editTransaction(id) {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();
        const transaction = transactions.find(t => t.id === id);
        
        if (transaction) {
            document.getElementById('modalTitle').textContent = 'Edit Transaction';
            document.getElementById('transactionId').value = transaction.id;
            document.getElementById('transactionType').value = transaction.type;
            document.getElementById('transactionTitle').value = transaction.title;
            document.getElementById('transactionAmount').value = transaction.amount;
            document.getElementById('transactionCategory').value = transaction.category || '';
            document.getElementById('transactionDate').value = transaction.date;
            document.getElementById('transactionDescription').value = transaction.description || '';
            
            updateCategoryOptions();
            transactionModal.show();
        }
    } catch (error) {
        console.error('Error loading transaction:', error);
        showToast('Error loading transaction', 'error');
    }
}

// Save transaction
async function saveTransaction() {
    const id = document.getElementById('transactionId').value;
    const type = document.getElementById('transactionType').value;
    const title = document.getElementById('transactionTitle').value;
    const amount = document.getElementById('transactionAmount').value;
    const category = document.getElementById('transactionCategory').value;
    const date = document.getElementById('transactionDate').value;
    const description = document.getElementById('transactionDescription').value;
    
    // Validation
    if (!type || !title || !amount || !date) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (parseFloat(amount) <= 0) {
        showToast('Amount must be greater than 0', 'error');
        return;
    }
    
    const transactionData = {
        type,
        title,
        amount: parseFloat(amount),
        category,
        date,
        description
    };
    
    try {
        let response;
        if (id) {
            response = await fetch(`/api/transactions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            });
        } else {
            response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            });
        }
        
        const result = await response.json();
        
        if (response.ok) {
            transactionModal.hide();
            showToast(id ? 'Transaction updated successfully' : 'Transaction added successfully');
            loadDashboard();
            loadTransactions();
            loadBudget();
            updateCharts();
            loadMonthlySummary();
        } else {
            showToast(result.error || 'Error saving transaction', 'error');
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        showToast('Error saving transaction', 'error');
    }
}

// Delete transaction
function deleteTransaction(id) {
    deleteTransactionId = id;
    deleteModal.show();
}

// Confirm delete
async function confirmDelete() {
    if (!deleteTransactionId) return;
    
    try {
        const response = await fetch(`/api/transactions/${deleteTransactionId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            deleteModal.hide();
            showToast('Transaction deleted successfully');
            deleteTransactionId = null;
            loadDashboard();
            loadTransactions();
            loadBudget();
            updateCharts();
            loadMonthlySummary();
        } else {
            showToast(result.error || 'Error deleting transaction', 'error');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showToast('Error deleting transaction', 'error');
    }
}

// Update category options based on transaction type
function updateCategoryOptions() {
    const type = document.getElementById('transactionType').value;
    const categorySelect = document.getElementById('transactionCategory');
    const categoryContainer = document.getElementById('categoryContainer');
    
    if (type === 'income') {
        categorySelect.innerHTML = `
            <option value="">Select Category</option>
            <option value="Salary">Salary</option>
            <option value="Freelance">Freelance</option>
            <option value="Business">Business</option>
            <option value="Investment">Investment</option>
            <option value="Other">Other</option>
        `;
    } else if (type === 'expense') {
        categorySelect.innerHTML = `
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Education">Education</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Health">Health</option>
            <option value="Travel">Travel</option>
            <option value="Other">Other</option>
        `;
    }
}

// Load budget
async function loadBudget() {
    try {
        const response = await fetch('/api/budget');
        const data = await response.json();
        
        document.getElementById('budgetAmount').textContent = formatCurrency(data.budget);
        document.getElementById('budgetSpent').textContent = formatCurrency(data.spent);
        document.getElementById('budgetRemaining').textContent = formatCurrency(data.remaining);
        
        const progressBar = document.getElementById('budgetProgress');
        const percentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
        progressBar.style.width = Math.min(percentage, 100) + '%';
        
        if (percentage > 100) {
            progressBar.classList.add('bg-danger');
            progressBar.classList.remove('bg-success');
            document.getElementById('budgetWarning').textContent = '⚠️ You have exceeded your budget!';
        } else if (percentage > 80) {
            progressBar.classList.add('bg-warning');
            progressBar.classList.remove('bg-success', 'bg-danger');
            document.getElementById('budgetWarning').textContent = '⚠️ You are approaching your budget limit.';
        } else {
            progressBar.classList.add('bg-success');
            progressBar.classList.remove('bg-warning', 'bg-danger');
            document.getElementById('budgetWarning').textContent = '';
        }
    } catch (error) {
        console.error('Error loading budget:', error);
    }
}

// Show budget modal
function showBudgetModal() {
    document.getElementById('budgetForm').reset();
    budgetModal.show();
}

// Save budget
async function saveBudget() {
    const amount = document.getElementById('budgetAmountInput').value;
    
    if (!amount || parseFloat(amount) < 0) {
        showToast('Please enter a valid budget amount', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/budget', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: parseFloat(amount) })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            budgetModal.hide();
            showToast('Budget set successfully');
            loadBudget();
        } else {
            showToast(result.error || 'Error setting budget', 'error');
        }
    } catch (error) {
        console.error('Error saving budget:', error);
        showToast('Error saving budget', 'error');
    }
}

// Update charts
async function updateCharts() {
    try {
        const response = await fetch('/api/chart-data');
        const data = await response.json();
        
        updateExpenseChart(data.expense_by_category);
        updateIncomeExpenseChart(data.income_vs_expense);
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// Update expense chart
function updateExpenseChart(expenseByCategory) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    
    const labels = Object.keys(expenseByCategory);
    const values = Object.values(expenseByCategory);
    
    const colors = [
        '#ef4444',
        '#f59e0b',
        '#10b981',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
        '#06b6d4',
        '#84cc16',
        '#f97316',
        '#6366f1'
    ];
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        padding: 15,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Update income vs expense chart
function updateIncomeExpenseChart(incomeVsExpense) {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount',
                data: [incomeVsExpense.income, incomeVsExpense.expense],
                backgroundColor: ['#10b981', '#ef4444'],
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDark ? '#94a3b8' : '#64748b',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    },
                    grid: {
                        color: isDark ? '#334155' : '#e2e8f0'
                    }
                },
                x: {
                    ticks: {
                        color: isDark ? '#f1f5f9' : '#1e293b'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Load monthly summary
async function loadMonthlySummary() {
    const month = document.getElementById('monthSelector').value;
    
    try {
        const response = await fetch(`/api/monthly-summary?month=${month}`);
        const data = await response.json();
        
        document.getElementById('selectedMonthIncome').textContent = formatCurrency(data.income);
        document.getElementById('selectedMonthExpenses').textContent = formatCurrency(data.expenses);
        document.getElementById('selectedMonthBalance').textContent = formatCurrency(data.balance);
    } catch (error) {
        console.error('Error loading monthly summary:', error);
    }
}

// Export CSV
async function exportCSV() {
    try {
        const response = await fetch('/api/export-csv');
        const csvContent = await response.text();
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('CSV exported successfully');
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showToast('Error exporting CSV', 'error');
    }
}

// Clear all transactions
async function clearAllTransactions() {
    if (!confirm('Are you sure you want to delete all transactions? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/clear-all', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('All transactions cleared successfully');
            loadDashboard();
            loadTransactions();
            loadBudget();
            updateCharts();
            loadMonthlySummary();
        } else {
            showToast(result.error || 'Error clearing transactions', 'error');
        }
    } catch (error) {
        console.error('Error clearing transactions:', error);
        showToast('Error clearing transactions', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastElement = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toastElement.querySelector('.toast-header');
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toastHeader.querySelector('i').className = 'fas fa-exclamation-circle me-2';
        toastHeader.querySelector('i').style.color = '#ef4444';
    } else {
        toastHeader.querySelector('i').className = 'fas fa-check-circle me-2';
        toastHeader.querySelector('i').style.color = '#10b981';
    }
    
    toast.show();
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
