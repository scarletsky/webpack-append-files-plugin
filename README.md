# webpack-append-files-plugin

This plugin is used to append files after webpack's `afterEmit` hook.

Unlike `entry: ['fileA', 'fileB']`, it just append files like `cat fileA >> fileB` without doing any transpile.

## Usage

``` js
const AppendFilesPlugin = require('webpack-append-files-plugin');
module.exports = {
    // ...
    plugins: [
        // ... 
        new AppendFilesPlugin({
            // files to append
            files: [
                'public/static/libs/jquery.min.js',
                'dist/app.js',
            ],
            // output name
            filename: 'jquery-before-app.[contenthash:8].js'
        }),
    ]
};
```
