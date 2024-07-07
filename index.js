require('dotenv').config();
const	EventEmitter = require('events');

// ongoing round
// https://api.sensenowai.com/api/api/getCurrentTransaction?symbol=btcusdt

// processed rounds
// https://api.sensenowai.com/api/api/getHistoryTransaction?symbol=btcusdt

const	{ axiosWrapper } = require('./wrapperFunctions');
const	msList = [];
const	empty = 0;

async function	getIntervalSocket() {
	const	eventEmitter = new EventEmitter();

	async function	pullRounds() {
		let before = performance.now();
		const	roundResponse = await axiosWrapper('https://api.sensenowai.com/api/api/getCurrentTransaction?symbol=btcusdt')
		let now = performance.now();

		msList.push(now - before);
		eventEmitter.emit('update', roundResponse);
		setTimeout(pullRounds, 100);
	};
	pullRounds();

	return (eventEmitter);
}



(async () => {
	const	started_at = performance.now();

	const	socket = await getIntervalSocket();

	socket.on('update', roundData => {
		

		console.dir({roundData}, {depth: null});

		if (!roundData.data)
			++empty;

		const	avgMs = msList.reduce((a, b) => a + b) / msList.length;
		const	mdMs = msList[Math.floor(msList.length / 2)];
		const	now = performance.now();

		console.log({
			empty,
			length: msList.length,
			avgMs,
			mdMs,
			since: now - started_at,
		});
	})
})();