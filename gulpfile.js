'use strict';
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');//генерации css sourscemap
const imagemin = require('gulp-imagemin');//сжатие картинок
const pngquant = require('imagemin-pngquant');//сжатие png
const uglify = require('gulp-uglify');//минификация js
const rigger = require('gulp-rigger');//импорт одного файла в другой простой конструкцией //= footer.html
const watch = require('gulp-watch');
const del = require('del');//удаление файлов
const wiredep = require('wiredep').stream;//внесение ссылок на скрипты и стили из Bower в файл html
const postcss = require('gulp-postcss');
const precss = require('precss');
const scss = require('postcss-scss');
const responsiveimages = require('postcss-responsive-images');
const autoprefixer = require('autoprefixer');//автопрефиксы
const mqpacker = require("css-mqpacker");//группировка медиавыражений
const csswring = require('csswring');//минификация css
const csscomb = require('gulp-csscomb');//подгонка стилей к одному формату
const lost = require('lost');//грид сетка
const postcssfocus = require('postcss-focus');//если есть hover, то обавляет focus
const fontmagician = require('postcss-font-magician')({hosted: './**/**'});
const browserSync = require("browser-sync").create();


var path = {
    dist: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: 'dist/',
        js: 'dist/js/',
        css: 'dist/css/',
        img: 'dist/img/',
        fonts: 'dist/fonts/'
    },
    src: { //Пути откуда брать исходники
        html: 'src/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js: 'src/js/main.js',//В стилях и скриптах нам понадобятся только main файлы
        css: 'src/css/',
        img: 'src/img/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts: 'src/fonts/**/*.*'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html: 'src/**/**/*.*',
        js: 'src/js/**/*.js',
        css: 'src/css/**/*.css',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './dist'
};


//Собираем пути к скриптам и стилям Bower 
gulp.task('html:bower', function () {
    return gulp.src('./src/html/partials/index.html') //Выберем файлы по нужному пути
        .pipe(wiredep({
            directory : "src/bower_components",
            })) //Забивает ссылки фреймворков в *.html <!-- bower:css/js --><!-- endbower -->
        .pipe(gulp.dest('./src/html')) //Выплюнем их в папку src
});


//Собираем html 
gulp.task('html', function () {
     return gulp.src('./src/html/*.html') //Выберем файлы по нужному пути
        .pipe(rigger()) //Прогоним через rigger//Для сборки вставляем в нужных местах //= template/footer.html
        .pipe(gulp.dest('./dist')) //Выплюнем их в папку dist
 //И перезагрузим наш сервер для обновлений
});



//Собираем CSS
gulp.task('css', function() {
 var processors = [
        fontmagician,
        lost,
        postcssfocus,
        responsiveimages,
        precss,
        autoprefixer({browsers: ['last 2 version']}),
        mqpacker,

        //csswring отключен, чтобы читать нормально стили, при продакшене включить
    ];
 return gulp.src('./src/css/style.css')
        .pipe(sourcemaps.init())//Инициализируем sourcemap
        .pipe(rigger()) //Прогоним через rigger
        .pipe(postcss(processors))
        .pipe(csscomb())
        .pipe(sourcemaps.write('./'))//Пропишем карты
        .pipe(gulp.dest('./dist/css/'))
        
});
//Проверяем CSS
gulp.task('analyze-css', function () {
  var postcss = require('gulp-postcss');
  var stylelint = require('stylelint');
  var reporter = require('postcss-reporter');

  return gulp.src('./src/css/style.css')
    .pipe(postcss([
      stylelint(), 
      reporter()
    ]));
});





//Собираем js
gulp.task('js', function () {
    return gulp.src(path.src.js) //Найдем наш main файл
        .pipe(rigger()) //Прогоним через rigger
        .pipe(sourcemaps.init()) //Инициализируем sourcemap
        .pipe(uglify()) //Сожмем наш js
        .pipe(sourcemaps.write()) //Пропишем карты
        .pipe(gulp.dest(path.dist.js)) //Выплюнем готовый файл в build
        
});

//Шрифты
gulp.task('fonts', function() {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.dist.fonts))
});

//Собираем картинки
gulp.task('img', function () {
    return gulp.src(path.src.img)//Выберем наши картинки
        .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
        .pipe(gulp.dest(path.dist.img))//И бросим в dist
       
});
gulp.task('build', gulp.series(
    'html',
    'js',
    'fonts',
    'img',
    'css'
));

gulp.task('watch', function(){
    gulp.watch([path.watch.html], gulp.series ('html'));
    gulp.watch([path.watch.css], gulp.series ('css'));
    gulp.watch([path.watch.js], gulp.series ('js'));
    gulp.watch([path.watch.img], gulp.series ('img'));
    gulp.watch([path.watch.fonts], gulp.series ('fonts'));

});


//Создадим переменную с настройками нашего dev сервера:

gulp.task('webserver', function () {
    browserSync.init({
        server: {
            baseDir: "./dist"
        }
    });
    browserSync.watch('dist/**/*.*').on('change', browserSync.reload);
});



gulp.task('clean', function() {
    return del([path.clean]);
});

gulp.task('default', 
    gulp.series ('build', gulp.parallel('watch', 'webserver'))
 );
