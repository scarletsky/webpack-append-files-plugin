const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const loaderUtils = require('loader-utils');
const { promisify } = require('util');
const { default: PQueue } = require('p-queue');

const id = 'WebpackAppendFilesPlugin';
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

function WebpackAppendFilesPlugin(options) {
    if (options === undefined) {
        options = {};
    }

    if (!options.filename) {
        throw new Error(`[${id}]: missing filename.`);
    }

    const random = Math.random().toString(36);
    const hash = crypto.createHash('sha1');
    hash.update(random);

    this.filename = options.filename;
    this.files = options.files || [];
    this._tempname = hash.digest('hex');
}

WebpackAppendFilesPlugin.prototype.apply = function (compiler) {

    const { context, output } = compiler.options;
    const outputPath = output.path;
    const globalRef = {
        context,
        outputPath,
        outputTempPath: path.resolve(outputPath, this._tempname),
        outputFilePath: path.resolve(outputPath, this.filename),
    };

    compiler.hooks.afterEmit.tapPromise(id, (compilation) => {
        return this.progess(globalRef).then(() => this.postProcess(globalRef))
    });
};

WebpackAppendFilesPlugin.prototype.progess = function (globalRef) {
    return new Promise((resolve, reject) => {
        const queue = new PQueue({ concurrency: 1 });
        const { context, outputTempPath } = globalRef;

        this.files.forEach(filepath => {
            queue.add(() => new Promise((resolve, reject) => {
                const p = path.resolve(context, filepath);
                const readStream = fs.createReadStream(p);
                const writeStream = fs.createWriteStream(outputTempPath, { flags: 'a' });
                writeStream
                    .on('error', reject)
                    .on('finish', resolve);
                readStream
                    .on('error', reject)
                    .pipe(writeStream);
            }));
        });

        queue
            .onIdle()
            .then(resolve)
            .catch(reject);
    });
};

WebpackAppendFilesPlugin.prototype.postProcess = function (globalRef) {
    return new Promise((resolve, reject) => {
        const { context, outputPath, outputTempPath } = globalRef;

        readFile(outputTempPath)
            .then(content => {
                const filename = loaderUtils.interpolateName(
                    { resourcePath: outputTempPath },
                    this.filename,
                    {
                        context,
                        content,
                    }
                );
                const outputFilePath = path.resolve(outputPath, filename);
                writeFile(outputFilePath, content)
                    .then(() => unlink(outputTempPath).then(resolve).catch(reject))
                    .catch(reject);
            })
            .catch(reject);
    });
};

module.exports = WebpackAppendFilesPlugin;
