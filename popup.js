const CURRENCY_LOCALE = { usd: 'en-US', eur: 'en-IE', cad: 'en-CA', gbp: 'en-GB', jpy: 'ja-JP', aud: 'en-AU' };

function fmtCurrency(value, currency) {
  if (value == null) return "—";
  var code = (currency || "usd").toUpperCase();
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] || 'en-US', {
      style: 'currency', currency: code, maximumFractionDigits: 0
    }).format(value);
  } catch (e) {
    return Number(value).toLocaleString() + " " + code;
  }
}

function applyTheme(theme) {
  if (theme == "light" || theme == "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function tracePath(ctx, pts, w, h, pad) {
  var min = Math.min.apply(null, pts);
  var max = Math.max.apply(null, pts);
  var range = (max - min) || 1;
  ctx.beginPath();
  for (var i = 0; i < pts.length; i++) {
    var x = pad + (i / (pts.length - 1)) * (w - 2 * pad);
    var y = pad + (1 - (pts[i] - min) / range) * (h - 2 * pad);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function drawSparkline(canvas, pts, up) {
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var w = canvas.clientWidth || 268;
  var h = canvas.clientHeight || 56;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!pts || pts.length < 2) return;

  var pad = 3;
  var stroke = up ? '#16a34a' : '#dc2626';
  var fill = up ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)';

  // Filled area under the line.
  tracePath(ctx, pts, w, h, pad);
  ctx.lineTo(w - pad, h);
  ctx.lineTo(pad, h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // Line on top.
  tracePath(ctx, pts, w, h, pad);
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function render(market) {
  var priceEl = document.getElementById("price");
  var changeEl = document.getElementById("change");
  var sourceEl = document.getElementById("source");
  var highEl = document.getElementById("high");
  var lowEl = document.getElementById("low");
  var updatedEl = document.getElementById("updated");
  var canvas = document.getElementById("spark");

  if (!market) {
    priceEl.textContent = "Loading…";
    return;
  }

  var cur = market.currency || "usd";
  priceEl.textContent = fmtCurrency(market.price, cur);
  highEl.textContent = fmtCurrency(market.high24h, cur);
  lowEl.textContent = fmtCurrency(market.low24h, cur);
  sourceEl.textContent = market.source ? "via " + market.source : "";

  var change = market.change24h;
  if (change == null) {
    changeEl.className = "chip flat";
    changeEl.textContent = "—";
  } else {
    var up = change >= 0;
    changeEl.className = "chip " + (up ? "up" : "down");
    changeEl.textContent = (up ? "▲ " : "▼ ") + Math.abs(change).toFixed(2) + "%";
  }

  drawSparkline(canvas, market.sparkline, change == null ? true : change >= 0);

  if (market.updatedAt) {
    var t = new Date(market.updatedAt);
    updatedEl.textContent = "Updated " + t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

async function load() {
  var store = await chrome.storage.local.get(['market', 'theme']);
  applyTheme(store['theme'] || "auto");
  render(store['market']);
  // Trigger a fresh fetch; storage.onChanged will re-render when it lands.
  chrome.runtime.sendMessage({ type: "refresh" });
}

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area != "local") return;
  if (changes.theme) applyTheme(changes.theme.newValue || "auto");
  if (changes.market) render(changes.market.newValue);
});

document.getElementById("settingsBtn").addEventListener("click", function() {
  chrome.runtime.openOptionsPage();
});

document.addEventListener('DOMContentLoaded', load);
