'use strict';

var request = require('request');

function CurrencyController(options) {
  this.node = options.node;
  var refresh = options.currencyRefresh || CurrencyController.DEFAULT_CURRENCY_DELAY;
  this.currencyDelay = refresh * 60000;
  this.bitstampRate = 0; // USD/BTC
  this.poloniexRate = 0; // BTC/HUSH is not on poloniex, uses coinmarket cap https://api.coinmarketcap.com/v1/ticker/hush/ TODO2 for zelcash once listed
  this.timestamp = Date.now();
}

CurrencyController.DEFAULT_CURRENCY_DELAY = 10;

CurrencyController.prototype.index = function(req, res) {
  var self = this;
  var currentTime = Date.now();
  if (self.bitstampRate === 0 || currentTime >= (self.timestamp + self.currencyDelay)) {
    self.timestamp = currentTime;
    request('https://www.bitstamp.net/api/ticker/', function(err, response, body) {
      if (err) {
        self.node.log.error(err);
      }
      if (!err && response.statusCode === 200) {
        self.bitstampRate = parseFloat(JSON.parse(body).last);
      }
      request('https://stocks.exchange/api2/ticker', function (err, response, body) {
        if (err) {
          self.node.log.error(err);
        }
        if (!err && response.statusCode === 200) {
            var coindata = JSON.parse(body);
          self.poloniexRate = parseFloat(coindata[204].last);
        }
        res.jsonp({
          status: 200,
          data: {
            bitstamp: self.bitstampRate * self.poloniexRate
          }
        });
      });
    });
  } else {
    res.jsonp({
      status: 200,
      data: { 
        bitstamp: self.bitstampRate * self.poloniexRate
      }
    });
  }

};

module.exports = CurrencyController;
