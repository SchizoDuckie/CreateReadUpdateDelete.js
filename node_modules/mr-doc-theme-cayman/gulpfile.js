var gulp        = require('gulp');
var shell       = require('gulp-shell');
var connect     = require('gulp-connect');
var sass        = require('gulp-ruby-sass');
var clipboard   = require('gulp-clipboard');
var uglify      = require('gulp-uglify');
var uglifycss   = require('gulp-uglifycss');
var path        = require('path');
var _           = require('lodash');

/** ----------- Build Dir ----------- */

// Alias for path.join
var join = path.join.bind(path);

// Current working directory
var cwd = process.cwd();

// Bower paths
var bower = { path:'./bower_components/' };
_.extend(bower, {
  bootstrap: { path: join(bower.path, 'bootstrap-sass/') },
  jquery: { path: join(bower.path, 'jquery/') },
  prism: { path: join(bower.path, 'prism/') }
});

// Test paths
var test = { path:'test/'};
_.extend(test, { 
  docs: { path: join(test.path, 'docs/') },
  src: { path: join(test.path, 'source/') } 
});
_.extend(test.docs, {
  css: { path: join(test.docs.path, 'css/') },
  js: { path: join(test.docs.path, 'js/') }
});

// Asset paths
var assets = { path:'assets/' };
_.extend(assets, {
  css: { path: join(assets.path, 'css/') },
  js: { path: join(assets.path, 'js/') }
});

// Doxx commands
var cmd = { source:' --source ', target:' --target ', template: ' --template ' };

// Doxx commands with path
var source = cmd.source +  join(cwd, test.src.path);
var target = cmd.target + join(cwd, test.docs.path);
var template = cmd.template + join(cwd, 'template/index.jade');

/** ---------------------- Tasks ---------------------- */

// Task 1: Build the docs
gulp.task('docs',shell.task([
    './node_modules/.bin/mr-doc ' + source + target + template + ' --kit '
]));

// Task 2: Build Sass and copy it into the test dir and assets
gulp.task('sass', ['docs'], function() {
  return sass("./scss/",{
    loadPath:[
        join(bower.bootstrap.path, 'assets/stylesheets')
    ]
  })
  .on('error', sass.logError)
  .pipe(uglifycss({
    'max-line-len': 80
  }))
  .pipe(gulp.dest(test.docs.css.path))
  .pipe(gulp.dest(assets.css.path));
});

// Task 3: Copy the files from bower into js and assets
gulp.task('copy:js', ['docs'], function () {
  return gulp.src([
    bower.prism.path      + 'prism.js',
    bower.prism.path      + 'components/prism-bash.js',
    bower.prism.path      + 'components/prism-jade.js',
    bower.bootstrap.path  + 'assets/javascripts/bootstrap/affix.js',
    bower.bootstrap.path  + 'assets/javascripts/bootstrap/dropdown.js',
    bower.bootstrap.path  + 'assets/javascripts/bootstrap/scrollspy.js',
    bower.bootstrap.path  + 'assets/javascripts/bootstrap.min.js',
    bower.jquery.path     + 'dist/jquery.min.js'
  ])
  .pipe(uglify())
  .pipe(clipboard())
  .pipe(gulp.dest(test.docs.js.path))
  .pipe(gulp.dest(assets.js.path));
});

// Task 4: Copy the files from bower into css
gulp.task('copy:css', ['docs'], function () {
  return gulp.src([
    bower.prism.path + 'themes/prism.css',
  ])
  .pipe(clipboard())
  .pipe(uglifycss({
    'max-line-len': 80
  }))
  .pipe(gulp.dest(test.docs.css.path))
  .pipe(gulp.dest(assets.css.path));
});

// Create server
gulp.task('connect', function() {
  connect.server({
    root: test.docs.path,
    livereload: true
  });
});

// Reload the page
gulp.task('html', function () {
  gulp.src(test.docs.path + '*.html')
    .pipe(connect.reload());
});

// Watch for changes
gulp.task('watch', function () {
  gulp.watch(['template/*.jade', 'scss/*.scss', './*.md'], ['docs', 'sass', 'copy:js', 'copy:css']);
});

// Default
gulp.task('default', ['build','connect', 'watch']);

// Build
gulp.task('build', ['docs', 'sass','copy:js', 'copy:css']);