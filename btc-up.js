const https = require('https'),
    url = require('url'),
    crypto = require('crypto'),
    querystring = require('querystring'),
    util = require('util');

module.exports = BTCUP;

function BTCUP(key, secret) {
    this.key = key
    this.secret = secret
    this.urlPost = 'https://tapi.btc-up.com'
    this.urlGet = 'https://tapi.btc-up.com'
    this.nonce = BTCUP.getTimestamp(Date.now())
}


// --------------------------------------------- GET ---------------------------------------------

BTCUP.prototype.trades = function(params, callback) {
    if (!params) params = {}
    let limit = (!params.limit || params.limit > 2000) ? 100 : params.limit;
    let pair = (!params.pair) ? 'BTC_USD' : String(params.pair).toUpperCase();

    let url = this.urlGet +'/trades/'+ pair + '?limit=' + limit;
    this.getHTTPS(url, callback)
}


BTCUP.prototype.depth = function(params, callback) {
    if (!params) params = {}
    let pair = (!params.pair) ? 'BTC_USD' : String(params.pair).toUpperCase();
    let limit = (!params.limit) ? 100 : params.limit;

    let url = this.urlGet +'/depth/'+ pair + '?limit=' + limit;
    this.getHTTPS(url, callback)
}


BTCUP.prototype.ticker = function(params, callback) {
    if (!params) params = {}
    if (!params.pair) params.pair = 'btc_usd'
    let pair = (!params.pair) ? 'BTC_USD' : String(params.pair).toUpperCase();

    let url = this.urlGet + '/ticker/' + pair;
    this.getHTTPS(url, callback)
}


// --------------------------------------------- POST ---------------------------------------------
    
BTCUP.prototype.FiatTransactions = function(params, callback) {
  this.query('FiatTransactions', params, callback)
}

BTCUP.prototype.CryptoTransactions = function(params, callback) {
  this.query('CryptoTransactions', params, callback)
}

BTCUP.prototype.RedeemCoupon = function(params, callback) {
  this.query('RedeemCoupon', params, callback)
}

BTCUP.prototype.CreateCoupon = function(params, callback) {
  this.query('CreateCoupon', params, callback)
}

BTCUP.prototype.Transfer = function(params, callback) {
  this.query('Transfer', params, callback)
}

BTCUP.prototype.WithdrawCrypto = function(params, callback) {
  this.query('WithdrawCrypto', params, callback)
}

BTCUP.prototype.CancelOrder = function(orderId, callback) {
  this.query('CancelOrder', {'orderId': orderId}, callback)
}

BTCUP.prototype.PlaceMarket = function(params, callback) {
  this.query('PlaceMarket', params, callback)
}

BTCUP.prototype.PlaceLimit = function(params, callback) {
  this.query('PlaceLimit', params, callback)
}

BTCUP.prototype.TradeHistory = function(params, callback) {
  this.query('TradeHistory', params, callback)
}

BTCUP.prototype.OrderInfo = function(order_id, callback) {
  this.query('OrderInfo', { 'order_id': order_id }, callback)
}

BTCUP.prototype.OpenOrders = function(pair, callback) {
  this.query('OpenOrders', { 'pair': pair }, callback)
}

BTCUP.prototype.balance = function(currency, callback) {
  this.query('balance', { 'currency': currency }, callback)
}

BTCUP.prototype.account = function(callback) {
  this.query('account', {}, callback)
}


/**
 * query: Executes raw query to the API
 *
 * @param {String} method
 * @param {Object} params
 * @param {Function} callback(err, data)
 */
BTCUP.prototype.query = function(method, params, callback) {
    let content = {
        'method': method,
        'nonce': ++this.nonce,
    }

    if (!!params && typeof(params) == 'object') {
        Object.keys(params).forEach(function (key) {
            if (key == 'since' || key == 'end') {
                value = BTCUP.getTimestamp(params[key]);
            } else {
                value = params[key];
            }

            content[key] = value;
        })
    }

    content = querystring.stringify(content);

    let sign = crypto
        .createHmac('sha512', new Buffer(this.secret, 'utf8'))
        .update(new Buffer(content, 'utf8'))
        .digest('hex')

    let options = url.parse(this.urlPost);
    options.method = 'POST';
    options.headers = {
        'Key': this.key,
        'Sign': sign,
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': content.length,
    }

    let req = https.request(options, function(res) {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function() {
            BTCUP.responseHandler(null, data, callback)
        });
    });

    req.on('error', function(err) {
        BTCUP.responseHandler(err, null, callback)
    });

    req.write(content);
    req.end();
}

/**
 * getHTTPS: Simple HTTPS GET request
 *
 * @param {String} getUrl
 * @param {Function} callback(err, data)
 */
    BTCUP.prototype.getHTTPS = function(getUrl, callback) {

        let options = url.parse(getUrl);
        options.method = 'GET';
        let req = https.request(options, function(res) {
            let data = ''
            let err = false;
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on('end', function() {
                BTCUP.responseHandler(null, data, callback)
            });
        });

        req.on('error', function(err) {
            BTCUP.responseHandler(err, null, callback)
        });

        req.end();
    }


/**
 * Helper function to handle BTCUP HTTP responses and errors
 */
    BTCUP.responseHandler = function(err, data, callback) {
        if (err) {
            callback(err, null);
        } else {
            let result = null;
            let errorMessage = null;
            try {
                result = JSON.parse(data);
                if (result.error || result.success == 0) {
                    errorMessage = result.error || 'Unknown error';
                }
            } catch (e) {
                errorMessage = 'Error parsing JSON';
            }
    
            if (errorMessage) {
                callback(new Error(errorMessage), result);
            } else {
                callback(null, result);
            }
        }
    }

/**
 * getTimestamp: converts a Date object, a string, or a JS timestamp to a UNIX timestamp.
 * @param {Mixed} time
 */
    BTCUP.getTimestamp = function(time) {
        if (util.isDate(time)) {
            return Math.round(time.getTime() / 1000);
        }
        if (typeof time == 'string') {
            return BTCUP.getTimestamp(new Date(time));
        }
        if (typeof time == 'number') {
            return (time >= 0x100000000) ? Math.round(time / 1000) : time;

        // This time stamp counts amount of 200ms ticks starting from Jan 1st, 2014 UTC
        // On 22 Mar 2041 01:17:39 UTC, it will overflow the 32 bits and will fail the nonce key for BTC-e
        //~ return Math.floor((Date.now() - Date.UTC(2014,0)) / 200)
        }
        return 0;
    }
