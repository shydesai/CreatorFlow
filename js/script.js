const incomeData = {};
const expenseData = {};
const incomeValues = new Array(12).fill(0);
const expenseValues = new Array(12).fill(0);
const chartLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ctx = document.getElementById('incomeChart').getContext('2d');
const incomeChart = new Chart(ctx, {
type: 'bar',
data: {
labels: chartLabels,
datasets: [
  {
    label: 'Income',
    data: incomeValues,
    backgroundColor: () => {
      return document.body.classList.contains('dark') ? '#4ADE80' : '#2d2d2d'; // Green in dark mode
    }
  },
  {
    label: 'Expenses',
    data: expenseValues,
    backgroundColor: () => {
      return document.body.classList.contains('dark') ? '#F87171' : '#CA3027'; // Red in dark mode
    }
  }
]
},
options: {
onClick: (event, elements, chart) => {
const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
if (points.length) {
const monthIndex = points[0].index;
showBreakdown(monthIndex);
}
},
responsive: true,
plugins: {
  legend: {
    labels: {
      color: document.body.classList.contains('dark') ? '#f3f4f6' : '#111827'
    }
  }
},
scales: {
  x: {
    ticks: {
      color: document.body.classList.contains('dark') ? '#f3f4f6' : '#111827'
    }
  },
  y: {
    ticks: {
      color: document.body.classList.contains('dark') ? '#f3f4f6' : '#111827'
    }
  }
}
}
});

function addIncome() {
  const fullDate = new Date(document.getElementById('fullDate').value);
  const month = fullDate.getMonth();
  const brand = document.getElementById('brand').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const invoice = document.getElementById('invoice').files[0] || null;

  if (!incomeData[month]) incomeData[month] = [];
  incomeData[month].push({ brand, amount, invoice });
  incomeValues[month] += amount;
  incomeChart.update();

  document.getElementById('brand').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('invoice').value = '';

  updateTaxEstimate();
  updateOverview();
}

function addExpense() {
const category = document.getElementById('expenseCategory').value;
const amount = parseFloat(document.getElementById('expenseAmount').value);
const expenseDate = new Date(document.getElementById('expenseDate').value);
const month = expenseDate.getMonth();
const receiptFile = document.getElementById('expenseReceipt').files[0];
const receipt = receiptFile || null;

if (!expenseData[month]) expenseData[month] = [];
expenseData[month].push({ category, amount, receipt });
expenseValues[month] += amount;
incomeChart.update();

document.getElementById('expenseAmount').value = '';
document.getElementById('expenseDate').value = '';
document.getElementById('expenseReceipt').value = '';

updateTaxEstimate();
updateOverview();
}

function updateTaxEstimate() {
  const totalIncome = incomeValues.reduce((a, b) => a + b, 0);
  const totalDeductions = expenseValues.reduce((a, b) => a + b, 0);
  const taxEstimate = totalIncome * 0.30;
  const adjustedTax = Math.max(0, (totalIncome - totalDeductions) * 0.30);
  const taxSavings = taxEstimate - adjustedTax;
  const quarter = Math.ceil((new Date().getMonth() + 1) / 3);

  document.getElementById('taxEstimate').innerText = taxEstimate.toFixed(2);
  document.getElementById('quarterlyEstimate').innerText = (adjustedTax / 4).toFixed(2);
  document.getElementById('currentQuarter').innerText = quarter;
  document.getElementById('totalDeductions').innerText = totalDeductions.toFixed(2);
  document.getElementById('adjustedTaxEstimate').innerText = adjustedTax.toFixed(2);
  document.getElementById('taxSavings').innerText = taxSavings.toFixed(2);

  const categoryTotals = {};
  Object.values(expenseData).flat().forEach(({ category, amount }) => {
    if (!categoryTotals[category]) categoryTotals[category] = 0;
    categoryTotals[category] += amount;
  });

  let table = '<table><thead><tr><th>Category</th><th>Amount</th><th>Tax Savings</th></tr></thead><tbody>';
  for (const cat in categoryTotals) {
    table += `<tr><td>${cat}</td><td>$${categoryTotals[cat].toFixed(2)}</td><td>$${(categoryTotals[cat]*0.3).toFixed(2)}</td></tr>`;
  }
  table += '</tbody></table>';
  document.getElementById('deductionBreakdown').innerHTML = table;
}
function updateOverview() {
let table = `
<table>
  <thead>
    <tr>
      <th>Month</th>
      <th>Total Income</th>
      <th>Total Expenses</th>
      <th>Profit</th>
    </tr>
  </thead>
  <tbody>
`;
for (let i = 0; i < 12; i++) {
if (incomeValues[i] > 0 || expenseValues[i] > 0) {
  const profit = incomeValues[i] - expenseValues[i];
  table += `
    <tr>
      <td>${chartLabels[i]}</td>
      <td>$${incomeValues[i].toFixed(2)}</td>
      <td>$${expenseValues[i].toFixed(2)}</td>
      <td style="color: ${profit >= 0 ? 'green' : 'red'};">$${profit.toFixed(2)}</td>
    </tr>
  `;
}
}

table += '</tbody></table>';
document.getElementById('monthlyOverview').innerHTML = table;
}

