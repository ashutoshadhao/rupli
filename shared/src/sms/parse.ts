import { parseRupeesToPaise } from '../money';

export interface ParsedSms {
  amountPaise: number; direction: 'debit' | 'credit'; merchant: string | null;
  ref: string | null; last4: string | null; bank: string | null;
}

const BANKS: Record<string, string> = {
  HDFCBK: 'HDFC Bank', SBIUPI: 'SBI', SBIINB: 'SBI', ATMSBI: 'SBI', CBSSBI: 'SBI', ICICIB: 'ICICI Bank', ICICIT: 'ICICI Bank',
  AXISBK: 'Axis Bank', KOTAKB: 'Kotak Bank', PAYTMB: 'Paytm Payments Bank', YESBNK: 'Yes Bank', IDFCFB: 'IDFC First Bank',
  BOBTXN: 'Bank of Baroda', PNBSMS: 'PNB', CANBNK: 'Canara Bank', UNIONB: 'Union Bank', INDUSB: 'IndusInd Bank',
  FEDBNK: 'Federal Bank', AUBANK: 'AU Bank',
};

// DLT sender ids look like "AX-HDFCBK" or "AD-AXISBK-S"
export function bankFromSender(sender: string): string | null {
  const parts = sender.toUpperCase().split('-');
  return BANKS[(parts.length > 1 ? parts[1] : parts[0])!] ?? null;
}

const REJECT = /\b(otp|one[- ]time password|verification code|failed|declined|unsuccessful|reversed)\b/i;
const DIRECTION = /\b(debited|spent|sent|paid|withdrawn|credited|received|deposited)\b/i;
const AMOUNTS = [/(?:\b(?:rs|inr)\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i, /\b(?:debited|credited)\s+(?:by|for|with)\s+([\d,]+(?:\.\d{1,2})?)/i];
const REFS = [/upi\/p2[am]\/(\d{9,12})/i, /\b(?:ref(?:erence)?\.?\s*(?:no\.?|number)?|refno|rrn|upi)\s*[:.]?\s*(\d{9,12})\b/i];
const LAST4 = /\b(?:a\/c|acct|ac|account|card)(?:\s*no\.?)?\s*[x*]+\s*(\d{3,6})/i;
const END = String.raw`(?=\s+(?:on|from|ref|via|using)\b|\n|\.\s|\.?$)`;
const DEBIT_SPECIFIC = [/upi\/p2[am]\/\d+\/([^/\n]+)/i, /;\s*([^;.\n]+?)\s+credited/i, /\btrf to\s+(.+?)\s+ref/i];
const DEBIT_GENERIC = [new RegExp(String.raw`\bto\s+(.+?)` + END, 'i'), new RegExp(String.raw`\bat\s+(.+?)` + END, 'i')];
const CREDIT = [/\bvpa\s+([\w.\-]+@[\w.]+)/i, new RegExp(String.raw`\bfrom\s+(.+?)` + END, 'i')];

const firstMatch = (res: RegExp[], s: string) => {
  for (const r of res) { const m = r.exec(s); if (m) return m[1]!; }
  return null;
};
const clean = (m: string | null) => m?.trim().replace(/\s+(private limited|pvt\.? ltd\.?|limited|ltd\.?)$/i, '').trim() || null;

function merchant(body: string, direction: 'debit' | 'credit') {
  if (direction === 'credit') return clean(firstMatch(CREDIT, body));
  const specific = firstMatch(DEBIT_SPECIFIC, body);
  if (specific) return clean(specific);
  // earliest "to …"/"at …" wins, so trailing "To Block" / "BLOCK UPI to 7308…" lose
  const hits = DEBIT_GENERIC.map(r => r.exec(body)).filter((m): m is RegExpExecArray => !!m).sort((a, b) => a.index - b.index);
  return clean(hits[0]?.[1] ?? null);
}

export function parseSms(sender: string, body: string): ParsedSms | null {
  if (REJECT.test(body)) return null;
  const dir = DIRECTION.exec(body)?.[1]?.toLowerCase();
  if (!dir) return null;
  const direction = ['credited', 'received', 'deposited'].includes(dir) ? 'credit' : 'debit';
  const raw = firstMatch(AMOUNTS, body);
  const amountPaise = raw ? parseRupeesToPaise(raw) : null;
  if (!amountPaise) return null;
  const ref = firstMatch(REFS, body);
  const last4 = LAST4.exec(body)?.[1]?.slice(-4) ?? null;
  // promos have neither an account nor a reference
  if (!ref && !last4) return null;
  return { amountPaise, direction, merchant: merchant(body, direction), ref, last4, bank: bankFromSender(sender) };
}
