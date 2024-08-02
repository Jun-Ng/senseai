module.exports = {
	apps : [
		{
			name   : "SENSEAI",
			script : "./index.js",
			autorestart: true,
			watch: true,
			time: true,
			stop_exit_codes: [0]
		}
	]
}