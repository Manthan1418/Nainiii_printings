'use client';

interface InvoiceItem {
  name: string;
  unit?: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  invoiceNo: string;
  createdAt: string;
  customer: string;
  status: string;
  items: InvoiceItem[];
  deliveryCharge?: number;
  totalAmount: number;
  previousBalance?: number;
  amountPaid?: number;
  balanceDue?: number;
  notes?: string;
}

function printInvoice(sale: InvoiceData) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(v);

  const itemsTotal = (sale.items || []).reduce(
    (acc, it) => acc + (it.quantity ?? 0) * (it.price ?? 0), 0
  );
  const delivery = sale.deliveryCharge || 0;
  const grand = itemsTotal + delivery;
  const prevBal = sale.previousBalance || 0;
  const paid = sale.amountPaid || 0;
  const balDue = Math.max(0, grand + prevBal - paid);

  const rows = (sale.items || [])
    .map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${it.name || '—'}</td>
        <td class="center">${it.unit || 'pcs'}</td>
        <td class="right">${it.quantity}</td>
        <td class="right">${fmt(it.price)}</td>
        <td class="right bold">${fmt((it.quantity ?? 0) * (it.price ?? 0))}</td>
      </tr>`)
    .join('');

  const deliveryRow = delivery > 0 ? `
    <tr class="subtotal-row">
      <td colspan="5" class="right">Delivery Charges</td>
      <td class="right">${fmt(delivery)}</td>
    </tr>` : '';

  const date = sale.createdAt
    ? new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice ${sale.invoiceNo}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; }
    .page { max-width: 780px; margin: 0 auto; padding: 40px 48px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #e0e0e0; }
    .brand-name { font-size: 24px; font-weight: 800; color: #1565c0; letter-spacing: -0.5px; }
    .brand-sub  { font-size: 11px; color: #666; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-label { font-size: 22px; font-weight: 700; color: #1565c0; letter-spacing: 1px; text-transform: uppercase; }
    .invoice-no    { font-size: 13px; color: #555; margin-top: 4px; }
    .invoice-date  { font-size: 12px; color: #888; margin-top: 2px; }

    /* Bill to */
    .bill-section { display: flex; justify-content: space-between; padding: 20px 0; gap: 24px; }
    .bill-block h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
    .bill-block p  { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .bill-block .sub { font-size: 12px; font-weight: 400; color: #555; margin-top: 2px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #e3f2fd; color: #1565c0; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead th { background: #1565c0; color: #fff; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; }
    thead th:first-child { border-radius: 6px 0 0 0; }
    thead th:last-child  { border-radius: 0 6px 0 0; }
    tbody tr:nth-child(even) { background: #f7f9ff; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #e8ecf4; font-size: 13px; }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: 600; }
    .subtotal-row td { border-top: 1px solid #ddd; padding: 8px 12px; color: #555; font-size: 13px; }

    /* Totals */
    .totals { margin-top: 0; }
    .total-row { display: flex; justify-content: flex-end; }
    .total-box { width: 260px; margin-top: 4px; }
    .total-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; border-bottom: 1px solid #f0f0f0; }
    .total-line.grand { border-top: 2px solid #1565c0; border-bottom: none; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 800; color: #1565c0; }
    .total-line.balance-due { border-top: 2px solid #c62828; border-bottom: none; padding-top: 10px; margin-top: 4px; font-size: 15px; font-weight: 800; color: #c62828; }
    .total-line.balance-paid { border-top: 2px solid #2e7d32; border-bottom: none; padding-top: 10px; margin-top: 4px; font-size: 15px; font-weight: 800; color: #2e7d32; }

    /* Notes */
    .notes-section { margin-top: 28px; padding: 14px 16px; background: #f7f9ff; border-left: 4px solid #1565c0; border-radius: 0 6px 6px 0; }
    .notes-section h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
    .notes-section p  { font-size: 13px; color: #333; }

    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-msg { font-size: 12px; color: #888; max-width: 320px; }
    .footer-sig { text-align: right; }
    .footer-sig .line { width: 160px; border-top: 1px solid #333; margin-left: auto; margin-bottom: 4px; }
    .footer-sig .label { font-size: 11px; color: #666; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-name">Nainiii Printing</div>
      <div class="brand-sub">Bags &amp; Printing Services</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-label">Invoice</div>
      <div class="invoice-no">${sale.invoiceNo || sale.invoiceNo}</div>
      <div class="invoice-date">${date}</div>
    </div>
  </div>

  <!-- Bill To / Status -->
  <div class="bill-section">
    <div class="bill-block">
      <h4>Bill To</h4>
      <p>${sale.customer || 'Walk-in Customer'}</p>
    </div>
    <div class="bill-block" style="text-align:right">
      <h4>Status</h4>
      <span class="status-badge">${sale.status || 'Pending'}</span>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th style="text-align:left">Item Description</th>
        <th class="center" style="width:60px">Unit</th>
        <th class="right" style="width:60px">Qty</th>
        <th class="right" style="width:100px">Unit Price</th>
        <th class="right" style="width:110px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${deliveryRow}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="total-row">
    <div class="total-box">
      <div class="total-line">
        <span>Current Bill Subtotal</span>
        <span>${fmt(itemsTotal)}</span>
      </div>
      ${delivery > 0 ? `<div class="total-line"><span>Delivery Charge</span><span>${fmt(delivery)}</span></div>` : ''}
      ${prevBal > 0 ? `<div class="total-line"><span>Previous Balance</span><span>${fmt(prevBal)}</span></div>` : ''}
      <div class="total-line grand">
        <span>Total Payable</span>
        <span>${fmt(grand + prevBal)}</span>
      </div>
      ${paid > 0 ? `
      <div class="total-line"><span>Amount Received</span><span style="color:#2e7d32">- ${fmt(paid)}</span></div>
      <div class="total-line ${balDue > 0 ? 'balance-due' : 'balance-paid'}">
        <span>${balDue > 0 ? 'Remaining Balance' : '✓ Fully Paid'}</span>
        <span>${fmt(balDue)}</span>
      </div>
      ` : ''}
    </div>
  </div>

  ${sale.notes ? `
  <div class="notes-section">
    <h4>Notes</h4>
    <p>${sale.notes}</p>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-msg">Thank you for your business!<br/>For queries contact us directly.</div>
    <div class="footer-sig">
      <div class="line"></div>
      <div class="label">Authorised Signature</div>
    </div>
  </div>

</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export { printInvoice };
export type { InvoiceData };
