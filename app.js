import {
  PRESETS,
  addDaysISO,
  computeBurnSummary,
  convertCurrency,
  daysBetweenISO,
  exportCSV,
  formatMoney,
  importCSV,
  nextRenewalISO
} from "./ledger_engine.mjs";

const STORAGE_KEY = "billeaf.web.ledger.v1";

function defaultSamples() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { id: "s1", name: "ChatGPT Plus", category: "software", amount: 20.00, currency: "USD", cycle: "monthly", nextRenewalDate: addDaysISO(today, 2), isActive: true, cancelURL: "https://help.openai.com/en/articles/7232927-how-do-i-cancel-my-chatgpt-plus-subscription", notes: "" },
    { id: "s2", name: "Netflix", category: "streaming", amount: 15.49, currency: "USD", cycle: "monthly", nextRenewalDate: addDaysISO(today, 4), isActive: true, cancelURL: "https://help.netflix.com/en/node/407", notes: "" },
    { id: "s3", name: "Spotify Premium", category: "music", amount: 11.99, currency: "EUR", cycle: "monthly", nextRenewalDate: addDaysISO(today, 9), isActive: true, cancelURL: "https://support.spotify.com/article/cancel-premium/", notes: "" },
    { id: "s4", name: "The Economist", category: "news", amount: 249.00, currency: "USD", cycle: "yearly", nextRenewalDate: addDaysISO(today, 14), isActive: true, cancelURL: "https://myaccount.economist.com/s/article/How-do-I-cancel-my-subscription", notes: "" },
    { id: "s5", name: "1Password", category: "utilities", amount: 35.88, currency: "USD", cycle: "yearly", nextRenewalDate: addDaysISO(today, 25), isActive: true, cancelURL: "https://support.1password.com/manage-subscription/", notes: "" }
  ];
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return defaultSamples();
}

let items = loadState();
let displayCurrency = "USD";
let viewMode = "ledger";

const el = (id) => document.getElementById(id);

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function render() {
  const today = new Date().toISOString().slice(0, 10);
  const summary = computeBurnSummary(items, displayCurrency, today);

  el("monthlyTotal").textContent = formatMoney(summary.monthlyTotal, displayCurrency);
  el("annualTotal").textContent = formatMoney(summary.annualTotal, displayCurrency);
  el("activeMeta").textContent = `${summary.activeCount} active${summary.pausedCount ? ` · ${summary.pausedCount} paused` : ""}`;
  el("dueCount").textContent = String(summary.upcoming30d.length);

  el("catBars").innerHTML = summary.categories
    .slice(0, 4)
    .map(
      (c) => `
      <div class="cat-row">
        <span>${escapeHTML(c.label)}</span>
        <div class="cat-track"><div class="cat-fill" style="width:${Math.max(4, Math.round(c.share * 100))}%"></div></div>
        <span style="text-align:right;font-variant-numeric:tabular-nums;">${escapeHTML(formatMoney(c.monthlyAmount, displayCurrency))}</span>
      </div>`
    )
    .join("");

  const list = viewMode === "calendar" ? summary.upcoming30d : items;
  const tbody = el("ledgerRows");
  tbody.innerHTML = "";

  for (const item of list) {
    const days = daysBetweenISO(today, item.nextRenewalDate);
    const dueBadge =
      item.isActive === false
        ? `<span style="color:var(--muted);">Paused</span>`
        : days <= 3 && days >= 0
          ? `<span class="due-urgent">${days === 0 ? "Today" : `${days}d left`} · ${escapeHTML(item.nextRenewalDate)}</span>`
          : `<span class="due-ok">${days >= 0 ? `${days}d · ` : ""}${escapeHTML(item.nextRenewalDate)}</span>`;

    const monthlyEq =
      convertCurrency(item.amount, item.currency, displayCurrency) *
      (item.cycle === "yearly" ? 1 / 12 : item.cycle === "quarterly" ? 1 / 3 : item.cycle === "weekly" ? 52 / 12 : 1);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong>${escapeHTML(item.name)}</strong>
        ${item.cancelURL ? `<div style="font-size:0.75rem;"><a href="${escapeHTML(item.cancelURL)}" target="_blank" rel="noopener" style="color:var(--accent);">Cancel guide</a></div>` : ""}
      </td>
      <td>${escapeHTML(formatMoney(item.amount, item.currency))} / ${escapeHTML(item.cycle)}</td>
      <td>${escapeHTML(formatMoney(monthlyEq, displayCurrency))}/mo</td>
      <td>${dueBadge}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn" data-roll="${escapeHTML(item.id)}" type="button" style="padding:4px 8px;font-size:0.76rem;">Roll</button>
          <button class="btn" data-del="${escapeHTML(item.id)}" type="button" style="padding:4px 8px;font-size:0.76rem;">Remove</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  }
}