function removeIncome(month, index) {
const removed = incomeData[month].splice(index, 1)[0];
incomeValues[month] -= removed.amount;
updateTaxEstimate();
updateOverview();
incomeChart.update();
showBreakdown(month);
}

function removeExpense(month, index) {
const removed = expenseData[month].splice(index, 1)[0];
expenseValues[month] -= removed.amount;
updateTaxEstimate();
updateOverview();
incomeChart.update();
showExpenseBreakdown(month);
}

function showExpenseBreakdown(monthIndex) {
const expenseTable = document.getElementById('deductionBreakdown');
const entries = expenseData[monthIndex] || [];

let table = `
<table>
  <thead><tr><th>Category</th><th>Amount</th><th>Tax Savings</th><th>Remove</th></tr></thead>
  <tbody>
`;

entries.forEach((entry, index) => {
table += `
  <tr>
    <td>${entry.category}</td>
    <td>$${entry.amount.toFixed(2)}</td>
    <td>$${(entry.amount * 0.3).toFixed(2)}</td>
    <td><span style="color:red;cursor:pointer;" onclick="removeExpense(${monthIndex}, ${index})">❌</span></td>
  </tr>
`;
});

table += '</tbody></table>';
expenseTable.innerHTML = table;
}

// NEW SCRIPT FOR EXPENSE DATE
function showMonthSummary(monthIndex) {
const incomeTotal = incomeValues[monthIndex] || 0;
const expenseTotal = expenseValues[monthIndex] || 0;
const profit = incomeTotal - expenseTotal;
const monthName = chartLabels[monthIndex];
document.getElementById('selectedMonthDetails').innerHTML =
`📅 <strong>${monthName} Summary</strong>: 
$${incomeTotal.toFixed(2)} income | 
$${expenseTotal.toFixed(2)} expenses | 
<span style="color:${profit >= 0 ? 'green' : 'red'};">$${profit.toFixed(2)} profit</span>`;
}

function showBreakdown(monthIndex) {
showMonthSummary(monthIndex); // update summary above

const incomeEntries = incomeData[monthIndex] || [];
const expenses = expenseData[monthIndex] || [];

let html = `
<h4 style="margin-top:20px;">📋 Monthly Breakdown: ${chartLabels[monthIndex]}</h4>
<div class="table-wrapper">
`;
html += `
<table>
  <thead>
    <tr>
      <th>Type</th>
      <th>Description</th>
      <th>Amount</th>
      <th>Invoice/Receipt</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
`;

incomeEntries.forEach((entry, index) => {
const invoiceFile = entry.invoice;
const invoiceHTML = invoiceFile
? `<a href="${URL.createObjectURL(invoiceFile)}" target="_blank">View</a>`
: `Not Uploaded <span class="upload-icon" onclick="triggerUpload(${monthIndex}, ${index})"><i class="fas fa-upload"></i></span>
  <input type="file" id="upload-${monthIndex}-${index}" style="display:none;" onchange="handleFileUpload(event, ${monthIndex}, ${index})" />`;

html += `
<tr>
<td>💵 Income</td>
<td>${entry.brand}</td>
<td>
  $${entry.amount.toFixed(2)}
  <span class="edit-icon" onclick="editIncomeAmountPrompt(${monthIndex}, ${index})"><i class="fas fa-pen"></i></span>
</td>
<td>${invoiceHTML}</td>
<td><span style="color:red;cursor:pointer;" onclick="removeIncome(${monthIndex}, ${index})">❌</span></td>
</tr>
`;

});

expenses.forEach((entry, index) => {
html += `
  <tr>
    <td>💸 Expense</td>
    <td>${entry.category}</td>
    <td>
      $${entry.amount.toFixed(2)}
      <span class="edit-icon" onclick="editExpenseAmountPrompt(${monthIndex}, ${index})">✏️</span>
    </td>
  <td>
    ${entry.receipt
? `<a href="${URL.createObjectURL(entry.receipt)}" target="_blank">View</a>`
: `Not Uploaded <span class="upload-icon" onclick="triggerExpenseUpload(${monthIndex}, ${index})">📤</span>
    <input type="file" id="exp-upload-${monthIndex}-${index}" style="display:none;" onchange="handleExpenseReceiptUpload(event, ${monthIndex}, ${index})" />`
}
  </td>
    <td><span style="color:red;cursor:pointer;" onclick="removeExpense(${monthIndex}, ${index})">❌</span></td>
  </tr>
`;
});

html += `</tbody></table></div>`;
document.getElementById('selectedMonthBreakdown').innerHTML = html;
}

