"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require('path');
module.exports = {
    target: 'node', // Extensions run in Node.js
    mode: 'none', // Use 'production' for minification later
    entry: {
        extension: './src/extension.ts' // Your main entry point
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '..[resource-path]'
    },
    externals: {
        vscode: 'commonjs vscode' // Important: Do NOT bundle the 'vscode' module
    },
    resolve: {
        extensions: ['.ts', '.js'],
        symlinks: false // Disable symlink resolution to preserve module structure
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{ loader: 'ts-loader' }]
            }
        ]
    },
    devtool: 'source-map'
};
//# sourceMappingURL=webpack.config.js.map