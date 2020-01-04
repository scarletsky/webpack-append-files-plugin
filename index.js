const fs = require('fs');
const path = require('path');
const { default: PQueue } = require('p-queue');

const id = 'WebpackAppendFilesPlugin';

function WebpackAppendFilesPlugin(options) {
    if (options === undefined) {
        options = {};
    }

    if (!options.filename) {
        throw new Error(`[${id}]: missing filename.`);
    }

    this.filename = options.filename;
    this.files = options.files || [];
}

WebpackAppendFilesPlugin.prototype.apply = function (compiler) {

    const { context, output } = compiler.options;
    const outputPath = output.path;
    const globalRef = {
        context,
        outputPath,
    };

    compiler.hooks.afterEmit.tapPromise(id, (compilation) => {
        return this.progess(globalRef).then(() => this.postProcess(globalRef))
    });
};

WebpackAppendFilesPlugin.prototype.progess = function (globalRef) {
    return new Promise((resolve, reject) => {
        const queue = new PQueue({ concurrency: 1 });
        const { context, outputPath } = globalRef;

        this.files.forEach(filepath => {
            queue.add(() => new Promise((resolve, reject) => {
                const p = path.resolve(context, filepath);
                const readStream = fs.createReadStream(p);
                const writeStream = fs.createWriteStream(
                    path.resolve(outputPath, this.filename),
                    { flags: 'a' }
                );
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
    return Promise.resolve();
};

module.exports = WebpackAppendFilesPlugin;
