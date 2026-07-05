const BADGE_GREEN = "#16a34a";
const BADGE_RED   = "#dc2626";
const BADGE_GRAY  = "#6b7280";

async function roundForBadge(num) {
  var storage = await chrome.storage.local.get();
  var unit = storage['unit'];
  if (!unit) {
    unit = 1;
  }

  var precision = storage['precision'];
  if (!precision) {
    precision = 0;
  }

  num *= unit;

  if (num>9999) {
    return (num/1000).toFixed(precision) + 'k';
  } else {
    return (num).toFixed(precision);
  }
}

// Rich market data from CoinGecko: current price, 24h change/high/low, and a
// 24h sparkline. This is the source of everything the popup and the coloured
// badge need; individual exchange tickers don't provide it.
async function fetchMarket(currency) {
  var url = "https://api.coingecko.com/api/v3/coins/markets"
    + "?vs_currency=" + currency
    + "&ids=bitcoin&sparkline=true&price_change_percentage=24h";
  var res = await fetch(url);
  var arr = await res.json();
  var m = arr && arr[0];
  if (!m) {
    return null;
  }
  var series = (m.sparkline_in_7d && m.sparkline_in_7d.price) || [];
  return {
    price: m.current_price,
    change24h: m.price_change_percentage_24h,
    high24h: m.high_24h,
    low24h: m.low_24h,
    // sparkline_in_7d is hourly for 7 days; keep the last 24h.
    sparkline: series.slice(-24),
  };
}

// Spot price from the user's chosen exchange. Returns a number or null.
async function fetchExchangePrice(exchange, currency) {
  try {
    if (exchange == "bitstamp") {
      if (currency != "usd") return null;
      var d = await (await fetch("https://www.bitstamp.net/api/ticker/")).json();
      return d['last'] ? parseFloat(d['last']) : null;
    }
    if (exchange == "coinbase") {
      if (currency == "cad") {
        // The Coinbase Exchange API has no BTC-CAD product; use the consumer
        // spot endpoint for CAD.
        var dc = await (await fetch("https://api.coinbase.com/v2/prices/BTC-CAD/spot")).json();
        return (dc['data'] && dc['data']['amount']) ? parseFloat(dc['data']['amount']) : null;
      }
      var product = currency == "eur" ? "BTC-EUR" : "BTC-USD";
      var de = await (await fetch("https://api.exchange.coinbase.com/products/" + product + "/ticker")).json();
      return de['price'] ? parseFloat(de['price']) : null;
    }
    if (exchange == "kraken") {
      var pair = {usd: "XXBTZUSD", eur: "XXBTZEUR", cad: "XXBTZCAD"}[currency];
      if (!pair) return null;
      var dk = await (await fetch("https://api.kraken.com/0/public/Ticker?pair=" + pair)).json();
      var c = dk['result'] && dk['result'][pair] && dk['result'][pair]['c'];
      return c ? parseFloat(c[0]) : null;
    }
  } catch (error) {
    console.log("exchange price fetch failed", error);
  }
  return null;
}

function badgeColorFor(storage, market) {
  var mode = storage['badgeColorMode'] || "direction";
  if (mode == "custom") {
    return storage['badgeColor'] || "#f7931a";
  }
  if (mode == "direction") {
    var change = market ? market.change24h : null;
    if (change == null) return BADGE_GRAY;
    return change >= 0 ? BADGE_GREEN : BADGE_RED;
  }
  return BADGE_GRAY; // "none"
}

async function updatebadge() {
  var storage = await chrome.storage.local.get();
  var exchange = storage['exchange'] || "coingecko";
  var currency = storage['currency'] || "usd";

  // Always pull rich data from CoinGecko (change/high/low/sparkline).
  var market = null;
  try {
    market = await fetchMarket(currency);
  } catch (error) {
    console.log("market fetch failed", error);
  }

  // Badge price comes from the chosen source; fall back to CoinGecko's price.
  var price = null;
  if (exchange == "coingecko") {
    price = market ? market.price : null;
  } else {
    price = await fetchExchangePrice(exchange, currency);
    if (price == null && market) {
      price = market.price;
    }
  }

  var badge = "n/a";
  if (price != null) {
    await chrome.storage.local.set({["btc_" + currency]: price});
    badge = await roundForBadge(price);
  }

  // Persist a snapshot for the popup.
  await chrome.storage.local.set({ market: {
    currency: currency,
    source: exchange,
    price: price,
    change24h: market ? market.change24h : null,
    high24h: market ? market.high24h : null,
    low24h: market ? market.low24h : null,
    sparkline: market ? market.sparkline : [],
    updatedAt: Date.now(),
  }});

  chrome.action.setBadgeText({text:'' + badge});
  chrome.action.setBadgeBackgroundColor({color: badgeColorFor(storage, market)});
  if (chrome.action.setBadgeTextColor) {
    chrome.action.setBadgeTextColor({color: "#ffffff"});
  }

  // Set tooltip if enabled.
  var showTooltip = storage['showTooltip'];
  if (showTooltip && price != null) {
    var locales = { usd: 'en-US', eur: 'en-IE', cad: 'en-CA', gbp: 'en-GB', jpy: 'ja-JP', aud: 'en-AU' };
    var formattedPrice = parseFloat(price).toLocaleString(locales[currency] || 'en-US', { maximumFractionDigits: 0 }) + " " + currency.toUpperCase();
    if (market && market.change24h != null) {
      formattedPrice += " (" + (market.change24h >= 0 ? "+" : "") + market.change24h.toFixed(2) + "%)";
    }
    chrome.action.setTitle({ title: formattedPrice });
  } else {
    chrome.action.setTitle({ title: "BTC Ticker" });
  }
}

// Ensure the periodic refresh alarm exists. Under Manifest V3 the service
// worker is evicted when idle, so a setInterval loop stops running; an alarm
// survives eviction and wakes the worker. 1 minute is the MV3 minimum period.
function ensureAlarm() {
  chrome.alarms.create("refresh", { periodInMinutes: 1 });
}

async function update() {
  chrome.action.setBadgeText({text:'...'});
  ensureAlarm();
  updatebadge();
}

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name == "refresh") {
    updatebadge();
  }
});

chrome.runtime.onInstalled.addListener(function() {
  update();
});

chrome.runtime.onStartup.addListener(function() {
  update();
});

chrome.idle.onStateChanged.addListener(function(state) {
  if (state == 'active') {
    update();
  }
});

// The options page and popup trigger an immediate refresh.
chrome.runtime.onMessage.addListener(function(message) {
  if (message && message.type == "refresh") {
    ensureAlarm();
    updatebadge();
  }
});
