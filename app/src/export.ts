import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatINR } from '@rupli/shared';
import type { Spend } from './api';
import { monthLabel, when } from './logic/month';
import { spendCsv } from './logic/spend';
import { txnTitle } from './logic/text';

const esc = (s: string) => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

export async function exportCsv(spend: Spend) {
  const f = new File(Paths.cache, `rupli-${spend.month}.csv`);
  f.create({ overwrite: true });
  f.write(spendCsv(spend.transactions));
  await Sharing.shareAsync(f.uri, { mimeType: 'text/csv', dialogTitle: `Rupli spends · ${monthLabel(spend.month)}` });
}

export async function exportPdf(spend: Spend) {
  const rows = [...spend.transactions].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)).map(t =>
    `<tr><td>${esc(when(t.occurredAt))}</td><td>${esc(txnTitle(t))}</td><td>${esc(t.category.name)}</td><td class="r">${t.direction === 'credit' ? '+' : ''}${formatINR(t.amountPaise)}</td></tr>`).join('');
  const html = `<html><head><meta charset="utf-8"><style>
    body{font-family:sans-serif;color:#1d2a22;padding:24px} h1{color:#0F5C3E;margin:0} .sub{color:#666;margin:4px 0 20px}
    .tot{display:flex;gap:16px;margin-bottom:20px} .tot div{background:#FFF6E6;border-radius:12px;padding:12px 16px} .tot b{font-size:22px;display:block}
    table{width:100%;border-collapse:collapse;font-size:13px} th,td{padding:8px 6px;border-bottom:1px solid #eee;text-align:left} .r{text-align:right}
  </style></head><body>
    <h1>rupli●</h1><div class="sub">Monthly report · ${esc(monthLabel(spend.month))}</div>
    <div class="tot"><div>Groceries<b>${formatINR(spend.totalPaise)}</b></div><div>All spends<b>${formatINR(spend.allPaise)}</b></div>
    ${spend.budgetPaise ? `<div>Grocery budget<b>${formatINR(spend.budgetPaise)}</b></div>` : ''}</div>
    <table><tr><th>Date</th><th>Paid to</th><th>Category</th><th class="r">Amount</th></tr>${rows}</table>
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `Rupli report · ${monthLabel(spend.month)}` });
}
