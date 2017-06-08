function updatebadge() {
  var exchange = localStorage["exchange"];
  var currency = localStorage["currency"];
  if (!exchange) {
    // default to coinbase
    exchange = "coinbase";
  }
  if (!currency) {
    // default to usd
    currency = "usd";
  }

  if (exchange == "bitstamp") {
    $.getJSON("https://www.bitstamp.net/api/ticker/",function (data) {
      var badge = "n/a";

      if (data['last']) {
        localStorage['btc_usd'] = data['last'];
      }
    });
  }
  else if (exchange == "btc-e") {
    $.getJSON("https://btc-e.com/api/2/btc_usd/ticker",function (data) {
      var badge = "n/a";

      if (data['ticker']['last']) {
        if (currency == "eur") {
          localStorage['btc_eur'] = data['ticker']['last'];
        }
        else if (currency == "usd") {
          localStorage['btc_usd'] = data['ticker']['last']; 
        }
      }
    });
  }
  else if (exchange == "coinbase") {
    $.getJSON("https://coinbase.com/api/v1/currencies/exchange_rates",function (data) {
      var badge = "n/a";

      if (currency == "eur") {
        if (data['btc_to_eur']) {
          localStorage['btc_eur'] = data['btc_to_eur'];
        }
      }
      else if (currency == "usd") {
        if (data['btc_to_usd']) {
          localStorage['btc_usd'] = data['btc_to_usd'];
        }
      }
    });
  }
  else if (exchange == "coinbase_exchange") {
    $.getJSON("https://api.exchange.coinbase.com/products/BTC-USD/ticker",function (data) {
      var badge = "n/a";

      if (data['price']) {
        localStorage['btc_usd'] = data['price'];
      }
    });
  }
  else if (exchange == "kraken") {
    if (currency == "eur") {
      $.getJSON("https://api.kraken.com/0/public/Ticker?pair=XXBTZEUR",function (data) {
        var badge = "n/a";

        if (data['result']['XXBTZEUR']['c'][0]) {
          localStorage['btc_eur'] = data['result']['XXBTZEUR']['c'][0];
        }
      });
    }
    else if (currency == "usd") {
      $.getJSON("https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD",function (data) {
        var badge = "n/a";

        if (data['result']['XXBTZUSD']['c'][0]) {
          localStorage['btc_usd'] = data['result']['XXBTZUSD']['c'][0];
        }
      });
    }
  }

  if (currency == "eur") {
    if (localStorage['btc_eur']) {
      badge = localStorage['btc_eur'];
      badge = roundForBadge(badge);
    }
  }
  else if (currency == "usd") {
    if (localStorage['btc_usd']) {
      badge = localStorage['btc_usd'];
      badge = roundForBadge(badge);
    }
  }

  chrome.browserAction.setBadgeBackgroundColor({color:[0, 0, 0, 255]});
  chrome.browserAction.setBadgeText({'text':""+badge});
}

setInterval(updatebadge,5*60*1000);
updatebadge();

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 255]});
  chrome.browserAction.setBadgeText({'text':"..."});
  updatebadge();
});