
// ======================================
// STUDENT BUDGET BUDDY
// Main JavaScript File
// ======================================

// 1. GET ELEMENTS

const incomeForm = document.getElementById("incomeForm");
const budgetForm = document.getElementById("budgetForm");
const expenseForm = document.getElementById("expenseForm");
const savingsForm = document.getElementById("savingsForm");

const incomeInput = document.getElementById("incomeInput");
const budgetInput = document.getElementById("budgetInput");
const expenseName = document.getElementById("expenseName");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDate = document.getElementById("expenseDate");
const savingsGoalInput = document.getElementById("savingsGoalInput");

// 2. LOAD DATA FROM LOCAL STORAGE

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved === null ? fallback : JSON.parse(saved);
    } catch (error) {
        console.error("Unable to load saved data:", error);
        return fallback;
    }
}

let income = loadData("studentIncome", 0);
let budget = loadData("studentBudget", 0);
let savingsGoal = loadData("studentSavingsGoal", 0);
let expenses = loadData("studentExpenses", []);

if (!Array.isArray(expenses)) {
    expenses = [];
}

// 3. SAVE DATA

function saveData() {
    localStorage.setItem("studentIncome", JSON.stringify(income));
    localStorage.setItem("studentBudget", JSON.stringify(budget));
    localStorage.setItem("studentSavingsGoal", JSON.stringify(savingsGoal));
    localStorage.setItem("studentExpenses", JSON.stringify(expenses));
}

// 4. FORMAT CURRENCY

function formatMoney(amount) {
    return "₹" + amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// 5. GET CURRENT MONTH EXPENSES

function getMonthlyExpenses() {
    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter(item => {
        const date = new Date(item.date + "T00:00:00");

        return date.getMonth() === currentMonth &&
               date.getFullYear() === currentYear;
    });
}

// 6. GET TOTAL EXPENSES

function getTotalExpenses() {
    return getMonthlyExpenses().reduce(
        (total, item) => total + item.amount,
        0
    );
}

// 7. UPDATE DASHBOARD

function updateDashboard() {

    const monthlyExpenses = getTotalExpenses();

    const balance = income - monthlyExpenses;

    // Update summary cards

    document.getElementById("totalIncome").textContent =
        formatMoney(income);

    document.getElementById("totalExpenses").textContent =
        formatMoney(monthlyExpenses);

    document.getElementById("remainingBalance").textContent =
        formatMoney(balance);

    // Savings are calculated from remaining income

    const savings = Math.max(balance, 0);

    document.getElementById("totalSavings").textContent =
        formatMoney(savings);

    // Budget calculations

    const percentage = budget > 0
        ? (monthlyExpenses / budget) * 100
        : 0;

    document.getElementById("budgetPercentage").textContent =
        percentage.toFixed(1) + "%";

    const progress = document.getElementById("budgetProgress");

    progress.style.width = Math.min(percentage, 100) + "%";

    // Budget warning

    const message = document.getElementById("budgetMessage");

    if (budget === 0) {
        message.textContent = "Set a monthly budget to begin.";
        progress.style.background = "#16a36a";
    }

    else if (percentage >= 100) {
        message.textContent =
            "⚠️ Your monthly budget has been exceeded!";

        progress.style.background = "#e05252";
    }

    else if (percentage >= 80) {
        message.textContent =
            "⚠️ Warning! You are close to your budget.";

        progress.style.background = "#e4a52c";
    }

    else {
        message.textContent =
            "✅ You are managing your budget well!";

        progress.style.background = "#16a36a";
    }

    // Savings goal calculations

    const savingsPercentage = savingsGoal > 0
        ? (savings / savingsGoal) * 100
        : 0;

    document.getElementById("savingsProgress").style.width =
        Math.min(savingsPercentage, 100) + "%";

    const savingsMessage =
        document.getElementById("savingsMessage");

    if (savingsGoal === 0) {
        savingsMessage.textContent =
            "Set a savings goal to begin.";
    }

    else if (savings >= savingsGoal) {
        savingsMessage.textContent =
            "🎉 Congratulations! You reached your savings goal!";
    }

    else {
        savingsMessage.textContent =
            formatMoney(savings) + " saved out of " +
            formatMoney(savingsGoal) + " (" +
            savingsPercentage.toFixed(1) + "%)";
    }

    updateTransactions();
    updateCharts();
    updateMoneyTip();
}

// 8. ADD MONTHLY INCOME

incomeForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const amount = Number(incomeInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid income amount.");
        return;
    }

    income = amount;

    saveData();
    updateDashboard();

    incomeForm.reset();

    alert("Monthly income updated successfully!");
});

// 9. SET MONTHLY BUDGET

budgetForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const amount = Number(budgetInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid budget.");
        return;
    }

    budget = amount;

    saveData();
    updateDashboard();

    budgetForm.reset();

    alert("Monthly budget set successfully!");
});

// 10. ADD NEW EXPENSE

expenseForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = expenseName.value.trim();
    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value;

    if (
        !name ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !date ||
        !["Food", "Travel", "Shopping", "Education",
          "Entertainment", "Health", "Other"].includes(category)
    ) {
        alert("Please enter valid expense details.");
        return;
    }

    // Prevent future dates

    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    if (date > localToday) {
        alert("Future expense dates are not allowed.");
        return;
    }

    const newExpense = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name: name,
        amount: amount,
        category: category,
        date: date
    };

    expenses.push(newExpense);

    saveData();
    updateDashboard();

    expenseForm.reset();
    setDefaultDate();

    alert("Expense added successfully!");
});

// 11. DISPLAY TRANSACTION HISTORY

