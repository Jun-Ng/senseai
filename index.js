const	puppeteer = require('puppeteer-extra');
const	StealthPlugin = require('puppeteer-extra-plugin-stealth')
const	{ axiosWrapper } = require('./wrapperFunctions');
const	CONFIG = require('./config.json');
const	EventEmitter = require('events');

// starting = 9,014.392
// 12am aug 1

puppeteer.use(StealthPlugin());
require('dotenv').config();

async	function	checkNetworkPopUp(page) {
	// network slow pop-up
	const	popped_up = await page.waitForSelector('#app > div > div.transaction-wrap.main-bg > section > div.popup-network-delay.popup-bg.text-color-title.van-popup.van-popup--center > div > div.btn.text-color-value.popup-bg', {visible: true, timeout: 200}).catch(e => null);

	console.log({popped_up});

	if (popped_up)

		await page.click('#app > div > div.transaction-wrap.main-bg > section > div.popup-network-delay.popup-bg.text-color-title.van-popup.van-popup--center > div > div.btn.text-color-value.popup-bg');
	
	return ;
}

class	puppeteerExchange {
	constructor() {
		const initiate_browser = async () => {
			this.ready = false;
			this.browser = false;
			this.browser = await puppeteer.launch({headless: false});
			this.browser.on('disconnected', initiate_browser);
			this.headers = null;
			this.page = await this.browser.newPage();

			// navigate to login page
			await Promise.all([
				this.page.waitForNavigation(),
				this.page.goto('https://www.wapex.com/#/login?routerType=2')
			]);
			console.log('loaded');

			// catch request headers
			this.page.on('request', async request => {
				if ((/^https:\/\/wapex\.com\/api\/app\/game\/option\/getAllVirtualOrderList*/).test(request.url())) {
					if (request.headers()['authorization-user'])
						this.headers = request.headers();
				}
			});

			// logging in
			await this.page.type("#retrieve-page > div > div.tab-components > div.item.input-bg-color > input", process.env.id);
			await this.page.type("#retrieve-page > div > div.password-component > div > div.input > form > input", process.env.pw);
			await Promise.all([
				this.page.waitForNavigation(),
				this.page.click('#retrieve-page > div > div.long-button-component.text-color-white.login-button.long-button-active')
			]);

			// wait a little
			await new Promise(r => setTimeout(r, 1000 * (Math.random() * 5)));

			// navigate to trading this.page
			await this.page.goto('https://www.wapex.com/#/trade', {waitUntil: 'networkidle0'})

			await this.page.waitForSelector('#app > div > div.transaction-wrap.main-bg > header > div.selectFilter-wrap > section.filter-icon-wrap > div');
			await this.page.click('#app > div > div.transaction-wrap.main-bg > header > div.selectFilter-wrap > section.filter-icon-wrap > div');

			// click on btc/usdt
			await this.page.waitForSelector('#app > div > div.transaction-wrap.main-bg > header > div.selectFilter-wrap > section.dropdown-wrap > div.dropdown-content > div > section.right-wrap > div > div > div.item-wrap.active');
			await this.page.click('#app > div > div.transaction-wrap.main-bg > header > div.selectFilter-wrap > section.dropdown-wrap > div.dropdown-content > div > section.right-wrap > div > div > div.item-wrap.active');

			// if demo mode
			if (process.env.mode === 'try')
				await this.page.click('#app > div > div.transaction-wrap.main-bg > section > section.account-tabs-wrap.border-bottom > div.account-item.text-color-title');
			else
				await this.page.click('#app > div > div.transaction-wrap.main-bg > section > section.account-tabs-wrap.border-bottom > div.account-item.text-color-value.border-bottom-color.active');				

			this.ready = true;
		};

		(async () => {
			await initiate_browser();
		})();
	};

	async	isReady() {
		return new Promise(r => setInterval(() => {
			this.ready && this.headers ? r() : null
		}, 50));
	}

	async	call(amount) {
		if (!this.ready)
			return	(false);

		try {
			this.processingOrder = true;

			// remove previous input amount
			// unable to use $eval here to directly modify input.value for some reason
			await this.page.click('#app > div > div.transaction-wrap.main-bg > section > section.all-amount-wrap > div.price-input > div.input-box > div.delete-img');
			// input amount
			await this.page.type('#app > div > div.transaction-wrap.main-bg > section > section.all-amount-wrap > div.price-input > div.input-box > div.input.van-cell.van-field > div > div > input', amount.toString());

			await this.page.click('#app > div > div.transaction-wrap.main-bg > section > section.btn-wrap > div.btn.text-color-white.bg-color-green');

			await checkNetworkPopUp(this.page);

			// wait for success pop-up to go away
			await new Promise(r => setTimeout(r, 2000));

			this.processingOrder = false;
		}	catch (e) {
			console.error(e);
		}	finally {
			this.processingOrder = false;
		};
	};

