// Pure ES module subscription ledger math, multi-currency normalization, rollover & RFC 4180 CSV/JSON codec

export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", decimals: 2, rateToUSD: 1.0 },
  EUR: { code: "EUR", symbol: "€", decimals: 2, rateToUSD: 1.08 },
  GBP: { code: "GBP", symbol: "£", decimals: 2, rateToUSD: 1.27 },
  JPY: { code: "JPY", symbol: "¥", decimals: 0, rateToUSD: 0.0066 },
  CAD: { code: "CAD", symbol: "CA$", decimals: 2, rateToUSD: 0.72 },
  AUD: { code: "AUD", symbol: "A$", decimals: 2, rateToUSD: 0.65 },
  CNY: { code: "CNY", symbol: "CN¥", decimals: 2, rateToUSD: 0.138 }
};

export const CYCLES = {
  weekly: { id: "weekly", label: "Weekly", shortLabel: "/wk", monthlyFactor: 52 / 12, annualFactor: 52 },
  monthly: { id: "monthly", label: "Monthly", shortLabel: "/mo", monthlyFactor: 1, annualFactor: 12 },
  quarterly: { id: "quarterly", label: "Quarterly", shortLabel: "/qtr", monthlyFactor: 1 / 3, annualFactor: 4 },
  yearly: { id: "yearly", label: "Yearly", shortLabel: "/yr", monthlyFactor: 1 / 12, annualFactor: 1 }
};

export const CATEGORIES = {
  streaming: "Streaming",
  software: "Software & AI",
  cloud: "Cloud & Dev",
  music: "Music & Audio",
  news: "News & Reading",
  fitness: "Health & Fitness",
  utilities: "Prime & Security",
  other: "Other"
};

