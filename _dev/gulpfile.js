// gulp本体
var gulp = require('gulp');

// EJS
var fs = require('fs');　// JSONファイルの読み込みに使用
var plumber = require('gulp-plumber');　// エラーハンドリング
var rename = require('gulp-rename');　// ファイル名変更
var ejs = require('gulp-ejs');　// EJS本体
var convertEncoding = require('gulp-convert-encoding');　// エンコード
var htmlbeautify = require('gulp-html-beautify'); // HTML整形
var browserSync = require("browser-sync"); // browser-sync

gulp.task('watch', function (callback) {
    // ejsとjsonを監視
    gulp.watch(['./_templates/_base/**/*.ejs', './_templates/**/*.json'], function (e) {
        // 削除以外 == 追加 or 変更
        if (e.type != 'deleted') {
            // 最新のJSONファイルを同期読み込みしてオブジェクトを生成
            var json = JSON.parse(fs.readFileSync('./_templates/main.json'));

            function createHtml(name, encode){
				var options = {
					"indent_size": 4,
					"indent_with_tabs": true,
					"preserve_newlines": false,
					"selector_separator_newline": false,
					"newline_between_rules": false
				};
                gulp.src('./_templates/_base/' + name + '.ejs')
                    .pipe(plumber())
                    .pipe(ejs(json))
                    .pipe(rename(name + '.html'))
					.pipe(htmlbeautify(options))
                    .pipe(convertEncoding({to: encode}))
                    .pipe(gulp.dest('../'))
            }

            createHtml('index','shift_jis');
            createHtml('index_webup','shift_jis');
            createHtml('index_local','shift_jis');
            createHtml('z_dev','utf-8');
        }
    });

    browserSync({
        server: {
            baseDir: "../", // ルートとなるディレクトリを指定
            index: "z_dev.html"
        }
    });
    // ../フォルダ以下のファイルを監視
    gulp.watch("../*.html", function() {
        browserSync.reload();   // ファイルに変更があれば同期しているブラウザをリロード
    });
});


// 画像生成
var rimraf = require('rimraf');
var tinyping = require('gulp-tinypng-compress');

gulp.task("img", function (cb) {

    // out_images フォルダ削除
    rimraf('../out_images', cb);

    // Common 画像コピー
    gulp.src("./_templates/_base/images/*")
        .pipe(gulp.dest("../out_images"));

    // プロジェクト用 画像圧縮
    gulp.src('./_templates/images/**/*.{png,jpg,jpeg}')
        .pipe(tinyping({
            key: 'NUZDuqfqwCgpGI2RaqCfBND2Sugi8iNY' // TinyPNGのAPI Key
        }))
        .pipe(gulp.dest('../out_images'));
});


// SFTPアップロード
var sftp = require('gulp-sftp');

// 接続情報
var host = "magazinet.nestle.co.jp";
var user = "mindfree_mag_shop";
var pass = "qjhwyEYw14";
var remotePath = "/var/blog/nestle/htdocs/blog/magazine.nestle.co.jp/shop/";
var dir = "1612XXddm/"

// HTMLアップロード
gulp.task('uphtml', function () {
    return gulp.src([ // アップロードしたいファイルを指定
        '../index_webup.html'
    ])
        .pipe(sftp({
            // FTP情報を入力
            host: host,
            user: user,
            pass: pass,
            remotePath: remotePath + dir
        })
    );
});

// 画像アップロード
gulp.task('upimg', function () {
    return gulp.src([ // アップロードしたいファイルを指定
        '../out_images/**/*'
    ])
        .pipe(sftp({
            // FTP情報を入力
            host: host,
            user: user,
            pass: pass,
            remotePath: remotePath + dir + "out_images/"
        })
    );
});