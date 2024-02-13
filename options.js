// Saves options to localStorage.
async function save_options() {
  var selectedExchange = document.getElementById("exchange");
  var selectedCurrency = document.getElementById("currency");
  var selectedPrecision= document.getElementById("precision");
  var selectedUnit     = document.getElementById("unit");
  var exchange = selectedExchange.children[selectedExchange.selectedIndex].value;
  var currency = selectedCurrency.children[selectedCurrency.selectedIndex].value;
  var precision= selectedPrecision.children[selectedPrecision.selectedIndex].value;
  var unit     = selectedUnit.children[selectedUnit.selectedIndex].value;

  var optionsOK = true;

  if (exchange == "coinbase" && currency == "eur") {
    optionsOK = false;
  }

  if (exchange != "coinbase" && currency == "cad") {
    optionsOK = false;
  }

  if (optionsOK) {
    try {
      await chrome.storage.local.set({exchange});
      await chrome.storage.local.set({currency});
      await chrome.storage.local.set({precision});
      await chrome.storage.local.set({unit});
    }
    catch (error) {
      console.log(error);
    }
  }

  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  if (optionsOK) {
    status.innerHTML = "Options Saved.";
  }
  else {
    status.innerHTML = "That exchange does not support the selected currency.";
  }
  setTimeout(function() {
    status.innerHTML = "";
  }, 1500);

  updatebadge();
}

// Restores select box state to saved value from localStorage.
async function restore_options() {
  var storage = await chrome.storage.local.get();

  var exchange = storage['exchange'];
  var currency = storage['currency'];
  var precision= storage['precision'];
  var unit     = storage['unit'];
  if (!exchange) {
    // default to coinbase
    exchange = "coinbase";
  }
  if (!currency) {
    // default to usd
    currency = "usd";
  }
  if (!precision) {
    // default to 2
    precision = 2;
  }

  var selectedExchange = document.getElementById("exchange");
  for (var i = 0; i < selectedExchange.children.length; i++) {
    var child = selectedExchange.children[i];
    if (child.value == exchange) {
      child.selected = "true";
      break;
    }
  }
  var selectedCurrency = document.getElementById("currency");
  for (var i = 0; i < selectedCurrency.children.length; i++) {
    var child = selectedCurrency.children[i];
    if (child.value == currency) {
      child.selected = "true";
      break;
    }
  }
  var selectedPrecision = document.getElementById("precision");
  for (var i = 0; i < selectedPrecision.children.length; i++) {
    var child = selectedPrecision.children[i];
    if (child.value == precision) {
      child.selected = "true";
      break;
    }
  }
  var selectedUnit = document.getElementById("unit");
  for (var i = 0; i < selectedUnit.children.length; i++) {
    var child = selectedUnit.children[i];
    if (child.value == unit) {
      child.selected = "true";
      break;
    }
  }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
