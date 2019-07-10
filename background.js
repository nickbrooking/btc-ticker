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
  else if (exchange == "coinbase") {
    $.getJSON("https://api.coinbase.com/v2/prices/spot?currency=" + currency,function (data) {
      var badge = "n/a";

      if (data['data']) {
        data = data['data'];

        if (data['amount']) {
          if (currency == "eur") {
              localStorage['btc_eur'] = data['btc_to_eur'];
          }
          else if (currency == "usd") {
              localStorage['btc_usd'] = data['amount'];
          }
          else if (currency == "cad") {
              localStorage['btc_cad'] = data['btc_to_cad'];
          }
        }
      }
    });
  }
  else if (exchange == "coinbasePro") {
    var product = "";
    if (currency == "eur") {
      product = "BTC-EUR";
    }
    else if (currency == "usd") {
      product = "BTC-USD";
    }
    $.getJSON("https://api.pro.coinbase.com/products/" + product + "/ticker",function (data) {
      var badge = "n/a";

      if (data['price']) {
        if (currency == "eur") {
          localStorage['btc_eur'] = data['price'];
        }
        else if (currency == "usd") {
          localStorage['btc_usd'] = data['price'];
        }
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
  else if (currency == "cad") {
    if (localStorage['btc_cad']) {
      badge = localStorage['btc_cad'];
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