function escapeHTML(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

function init() {
  const today = new Date().toISOString().slice(0, 10);
  el("subDate").value = addDaysISO(today, 14);

  const chipHost = el("presetChips");
  PRESETS.slice(0, 8).forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "preset-chip";
    btn.type = "button";
    btn.textContent = p.name;
    btn.addEventListener("click", () => {
      el("subName").value = p.name;
      el("subAmount").value = String(p.amount);
      el("subCurrency").value = p.currency;
      el("subCycle").value = p.cycle;
      el("subCategory").value = p.category;
      el("subCancelUrl").value = p.cancelURL;
      el("actionStatus").textContent = `Loaded preset: ${p.name}`;
    });
    chipHost.appendChild(btn);
  });

  el("addForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = el("subName").value.trim();
    const amount = Number(el("subAmount").value);
    if (!name || Number.isNaN(amount)) return;
    items.unshift({
      id: `item-${Date.now()}`,
      name,
      category: el("subCategory").value,
      amount,
      currency: el("subCurrency").value,
      cycle: el("subCycle").value,
      nextRenewalDate: el("subDate").value || addDaysISO(today, 14),
      cancelURL: el("subCancelUrl").value.trim(),
      isActive: true,
      notes: ""
    });
    saveState();
    render();
    el("addForm").reset();
    el("subDate").value = addDaysISO(today, 14);
    el("actionStatus").textContent = `Added ${name}`;
  });

  el("ledgerRows").addEventListener("click", (ev) => {
    const rollId = ev.target?.dataset?.roll;
    const delId = ev.target?.dataset?.del;
    if (rollId) {
      const idx = items.findIndex((i) => i.id === rollId);
      if (idx >= 0) {
        items[idx].nextRenewalDate = nextRenewalISO(items[idx].nextRenewalDate, items[idx].cycle, items[idx].nextRenewalDate);
        saveState();
        render();
        el("actionStatus").textContent = `Rolled ${items[idx].name} to ${items[idx].nextRenewalDate}`;
      }
    } else if (delId) {
      items = items.filter((i) => i.id !== delId);
      saveState();
      render();
      el("actionStatus").textContent = "Subscription removed";
    }
  });

  el("displayCurrency").addEventListener("change", (ev) => {
    displayCurrency = ev.target.value;
    render();
  });

  el("tabLedgerBtn").addEventListener("click", () => {
    viewMode = "ledger";
    el("tabLedgerBtn").classList.add("active");
    el("tabCalendarBtn").classList.remove("active");
    render();
  });
  el("tabCalendarBtn").addEventListener("click", () => {
    viewMode = "calendar";
    el("tabCalendarBtn").classList.add("active");
    el("tabLedgerBtn").classList.remove("active");
    render();
  });

  el("resetDemoBtn").addEventListener("click", () => {
    items = defaultSamples();
    saveState();
    render();
    el("actionStatus").textContent = "Sample subscriptions restored";
  });

  el("exportCsvBtn").addEventListener("click", () => {
    downloadBlob("Billeaf-Subscriptions.csv", exportCSV(items), "text/csv;charset=utf-8");
    el("actionStatus").textContent = "Downloaded CSV";
  });

  el("exportJsonBtn").addEventListener("click", () => {
    downloadBlob("Billeaf-Subscriptions.json", JSON.stringify(items, null, 2), "application/json");
    el("actionStatus").textContent = "Downloaded JSON";
  });

  el("csvImportInput").addEventListener("change", async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const imported = importCSV(await file.text());
      items = [...imported, ...items];
      saveState();
      render();
      el("actionStatus").textContent = `Imported ${imported.length} subscriptions`;
    } catch (err) {
      el("actionStatus").textContent = `Import error: ${err.message}`;
    }
  });

  const modal = el("proModal");
  el("openProBtn").addEventListener("click", () => modal.classList.add("open"));
  el("closeProBtn").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) modal.classList.remove("open");
  });

  render();
}

init();
