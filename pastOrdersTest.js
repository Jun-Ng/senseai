const	puppeteer = require('puppeteer-extra');
const	StealthPlugin = require('puppeteer-extra-plugin-stealth')
const	{ axiosWrapper } = require('./wrapperFunctions');
const	CONFIG = require('./config.json');
const	EventEmitter = require('events');

// starting = 9,014.392
// 12am aug 1

puppeteer.use(StealthPlugin());
require('dotenv').config();

function getNextMidnightTimestampGMT8() {
	const now = new Date();
	
	// Create a date object for GMT+8
	const gmt8Date = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Singapore"}));
	
	// Set the time to next midnight
	// runs every 12am 30s
	gmt8Date.setHours(24, 0, 30, 0);
	
	// Convert to timestamp (seconds)
	return (gmt8Date.getTime());
};

(async () => {
	const nextRun = getNextMidnightTimestampGMT8();

	console.log({nextRun});
})()