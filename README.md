# webpack-concat-files-plugin

This plugin is used to concat files after webpack's `afterEmit` hook.

## Usage

``` js
const ConcatFilesPlugin = require('webpack-concat-files-plugin');
module.exports = {
    // ...
    plugins: [
        // ... 
        new ConcatFilesPlugin({
            // files to concat
            files: [
                'public/static/libs/jquery.min.js',
                'dist/app.js',
            ],
            // output name
            filename: 'jquery-before-app.js'
        }),
    ]
};
```
