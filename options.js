// Which currencies each price source can serve.
const SOURCE_SUPPORT = {
  coingecko: ["usd", "eur", "cad", "gbp", "jpy", "aud"],
  bitstamp:  ["usd"],
  coinbase:  ["usd", "eur", "cad"],
  kraken:    ["usd", "eur", "cad"],
};

const CURRENCY_LABEL = { usd: "USD", eur: "EUR", cad: "CAD", gbp: "GBP", jpy: "JPY", aud: "AUD" };

function selectValue(id) {
  var el = document.getElementById(id);
  return el.children[el.selectedIndex].value;
}

function setSelect(id, value) {
  var el = document.getElementById(id);
  for (var i = 0; i < el.children.length; i++) {
    if (el.children[i].value == value) {
      el.children[i].selected = true;
      return true;
    }
  }
  return false;
}

function applyTheme(theme) {
  if (theme == "light" || theme == "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

// Disable currencies the chosen source can't serve; if the current selection
// is now unsupported, fall back to the source's first supported currency.
function syncCurrencyOptions() {
  var source = selectValue("exchange");
  var supported = SOURCE_SUPPORT[source] || ["usd"];
  var currencySel = document.getElementById("currency");
  var currentOk = false;
  for (var i = 0; i < currencySel.children.length; i++) {
    var opt = currencySel.children[i];
    var ok = supported.indexOf(opt.value) !== -1;
    opt.disabled = !ok;
    if (ok && opt.value == currencySel.value) {
      currentOk = true;
    }
  }
  if (!currentOk) {
    setSelect("currency", supported[0]);
  }
}

function syncColorRow() {
  var mode = selectValue("badgeColorMode");
  document.getElementById("badgeColorRow").classList.toggle("hidden", mode != "custom");
}

async function save_options() {
  var exchange = selectValue("exchange");
  var currency = selectValue("currency");
  var precision = selectValue("precision");
  var unit = selectValue("unit");
  var tooltip = document.getElementById("showTooltip").checked;
  var badgeColorMode = selectValue("badgeColorMode");
  var badgeColor = document.getElementById("badgeColor").value;
  var theme = selectValue("theme");

  var supported = SOURCE_SUPPORT[exchange] || ["usd"];
  var optionsOK = supported.indexOf(currency) !== -1;

  var status = document.getElementById("status");
  if (optionsOK) {
    try {
      await chrome.storage.local.set({
        exchange, currency, precision, unit,
        showTooltip: tooltip, badgeColorMode, badgeColor, theme
      });
    } catch (error) {
      console.log(error);
    }
    status.innerHTML = "Options saved.";
    // Ask the service worker to refresh the badge with the new settings.
    chrome.runtime.sendMessage({ type: "refresh" });
  } else {
    status.innerHTML = CURRENCY_LABEL[currency] + " isn't available on this source.";
  }
  setTimeout(function() {
    status.innerHTML = "";
  }, 1500);
}

async function restore_options() {
  var storage = await chrome.storage.local.get();

  setSelect("exchange", storage['exchange'] || "coingecko");
  setSelect("currency", storage['currency'] || "usd");
  setSelect("precision", storage['precision'] || 2);
  setSelect("unit", storage['unit'] || 1);
  document.getElementById("showTooltip").checked = storage['showTooltip'] === true;
  setSelect("badgeColorMode", storage['badgeColorMode'] || "direction");
  if (storage['badgeColor']) {
    document.getElementById("badgeColor").value = storage['badgeColor'];
  }
  setSelect("theme", storage['theme'] || "auto");

  syncCurrencyOptions();
  applyTheme(storage['theme'] || "auto");
  syncColorRow();
}

document.addEventListener('DOMContentLoaded', function() {
  restore_options();
  document.getElementById("save").addEventListener("click", save_options);
  document.getElementById("exchange").addEventListener("change", syncCurrencyOptions);
  document.getElementById("badgeColorMode").addEventListener("change", syncColorRow);
  document.getElementById("theme").addEventListener("change", function() {
    applyTheme(selectValue("theme"));
  });
});
