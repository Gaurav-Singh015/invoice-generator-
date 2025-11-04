let invoiceItems = [];
const initialBillFromValue = `ACME Solutions Ltd.
123 Tech Park
San Francisco, CA 94107
contact@acme.com`;
const initialBillToValue = `Client Name Inc.
456 Innovation Way
New York, NY 10001
client@name.com`;
const initialNotesValue = `Payment is due within 30 days. Thank you for your business! Please see additional terms on our website (www.yourcompany.com/terms).`;

const billFromEl = document.getElementById('bill-from');
const billToEl = document.getElementById('bill-to');
const notesEl = document.getElementById('notes');

billFromEl.setAttribute('data-initial-value', initialBillFromValue);
billToEl.setAttribute('data-initial-value', initialBillToValue);

const logoContainer = document.getElementById('logo-container');
const logoImage = document.getElementById('logo-image');
const defaultTitle = document.getElementById('default-title');
const removeLogoBtn = document.getElementById('remove-logo-btn');
const LOCAL_STORAGE_KEY_LOGO = 'smart_invoice_logo';
const LOCAL_STORAGE_KEY_DATA = 'smart_invoice_data';

// =========================
//  LOGO HANDLING FUNCTIONS
// =========================
function renderLogo() {
  const logoBase64 = localStorage.getItem(LOCAL_STORAGE_KEY_LOGO);
  if (logoBase64) {
    logoImage.src = logoBase64;
    logoImage.classList.remove('hidden');
    defaultTitle.classList.add('hidden');
    removeLogoBtn.classList.remove('hidden');
    logoContainer.setAttribute('data-logo-state', 'present');
    defaultTitle.classList.remove('hide-on-print');
  } else {
    logoImage.src = '';
    logoImage.classList.add('hidden');
    defaultTitle.classList.remove('hidden');
    removeLogoBtn.classList.add('hidden');
    logoContainer.setAttribute('data-logo-state', 'absent');
    defaultTitle.classList.add('hide-on-print');
  }
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    localStorage.setItem(LOCAL_STORAGE_KEY_LOGO, e.target.result);
    renderLogo();
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  localStorage.removeItem(LOCAL_STORAGE_KEY_LOGO);
  renderLogo();
  document.getElementById('logo-upload').value = '';
}

// =========================
//  INPUT & NOTES FUNCTIONS
// =========================
function handleFocusClear(e) {
  const textarea = e.target;
  const initialValue = textarea.getAttribute('data-initial-value');
  if (textarea.value === initialValue) textarea.value = '';
}

function autoExpandNotes() {
  notesEl.style.height = 'auto';
  notesEl.style.height = notesEl.scrollHeight + 'px';
}

// =========================
//  ITEM HANDLING FUNCTIONS
// =========================
function updateItemAmount(index) {
  const item = invoiceItems[index];
  const qty = parseFloat(document.getElementById(`qty-${index}`).value) || 0;
  const rate = parseFloat(document.getElementById(`rate-${index}`).value) || 0;
  const amount = qty * rate;

  item.description = document.getElementById(`desc-${index}`).value;
  item.qty = qty;
  item.rate = rate;
  item.amount = amount;

  document.getElementById(`amount-${index}`).textContent = formatCurrency(amount);
  calculateTotals();
  saveInvoice();
}

function addItem() {
  const newItem = { description: 'New Service/Product', qty: 1, rate: 100, amount: 100 };
  invoiceItems.push(newItem);
  renderItems();
  calculateTotals();
  saveInvoice();
}

function removeItem(index) {
  invoiceItems.splice(index, 1);
  renderItems();
  calculateTotals();
  saveInvoice();
}

