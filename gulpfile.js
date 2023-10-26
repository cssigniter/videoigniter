const gulp = require('gulp');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const rename = require('gulp-rename');


const cssSrc = [
	'assets/css/**/*.css',
	'!assets/css/vendor/**/*.css',
	'!assets/css/**/*.min.css',
];

const jsSrc = [
	'assets/js/**/*.js',
	'!assets/js/vendor/**/*.js',
	'!assets/js/**/*.min.js',
];

gulp.task('minify-css', () => {
	return gulp.src(cssSrc)
		.pipe(cleanCSS())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest((file) => {
			return file.base;
		}));
});

gulp.task('minify-js', () => {
	return gulp.src(jsSrc)
		.pipe(terser())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest((file) => {
			return file.base;
		}));
});

gulp.task('watch', () => {
	gulp.watch(cssSrc, gulp.series('minify-css'));
	gulp.watch(jsSrc, gulp.series('minify-js'));
});

gulp.task('build', gulp.series('minify-css', 'minify-js'));

gulp.task('default', gulp.series('minify-css', 'minify-js', 'watch'));