export const PRESETS = [
  { id: "netflix", name: "Netflix", category: "streaming", amount: 15.49, currency: "USD", cycle: "monthly", cancelURL: "https://help.netflix.com/en/node/407" },
  { id: "spotify", name: "Spotify Premium", category: "music", amount: 11.99, currency: "USD", cycle: "monthly", cancelURL: "https://support.spotify.com/article/cancel-premium/" },
  { id: "icloud", name: "Apple iCloud+ 200GB", category: "cloud", amount: 2.99, currency: "USD", cycle: "monthly", cancelURL: "https://support.apple.com/en-us/118428" },
  { id: "youtube", name: "YouTube Premium", category: "streaming", amount: 13.99, currency: "USD", cycle: "monthly", cancelURL: "https://support.google.com/youtube/answer/6308278" },
  { id: "chatgpt", name: "ChatGPT Plus", category: "software", amount: 20.00, currency: "USD", cycle: "monthly", cancelURL: "https://help.openai.com/en/articles/7232927-how-do-i-cancel-my-chatgpt-plus-subscription" },
  { id: "claude", name: "Claude Pro", category: "software", amount: 20.00, currency: "USD", cycle: "monthly", cancelURL: "https://support.anthropic.com/en/articles/8325614" },
  { id: "adobe", name: "Adobe Creative Cloud", category: "software", amount: 59.99, currency: "USD", cycle: "monthly", cancelURL: "https://helpx.adobe.com/manage-account/using/cancel-subscription.html" },
  { id: "ms365", name: "Microsoft 365", category: "software", amount: 99.99, currency: "USD", cycle: "yearly", cancelURL: "https://support.microsoft.com/en-us/account-billing/cancel-your-microsoft-subscription" },
  { id: "prime", name: "Amazon Prime", category: "utilities", amount: 139.00, currency: "USD", cycle: "yearly", cancelURL: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GTJQ7QZY7QL2HK4Y" },
  { id: "disney", name: "Disney+", category: "streaming", amount: 15.99, currency: "USD", cycle: "monthly", cancelURL: "https://help.disneyplus.com/article/disneyplus-cancel" },
  { id: "nytimes", name: "The New York Times", category: "news", amount: 17.00, currency: "USD", cycle: "monthly", cancelURL: "https://help.nytimes.com/hc/en-us/articles/360003499613" },
  { id: "economist", name: "The Economist", category: "news", amount: 249.00, currency: "USD", cycle: "yearly", cancelURL: "https://myaccount.economist.com/s/article/How-do-I-cancel-my-subscription" },
  { id: "notion", name: "Notion Plus", category: "software", amount: 12.00, currency: "USD", cycle: "monthly", cancelURL: "https://www.notion.so/help/billing-and-payment" },
  { id: "figma", name: "Figma Professional", category: "software", amount: 15.00, currency: "USD", cycle: "monthly", cancelURL: "https://help.figma.com/hc/en-us/articles/360040328273" },
  { id: "github", name: "GitHub Pro", category: "cloud", amount: 4.00, currency: "USD", cycle: "monthly", cancelURL: "https://docs.github.com/en/billing/managing-your-github-billing-settings/downgrading-your-github-subscription" },
  { id: "1password", name: "1Password", category: "utilities", amount: 35.88, currency: "USD", cycle: "yearly", cancelURL: "https://support.1password.com/manage-subscription/" },
  { id: "dropbox", name: "Dropbox Plus", category: "cloud", amount: 11.99, currency: "USD", cycle: "monthly", cancelURL: "https://help.dropbox.com/plans/downgrade-dropbox-plus-professional" },
  { id: "nordvpn", name: "NordVPN", category: "utilities", amount: 99.00, currency: "USD", cycle: "yearly", cancelURL: "https://support.nordvpn.com/hc/en-us/articles/19476207764753" },
  { id: "strava", name: "Strava", category: "fitness", amount: 79.99, currency: "USD", cycle: "yearly", cancelURL: "https://support.strava.com/hc/en-us/articles/216918687" },
  { id: "audible", name: "Audible Premium Plus", category: "music", amount: 14.95, currency: "USD", cycle: "monthly", cancelURL: "https://help.audible.com/s/article/cancel-membership" }
];

export function convertCurrency(amount, fromCode, toCode) {
  const from = CURRENCIES[fromCode] || CURRENCIES.USD;
  const to = CURRENCIES[toCode] || CURRENCIES.USD;
  if (from.code === to.code) return Number(amount);
  return (Number(amount) * from.rateToUSD) / to.rateToUSD;
}

export function formatMoney(amount, currencyCode = "USD") {
  const cur = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const neg = amount < 0;
  const abs = Math.abs(Number(amount) || 0);
  const str = abs.toLocaleString("en-US", {
    minimumFractionDigits: cur.decimals,
    maximumFractionDigits: cur.decimals
  });
  return `${neg ? "-" : ""}${cur.symbol}${str}`;
}

export function addDaysISO(baseISO, days) {
  const [y, m, d] = baseISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function nextRenewalISO(anchorISO, cycle = "monthly", afterISO = anchorISO) {
  const [ay, am, ad] = anchorISO.split("-").map(Number);
  const stepMonths = cycle === "monthly" ? 1 : cycle === "quarterly" ? 3 : cycle === "yearly" ? 12 : 0;

  let cur = anchorISO;
  let k = 0;
  while (cur <= afterISO && k < 600) {
    k += 1;
    if (cycle === "weekly") {
      cur = addDaysISO(cur, 7);
    } else {
      const totalMonths = ay * 12 + (am - 1) + k * stepMonths;
      const ny = Math.floor(totalMonths / 12);
      const nm = (totalMonths % 12) + 1;
      const maxDay = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
      const nd = Math.min(ad, maxDay);
      cur = `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
    }
  }
  return cur;
}

export function daysBetweenISO(fromISO, toISO) {
  const a = Date.parse(`${fromISO}T00:00:00Z`);
  const b = Date.parse(`${toISO}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function computeBurnSummary(items, displayCurrency = "USD", todayISO = new Date().toISOString().slice(0, 10)) {
  const active = items.filter((i) => i.isActive !== false);
  let monthlyTotal = 0;
  let annualTotal = 0;
  const byCat = {};

  for (const item of active) {
    const cyc = CYCLES[item.cycle] || CYCLES.monthly;
    const conv = convertCurrency(item.amount, item.currency || "USD", displayCurrency);
    const m = conv * cyc.monthlyFactor;
    monthlyTotal += m;
    annualTotal += conv * cyc.annualFactor;
    const cat = CATEGORIES[item.category] ? item.category : "other";
    byCat[cat] = (byCat[cat] || 0) + m;
  }

  const categories = Object.entries(byCat)
    .map(([category, monthlyAmount]) => ({
      category,
      label: CATEGORIES[category] || "Other",
      monthlyAmount,
      share: monthlyTotal > 0 ? monthlyAmount / monthlyTotal : 0
    }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  const upcoming30d = active
    .map((item) => ({ ...item, daysUntil: daysBetweenISO(todayISO, item.nextRenewalDate || todayISO) }))
    .filter((x) => x.daysUntil >= 0 && x.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name));

  return {
    displayCurrency,
    activeCount: active.length,
    pausedCount: items.length - active.length,
    monthlyTotal,
    annualTotal,
    categories,
    upcoming30d
  };
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCSV(items) {
  const header = "name,category,amount,currency,cycle,next_renewal,remind_days_before,is_active,cancel_url,notes";
  const rows = items.map((item) =>
    [
      csvEscape(item.name),
      csvEscape(item.category || "other"),
      csvEscape(Number(item.amount).toFixed(2)),
      csvEscape(item.currency || "USD"),
      csvEscape(item.cycle || "monthly"),
      csvEscape(item.nextRenewalDate || ""),
      csvEscape(item.remindDaysBefore ?? 3),
      csvEscape(item.isActive === false ? "false" : "true"),
      csvEscape(item.cancelURL || ""),
      csvEscape(item.notes || "")
    ].join(",")
  );
  return `${[header, ...rows].join("\n")}\n`;
}

export function parseCSVRows(text) {
  const norm = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < norm.length; i += 1) {
    const ch = norm[i];
    if (inQuotes) {
      if (ch === '"') {
        if (norm[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function importCSV(text) {
  const rows = parseCSVRows(text);
  if (!rows.length) throw new Error("Empty CSV input");
  const header = rows[0].map((c) => c.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const amountIdx = header.indexOf("amount");
  if (nameIdx < 0 || amountIdx < 0) throw new Error("CSV must have name and amount columns");

  const idx = (col) => header.indexOf(col);
  const out = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r];
    if (row.every((c) => !c.trim())) continue;
    const name = (row[nameIdx] || "").trim();
    const amount = Number(String(row[amountIdx] || "").replace(/,/g, "").trim());
    if (!name || Number.isNaN(amount) || amount < 0) {
      throw new Error(`Invalid row ${r + 1}`);
    }
    const get = (col) => {
      const i = idx(col);
      return i >= 0 && i < row.length ? row[i].trim() : "";
    };
    const cat = get("category").toLowerCase();
    const cur = get("currency").toUpperCase();
    const cyc = get("cycle").toLowerCase();
    const activeRaw = get("is_active").toLowerCase();
    out.push({
      id: `${Date.now()}-${r}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      category: CATEGORIES[cat] ? cat : "other",
      amount,
      currency: CURRENCIES[cur] ? cur : "USD",
      cycle: CYCLES[cyc] ? cyc : "monthly",
      nextRenewalDate: /^\d{4}-\d{2}-\d{2}$/.test(get("next_renewal")) ? get("next_renewal") : new Date().toISOString().slice(0, 10),
      remindDaysBefore: Number(get("remind_days_before")) || 3,
      isActive: activeRaw ? activeRaw !== "false" && activeRaw !== "0" : true,
      cancelURL: get("cancel_url") || "",
      notes: get("notes") || ""
    });
  }
  if (!out.length) throw new Error("No valid rows found in CSV");
  return out;
}