function editIncomeAmount(month, index, newValue) {
const amount = parseFloat(newValue);
if (!isNaN(amount)) {
const old = incomeData[month][index].amount;
incomeValues[month] = incomeValues[month] - old + amount;
incomeData[month][index].amount = amount;
incomeChart.update();
updateTaxEstimate();
updateOverview();
showBreakdown(month);
}
}

function editExpenseAmount(month, index, newValue) {
const amount = parseFloat(newValue);
if (!isNaN(amount)) {
const old = expenseData[month][index].amount;
expenseValues[month] = expenseValues[month] - old + amount;
expenseData[month][index].amount = amount;
incomeChart.update();
updateTaxEstimate();
updateOverview();
showBreakdown(month);
}
}
function editIncomeAmountPrompt(month, index) {
const newValue = prompt("Enter new income amount:");
if (!isNaN(newValue) && newValue !== null) {
editIncomeAmount(month, index, parseFloat(newValue));
}
}

function editExpenseAmountPrompt(month, index) {
const newValue = prompt("Enter new expense amount:");
if (!isNaN(newValue) && newValue !== null) {
editExpenseAmount(month, index, parseFloat(newValue));
}
}

function triggerUpload(month, index) {
document.getElementById(`upload-${month}-${index}`).click();
}

function handleFileUpload(event, month, index) {
const file = event.target.files[0];
if (file) {
// Store the full file object instead of just the name
incomeData[month][index].invoice = file;
showBreakdown(month); // Refresh the UI
}
}
function triggerExpenseUpload(month, index) {
document.getElementById(`exp-upload-${month}-${index}`).click();
}

function handleExpenseReceiptUpload(event, month, index) {
const file = event.target.files[0];
if (file) {
// Store the full file object instead of just the name
expenseData[month][index].receipt = file;
showBreakdown(month); // Refresh the UI
}
}
function toggleDarkMode() {
document.body.classList.toggle('dark');

// Force color refresh
incomeChart.data.datasets[0].backgroundColor = () => {
return document.body.classList.contains('dark') ? '#4ADE80' : '#2d2d2d';
};
incomeChart.data.datasets[1].backgroundColor = () => {
return document.body.classList.contains('dark') ? '#F87171' : '#CA3027';
};

incomeChart.options.plugins.legend.labels.color = document.body.classList.contains('dark') ? '#f3f4f6' : '#111827';
incomeChart.options.scales.x.ticks.color = document.body.classList.contains('dark') ? '#f3f4f6' : '#111827';
incomeChart.options.scales.y.ticks.color = document.body.classList.contains('dark') ? '#f3f4f6' : '#111827';

incomeChart.update();
}
(function seedDummyData() {
const dummyIncomes = [
{ date: '2024-01-12', brand: 'TikTok Shop', amount: 600 },
{ date: '2024-02-05', brand: 'Brand Collab HQ', amount: 950 },
{ date: '2024-03-18', brand: 'YouTube Shorts', amount: 780 },
{ date: '2024-04-08', brand: 'Reels Partner', amount: 1100 },
{ date: '2024-05-21', brand: 'Amazon Influencer', amount: 1250 },
{ date: '2024-06-10', brand: 'Instagram Brand Deal', amount: 870 },
{ date: '2024-07-02', brand: 'Sponsorship Alpha', amount: 1450 }
];

const dummyExpenses = [
{ month: 0, category: 'Equipment', amount: 300 },
{ month: 1, category: 'Software', amount: 120 },
{ month: 2, category: 'Marketing', amount: 180 },
{ month: 3, category: 'Travel', amount: 450 },
{ month: 4, category: 'HomeOffice', amount: 220 },
{ month: 5, category: 'Software', amount: 90 },
{ month: 6, category: 'Other', amount: 150 }
];

dummyIncomes.forEach(entry => {
const date = new Date(entry.date);
const month = date.getMonth();
if (!incomeData[month]) incomeData[month] = [];
incomeData[month].push({ brand: entry.brand, amount: entry.amount, invoice: null });
incomeValues[month] += entry.amount;
});

dummyExpenses.forEach(exp => {
if (!expenseData[exp.month]) expenseData[exp.month] = [];
expenseData[exp.month].push({ category: exp.category, amount: exp.amount });
expenseValues[exp.month] += exp.amount;
});

incomeChart.update();
updateTaxEstimate();
updateOverview();
})();

function scrollToSection(id) {
const section = document.getElementById(id);
if (section) {
  section.scrollIntoView({ behavior: 'smooth' });
}
}
