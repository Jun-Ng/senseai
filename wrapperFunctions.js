const	axios = require('axios');

/*
	general axios fetch logic

	keep retrying unless rate limited

	rate limit sleep time
	retry delay
	retry amount
	time since called, to determine if you need to revert

	anything more complicated than that you should just write a standalone then catch logic for that request
*/

/*
	user side

	if exceed retryAmount / maxTime / rateLimited
		resolve(null)

	if rateLimitDelay = -1 means exit

	never use reject();
*/

async function	axiosWrapper(config, retryDelay = 100, retryAmount = 3, rateLimitDelay = 1000 * 5 * 60, maxTime = 1000 * 60) {
	return (new Promise(async resolve => {
		const	calledTimestamp = Date.now();

		async function	executeRequest(retryAmount) {
			// if no more retry / exceeded maxTime
			if (retryAmount < 0 || Date.now() - calledTimestamp >= maxTime) {
				resolve(null);
				return ;
			}
			axios(config)
				.then(res => resolve(res.data))
				.catch(error => {
					console.error("--- Error Stack ---");
					console.error(error.stack);
					console.error("--- Config ---");
					console.error(error.config);
					if (error.response) {
						// The request was made and the server responded with a status code
						// that falls out of the range of 2xx
						console.error("--- Error Data ---");
						console.error(error.response.data);
						console.error("--- Error Status ---");
						console.error(error.response.status);
						console.error("--- Error Headers ---");
						console.error(error.response.headers);
		
						// rate limited
						if (error.response.status === 429) {
							if (rateLimitDelay === -1) {
								resolve(429);
								return ;
							}
							setTimeout(() => executeRequest(--retryAmount), rateLimitDelay);
							return ;
						}	
					} else if (error.request) {
						// The request was made but no response was received
						// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
						// http.ClientRequest in node.js
						console.error(error.request);
					} else {
						// Something happened in setting up the request that triggered an Error
						console.error('Error', error.message);
					}
					setTimeout(() => executeRequest(--retryAmount), retryDelay);
					return ;
				}); 
		};
		executeRequest(retryAmount);
	}));
};

module.exports = {
	axiosWrapper
}