	async	put(amount) {
		if (!this.ready)
			return (null);

		try {
			this.processingOrder = true;

			// remove previous input amount
			// unable to use $eval here to directly modify input.value for some reason
			await this.page.click('#app > div > div.transaction-wrap.main-bg > section > section.all-amount-wrap > div.price-input > div.input-box > div.delete-img');
			// input amount
			await this.page.type('#app > div > div.transaction-wrap.main-bg > section > section.all-amount-wrap > div.price-input > div.input-box > div.input.van-cell.van-field > div > div > input', amount.toString());

			await this.page.click('#app > div > div.transaction-wrap.main-bg > section > section.btn-wrap > div.btn.text-color-white.bg-color-red');

			await checkNetworkPopUp(this.page);

			// wait for success pop-up to go away
			await new Promise(r => setTimeout(r, 2000));

			this.processingOrder = false;
		} catch (e) {
			console.error(e);
		} finally {
			this.processingOrder = false;
		};
	};

	async	openOrders() {
		if (!this.ready || !this.headers)
			return (null);

		const	url = process.env.mode === 'try' 
			? 'https://wapex.com/api/app/game/option/getAllVirtualOrderList?contract=BTC%2FUSDT&type=1&currencyId=7&accountType=8'
			: 'https://wapex.com/api/app/game/option/getOrderList?contract=BTC%2FUSDT&type=3&currencyId=4&accountType=1';
		const	r = await axiosWrapper({url, headers: this.headers});

		if (r.msg !== 'success')
			return (null);

		const	orderList = r.data.positionList;
		return (orderList);
	};

	async	pastOrders() {
		if (!this.ready || !this.headers)
			return (null);

		const	url = process.env.mode === 'try' 
			? 'https://wapex.com/api/app/game/option/getAllVirtualOrderList?contract=BTC%2FUSDT&type=3&currencyId=7&accountType=8' 
			: 'https://wapex.com/api/app/game/option/getOrderList?contract=BTC%2FUSDT&type=3&currencyId=4&accountType=3';
		const	r = await axiosWrapper({url, headers: this.headers});

		if (r.msg !== 'success')
			return (null)
	
		const	orderList = r.data.orderList;
		return (orderList);
	};
	
	async	getAccountBalance() {
		if (!this.ready || !this.headers)
			return (null);
		/*
			"currencyConfig": 
			[
				{
					"id": 1,
					"name": "INTEGRAL",
					"decimals": 0
				},
				{
					"id": 2,
					"name": "BTC",
					"decimals": 6
				},
				{
					"id": 3,
					"name": "ETH",
					"decimals": 6
				},
				{
					"id": 4,
					"name": "USDT",
					"decimals": 4
				},
				{
					"id": 5,
					"name": "USDC",
					"decimals": 2
				},
				{
					"id": 6,
					"name": "QDT",
					"decimals": 4
				},
				{
					"id": 7,
					"name": "TRY",
					"decimals": 4
				}
			]
		*/
		const	balance = {
			'usdt': null,
			'usdc': null,
			'try': null
		}

		const	url = 'https://wapex.com/api/app/assets/accountAsset?accounType=3,4,5,8';
		const	r = await axiosWrapper({url, headers: this.headers});

		if (r.msg !== 'success')
			return (null);

		/*
			why do they even have difference account types
			fuck this shit ??

			oh they have futures & leverage
			I would assume 5 is for futures & 8 is for lev?

			"data": 
			{
				"totalUsdt": "0",
				"accountAssetsVOS": [
					{
						"accountType": 3,
						"usdtBalance": "0",
						"currencyAssetsVOList": [
							{
								"currencyId": 4,
								"balance": "0"
							}
						]
					},
					{
						"accountType": 5,
						"usdtBalance": "0",
						"currencyAssetsVOList": [
							{
								"currencyId": 6,
								"balance": "0"
							}
						]
					},
					{
						"accountType": 8,
						"usdtBalance": "0",
						"currencyAssetsVOList": [
							{
								"currencyId": 7,
								"balance": "9008.696056"
							}
						]
					}
				]
			} 
		*/
		const	accountBalance = r.data.accountAssetsVOS;
		for (const account of accountBalance) {
			if (account.accountType === 3) {
				for (const currency of account.currencyAssetsVOList) {
					if (currency.currencyId === 4)
						balance.usdt = +currency.balance;
				};
			} else if (account.accountType === 8) {
				for (const currency of account.currencyAssetsVOList) {
					if (currency.currencyId === 7)
						balance.try = +currency.balance;
				};
			}; 
		};

		return (balance);
	};
};

