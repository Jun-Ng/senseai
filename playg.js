async function	pastOrdersRoutine() {

	const	dayInMS = (1000 * 60 * 60 * 24);
	const	now = new Date(Date.now());
	const	currentUTCHour = now.getUTCHours(); 
	const	sixteenUTC = new Date(Date.now()).setUTCHours(16, 0, 0, 0);
	const	nextResetTime = currentUTCHour < 16 ? sixteenUTC : sixteenUTC + dayInMS;
	const	nextRunIn = currentUTCHour < 16 ? nextResetTime - now : nextResetTime - now;
	const	start = currentUTCHour < 16 ? sixteenUTC - dayInMS : sixteenUTC;
	const	end = nextResetTime - 1;

	console.log({nextRunIn, start, end});

	setTimeout(async () => {
		this.blockTrades = true;

		await new Promise(r => setTimeout(r, 1000 * 30));
		try {
			console.log({start, end});

			const	ytdPastOrders = (await this.pastOrders())
				.filter(obj => obj.ts >= start && obj.ts < end)
				.map(obj => {
					return (
						{
							time: new Date(obj.ts).toLocaleString("en-GB", {timeZone: "Asia/Singapore"}).toString().replace(',' , ''),
							orderId: obj.orderId,
							direction: obj.direction === 1 ? 'call' : 'put',
							orderAmount: obj.orderAmount,
							paymentPrice: obj.paymentPrice,
							settlementPrice: obj.settlementPrice,
							orderProfit: obj.orderProfit,
						}
					);
				});

			const	jsonData = jsonToCsv(ytdPastOrders);

			console.log(ytdPastOrders);
			console.log(jsonData);
			
			const	eightHours = 1000 * 60 * 60 * 8;
			const	plusEightNow =  new Date(Date.now() + eightHours  - (1000 * 60 * 60 * 24));
			const	y = plusEightNow.getFullYear();
			const	m = (plusEightNow.getMonth() + 1).toString().padStart(2, '0');
			const	d = plusEightNow.getDate().toString().padStart(2, '0');

			console.log({plusEightNow, y, m, d});

			const	filename = `${y}_${m}_${d}.csv`;

			writeFileWithDirs(`./orderHistory/${filename}`, jsonData);
			
		} catch (e) {
			console.error(e);
		} finally {
			// this.pastOrdersRoutine();
			this.blockTrades = false;
			this.pastOrdersRoutine();
			return ;
		};
	}, nextRunIn);

	console.log({nextRunIn});
};

function	getGMTPlus8Date() {
	
};

(async () => {
	// pastOrdersRoutine();
	getGMTPlus8Date();
})();