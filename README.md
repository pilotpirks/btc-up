# node.js API client for btc-up.com

```
const BTCUP = require('./btc-up');
let BTCUPAcc = new BTCUP(key, secret_key);

BTCUPAcc.depth({'pair': 'btc_usd'}, function(err, data) {
	if (err) {
		console.log('err:', err);
		return;
	}
	console.log(data.result);
});


BTCUPAcc.balance({}, function(err, data) {
	if (err) {
		console.log('err:', err);
		return;
	}
	console.log('data:', data)
});

```