async function	getIntervalSocket() {
	const	eventEmitter = new EventEmitter();

	async function	pullRounds() {
		const	roundResponse = await axiosWrapper('https://api.sensenowai.com/api/api/getCurrentTransaction?symbol=btcusdt');

		if (roundResponse?.code === 0)
			eventEmitter.emit('update', roundResponse);
		setTimeout(pullRounds, 100);
	};
	pullRounds();
	return (eventEmitter);
};

let	last_update = null;
let	last_order_id = null;
let	locked_ai_update = false;

function deepEqual(obj1, obj2) {
	if (obj1 === obj2) return true;
  
	if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
	  return false;
	}
  
	let keys1 = Object.keys(obj1);
	let keys2 = Object.keys(obj2);
  
	if (keys1.length !== keys2.length) return false;
  
	for (let key of keys1) {
	  if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
	}
  
	return true;
}

async function	handleAIUpdate(update, exchange) {
	/*
		//  no rounds on going
		{ code: 0, data: { current: null }, msg: '执行成功' }

		// 
		{
			code: 0,
			data: {
				current: {
				frequency: 0,
				lastTime: null,
				profit: 0,
				list: [
					{
					round: 1,
					direction: '1',
					cycle: 30,
					orderAmount: 100,
					paymentPrice: 66523.765625,
					settlementPrice: 66515.984375,
					orderProfit: -100,
					orderTime: 1722434548,
					settlementTime: 1722434578,
					orderId: '1818648424895639552',
					final: false
					}
				]
				}
			},
			msg: '执行成功'
		}

		{
			code: 0,
			data: {
				current: {
				frequency: 0,
				lastTime: null,
				profit: 0,
				list: [
					{
					round: 1,
					direction: '1',
					cycle: 30,
					orderAmount: 100,
					paymentPrice: 66523.765625,
					settlementPrice: 66515.984375,
					orderProfit: -100,
					orderTime: 1722434548,
					settlementTime: 1722434578,
					orderId: '1818648424895639552',
					final: false
					},
					{
					round: 2,
					direction: '1',
					cycle: 30,
					orderAmount: 300,
					paymentPrice: 66533.109375,
					settlementPrice: 0,
					orderProfit: 0,
					orderTime: 1722434631,
					settlementTime: 1722434661,
					orderId: '1818648773031260160',
					final: false
					}
				]
				}
			},
			msg: '执行成功'
		}
	*/

	if (locked_ai_update)
		return ;

	locked_ai_update = true;
	try {
		
		// if (deepEqual(last_update, update))
		// 	return ;
		// last_update = update;
		console.dir(update, {depth: null, maxArrayLength: null});

		// if no rounds ongoing
		if (update.data.current === null)
			return ;

		if (update.data.current !== null) {
			const	list = update.data.current.list;
			const	list_last_index = list.length - 1;
			const	latest_round = list[list_last_index];
			const	latest_round_ts = latest_round.orderTime * 1000;
			const	now = Date.now();

			// if within 2s
			if (latest_round.orderId !== last_order_id 
				&& (now - latest_round_ts) < CONFIG.MAX_ORDER_TIME_DELAY) {
					if (latest_round.direction === '1')
						await exchange.call(CONFIG.ORDER_AMOUNT);
					else
						await exchange.put(CONFIG.ORDER_AMOUNT);

					last_order_id = latest_round.orderId
					const openOrders = await exchange.openOrders();

					console.log({openOrders});
			};
		}
	} catch (e) {
		console.error(e);
	} finally {
		locked_ai_update = false;
	};
};  

async function	checkBalance(exchange) {
	const balance = await exchange.getAccountBalance();

	if (balance[process.env.mode === 'try' ? 'try' : 'usdt'] <= CONFIG.MIN_USDT_AMOUNT) {
		console.log('FUNDS BELOW MINIMUM');
		process.exit();
	};
	setTimeout(() => checkBalance(exchange), 1000 * 60 * 5);
	return ;
};

(async () => {

	const	exchange = new puppeteerExchange();
	await exchange.isReady();

	await checkBalance(exchange);
	const	AISOCKET = await getIntervalSocket();
	AISOCKET.on('update', update => handleAIUpdate(update, exchange));

	return ;
})();

/*
	random info

	open orders
		direction: '1' = call, '2' = put


	

	"currencyConfig": [
		{
			"id": 1,
			"name": "INTEGRAL",
			"decimals": 0
		},
		{
			"id": 2,
			"name": "BTC",
			"decimals": 6
		},
		{
			"id": 3,
			"name": "ETH",
			"decimals": 6
		},
		{
			"id": 4,
			"name": "USDT",
			"decimals": 4
		},
		{
			"id": 5,
			"name": "USDC",
			"decimals": 2
		},
		{
			"id": 6,
			"name": "QDT",
			"decimals": 4
		},
		{
			"id": 7,
			"name": "TRY",
			"decimals": 4
		}
	]
*/