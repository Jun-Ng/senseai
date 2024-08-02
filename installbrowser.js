const	puppeteer_browser = require("@puppeteer/browsers");
const	{ join } = require('path');

async function	install_browser() {
	const	buildId = '127.0.6533.72';
	await puppeteer_browser.install({
		browser: 'chrome',
		cacheDir: __dirname,
		buildId
	});
	console.log('done');
};

install_browser();