function renderItems() {
  const itemList = document.getElementById('item-list');
  itemList.innerHTML = '';
  invoiceItems.forEach((item, index) => {
    const row = document.createElement('tr');
    row.classList.add('border-b', 'hover:bg-gray-50');
    row.innerHTML = `
      <td class="py-3 px-4">
        <input type="text" id="desc-${index}" value="${item.description}"
          class="w-full p-1 border border-gray-100 focus:border-indigo-400 rounded-md bg-transparent"
          oninput="invoiceItems[${index}].description = this.value; saveInvoice();">
      </td>
      <td class="py-3 px-4 text-right">
        <input type="number" id="qty-${index}" value="${item.qty}" min="0"
          class="w-16 p-1 text-right border border-gray-100 focus:border-indigo-400 rounded-md font-mono bg-transparent"
          oninput="updateItemAmount(${index});">
      </td>
      <td class="py-3 px-4 text-right">
        <input type="number" id="rate-${index}" value="${item.rate.toFixed(2)}" min="0" step="0.01"
          class="w-20 p-1 text-right border border-gray-100 focus:border-indigo-400 rounded-md font-mono bg-transparent"
          oninput="updateItemAmount(${index});">
      </td>
      <td class="py-3 px-4 text-right font-semibold" id="amount-${index}">${formatCurrency(item.amount)}</td>
      <td class="py-3 px-2 text-center print-hidden">
        <button onclick="removeItem(${index});" class="text-red-500 hover:text-red-700 transition duration-150">🗑</button>
      </td>`;
    itemList.appendChild(row);
  });
  autoExpandNotes();
}

// =========================
//  TOTALS & FORMATTING
// =========================
function calculateTotals() {
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxRate = parseFloat(document.getElementById('tax-rate').value) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const totalDue = subtotal + taxAmount;

  document.getElementById('subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('tax-amount').textContent = formatCurrency(taxAmount);
  document.getElementById('total-due').textContent = formatCurrency(totalDue);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

// =========================
//  SAVE & LOAD INVOICE
// =========================
function saveInvoice() {
  const invoiceData = {
    number: document.getElementById('invoice-number').value,
    date: document.getElementById('invoice-date').value,
    dueDate: document.getElementById('invoice-due-date').value,
    billFrom: billFromEl.value,
    billTo: billToEl.value,
    taxRate: document.getElementById('tax-rate').value,
    notes: notesEl.value,
    items: invoiceItems
  };
  localStorage.setItem(LOCAL_STORAGE_KEY_DATA, JSON.stringify(invoiceData));
}

function loadInvoice() {
  renderLogo();
  const storedData = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
  if (storedData) {
    const data = JSON.parse(storedData);
    document.getElementById('invoice-number').value = data.number || 'INV-2025-001';
    document.getElementById('invoice-date').value = data.date || new Date().toISOString().substring(0, 10);
    document.getElementById('invoice-due-date').value =
      data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    billFromEl.value = data.billFrom || initialBillFromValue;
    billToEl.value = data.billTo || initialBillToValue;
    document.getElementById('tax-rate').value = data.taxRate || '10';
    notesEl.value = data.notes || initialNotesValue;
    invoiceItems = data.items || [];
  } else {
    invoiceItems = [];
  }

  renderItems();
  calculateTotals();
  autoExpandNotes();
}

// =========================
//  RESET & PRINT
// =========================
function resetInvoice() {
  if (!confirm('Are you sure you want to reset this invoice?')) return;

  localStorage.removeItem(LOCAL_STORAGE_KEY_DATA);
  localStorage.removeItem(LOCAL_STORAGE_KEY_LOGO);

  document.getElementById('invoice-number').value = 'INV-2025-001';
  document.getElementById('invoice-date').value = new Date().toISOString().substring(0, 10);
  document.getElementById('invoice-due-date').value = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .substring(0, 10);

  billFromEl.value = initialBillFromValue;
  billToEl.value = initialBillToValue;
  notesEl.value = initialNotesValue;
  invoiceItems = [];
  renderItems();
  calculateTotals();
  renderLogo();
  autoExpandNotes();
}

function printInvoice() {
  window.print();
}

// =========================
//  INITIAL LOAD
// =========================
document.addEventListener('DOMContentLoaded', () => {
  loadInvoice();
});