function updateTransactions() {

    const list = document.getElementById("transactionList");

    list.innerHTML = "";

    const sortedExpenses = [...getMonthlyExpenses()].sort(
        (a, b) => b.date.localeCompare(a.date)
    );

    if (sortedExpenses.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No expenses added this month.";

        row.appendChild(cell);
        list.appendChild(row);

        return;
    }

    sortedExpenses.forEach(item => {

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = item.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = item.date;

        const amountCell = document.createElement("td");
        amountCell.textContent = formatMoney(item.amount);

        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";

        editButton.addEventListener("click", () => {
            editExpense(item.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", () => {
            deleteExpense(item.id);
        });

        actionCell.append(editButton, deleteButton);

        row.append(
            nameCell,
            categoryCell,
            dateCell,
            amountCell,
            actionCell
        );

        list.appendChild(row);
    });
}

// 12. EDIT EXPENSE

function editExpense(id) {

    const item = expenses.find(expense => expense.id === id);

    if (!item) return;

    const newName = prompt("Enter expense name:", item.name);

    if (newName === null) return;

    if (!newName.trim()) {
        alert("Expense name cannot be empty.");
        return;
    }

    const newAmount = prompt(
        "Enter new expense amount:",
        item.amount
    );

    if (newAmount === null) return;

    const amount = Number(newAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
    }

    item.name = newName.trim();
    item.amount = amount;

    saveData();
    updateDashboard();

    alert("Expense updated successfully!");
}

// 13. DELETE EXPENSE

function deleteExpense(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmDelete) return;

    expenses = expenses.filter(item => item.id !== id);

    saveData();
    updateDashboard();

    alert("Expense deleted successfully!");
}

// 14. CLEAR ALL EXPENSES

document.getElementById("clearExpenses")
    .addEventListener("click", function() {

        if (expenses.length === 0) {
            alert("There are no expenses to clear.");
            return;
        }

        const confirmClear = confirm(
            "Are you sure you want to delete all expenses?"
        );

        if (!confirmClear) return;

        expenses = [];

        saveData();
        updateDashboard();

        alert("All expenses have been deleted.");
    });

// 15. SET SAVINGS GOAL

savingsForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const amount = Number(savingsGoalInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid savings goal.");
        return;
    }

    savingsGoal = amount;

    saveData();
    updateDashboard();

    savingsForm.reset();

    alert("Savings goal updated!");
});

// 16. CATEGORY CHART

let categoryChart = null;
let overviewChart = null;

function updateCharts() {

    const monthlyExpenses = getMonthlyExpenses();

    const categories = [
        "Food",
        "Travel",
        "Shopping",
        "Education",
        "Entertainment",
        "Health",
        "Other"
    ];

    const categoryTotals = categories.map(category => {

        return monthlyExpenses
            .filter(item => item.category === category)
            .reduce((total, item) => total + item.amount, 0);

    });

    const categoryCanvas =
        document.getElementById("categoryChart");

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(categoryCanvas, {

        type: "doughnut",

        data: {
            labels: categories,

            datasets: [{
                data: categoryTotals,

                backgroundColor: [
                    "#4285F4",
                    "#16a36a",
                    "#f4b400",
                    "#ab47bc",
                    "#ff7043",
                    "#26a69a",
                    "#78909c"
                ],

                borderWidth: 2
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });

    // OVERVIEW CHART

    const overviewCanvas =
        document.getElementById("overviewChart");

    if (overviewChart) {
        overviewChart.destroy();
    }

    overviewChart = new Chart(overviewCanvas, {

        type: "bar",

        data: {
            labels: ["Income", "Expenses", "Balance"],

            datasets: [{
                label: "Amount in ₹",

                data: [
                    income,
                    getTotalExpenses(),
                    income - getTotalExpenses()
                ],

                backgroundColor: [
                    "#16a36a",
                    "#e05252",
                    "#3578d4"
                ],

                borderRadius: 7
            }]
        },

        options: {
            responsive: true,

            scales: {
                y: {
                    beginAtZero: true
                }
            },

            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 17. SMART MONEY TIPS

function updateMoneyTip() {

    const monthlyExpenses = getMonthlyExpenses();

    const categoryTotals = {};

    monthlyExpenses.forEach(item => {

        categoryTotals[item.category] =
            (categoryTotals[item.category] || 0) + item.amount;

    });

    const categories = Object.entries(categoryTotals);

    const tip = document.getElementById("moneyTip");

    if (categories.length === 0) {

        tip.textContent =
            "Start adding expenses to understand your spending habits.";

        return;
    }

    categories.sort((a, b) => b[1] - a[1]);

    const highest = categories[0];

    const percentage = monthlyExpenses.length > 0
        ? (highest[1] / getTotalExpenses()) * 100
        : 0;

    if (budget > 0 && getTotalExpenses() >= budget) {

        tip.textContent =
            "⚠️ You have exceeded your monthly budget. Avoid unnecessary purchases.";

    } else if (percentage >= 50) {

        tip.textContent =
            "💡 You spend the most on " + highest[0] +
            ". Consider reviewing this category.";

    } else {

        tip.textContent =
            "🌟 Good job! Continue tracking your spending and saving regularly.";
    }
}

// 18. DEFAULT DATE

function setDefaultDate() {

    const today = new Date();

    const localDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    expenseDate.value = localDate;
    expenseDate.max = localDate;
}

// 19. DISPLAY CURRENT DATE

document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

// 20. INITIALIZE WEBSITE

setDefaultDate();
updateDashboard();

console.log("Student Budget Buddy website loaded successfully!");
