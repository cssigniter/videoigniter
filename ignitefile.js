module.exports = {
	name: 'videoigniter',
	paths: {
		src: {
			styles: [
				'assets/css/**/*.css',
				'!assets/css/vendor/**/*.css',
				'!assets/css/**/*.min.css',
			],
			scripts: [
				'assets/js/**/*.js',
				'!assets/js/vendor/**/*.js',
				'!assets/js/**/*.min.js',
			],
		}
	}
}
