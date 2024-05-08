async function roundForBadge(num) {
  var storage = await chrome.storage.local.get();
  var unit = storage['unit'];
  if (!unit) {
    unit = 1;
  }

  var precision = storage['precision'];
  if (!precision) {
    precision = 1;
  }

  num *= unit;

  if (num>9999 && num<100000) {
    return (num/1000).toFixed(precision) + 'k';
  } else {
    return (num).toFixed(precision);
  }
}

async function updatebadge() {
  var storage = await chrome.storage.local.get();
  var exchange = storage['exchange'];
  var currency = storage['currency'];
  if (!exchange) {
    // default to coinbase
    exchange = "coinbase";
  }
  if (!currency) {
    // default to usd
    currency = "usd";
  }
  var badge = "";
  var data = "";

  if (exchange == "bitstamp") {
    data = await fetch("https://www.bitstamp.net/api/ticker/");
    data = await data.json();
    badge = "n/a";

    if (data['last']) {
      await chrome.storage.local.set({btc_usd:data['last']});
    }
  }
  else if (exchange == "coinbase") {
    data = await fetch("https://api.coinbase.com/v2/prices/spot?currency=");
    data = await data.json();
    badge = "n/a";

    if (data['data']) {
      data = data['data'];

      if (data['amount']) {
        if (currency == "eur") {
            await chrome.storage.local.set({btc_eur:data['btc_to_eur']});
        }
        else if (currency == "usd") {
            await chrome.storage.local.set({btc_usd:data['amount']});
        }
        else if (currency == "cad") {
            await chrome.storage.local.set({btc_cad:data['btc_to_cad']});
        }
      }
    }
  }
  else if (exchange == "coinbasePro") {
    var product = "";
    if (currency == "eur") {
      product = "BTC-EUR";
    }
    else if (currency == "usd") {
      product = "BTC-USD";
    }
    data = await fetch("https://api.pro.coinbase.com/products/" + product + "/ticker");
    data = await data.json();
    badge = "n/a";

    if (data['price']) {
      if (currency == "eur") {
        await chrome.storage.local.set({btc_eur:data['price']});
      }
      else if (currency == "usd") {
        await chrome.storage.local.set({btc_usd:data['price']});
      }
    }
  }
  else if (exchange == "kraken") {
    if (currency == "eur") {
      data = await fetch("https://api.kraken.com/0/public/Ticker?pair=XXBTZEUR");
      data = await data.json();
      badge = "n/a";

      if (data['result']['XXBTZEUR']['c'][0]) {
        await chrome.storage.local.set({btc_eur:data['result']['XXBTZEUR']['c'][0]});
      }
    }
    else if (currency == "usd") {
      data = await fetch("https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD");
      data = await data.json();
      badge = "n/a";

      if (data['result']['XXBTZUSD']['c'][0]) {
        await chrome.storage.local.set({btc_usd:data['result']['XXBTZUSD']['c'][0]});
      }
    }
  }

  storage = await chrome.storage.local.get();

  if (currency == "eur") {
    if (storage['btc_eur']) {
      badge = storage['btc_eur'];
      badge = await roundForBadge(badge);
    }
  }
  else if (currency == "usd") {
    if (storage['btc_usd']) {
      badge = storage['btc_usd'];
      badge = await roundForBadge(badge);
    }
  }
  else if (currency == "cad") {
    if (storage['btc_cad']) {
      badge = storage['btc_cad'];
      badge = await roundForBadge(badge);
    }
  }

  //chrome.action.setBadgeTextColor({color:'white'});
  chrome.action.setBadgeText({text:''+badge});
}

async function update() {
  //chrome.action.setBadgeTextColor({color:'white'});
  chrome.action.setBadgeText({text:'...'});
  //setInterval(updatebadge,5*60*1000);
  setInterval(updatebadge,29000);
  updatebadge();
}

chrome.runtime.onInstalled.addListener(function() {
  update();
});

chrome.runtime.onStartup.addListener(function() {
  update();
});

chrome.action.onClicked.addListener(function(tab) {
  update();
});

chrome.idle.onStateChanged.addListener(function(state) {
  if (state == 'active') {
    update();
  }
});
