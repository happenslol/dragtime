const webpack = require('webpack')
const path = require('path')

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')

module.exports = {
    mode: 'development',
    entry: {
        'dist/dragtime': './src/index.ts',
        'dist/dragtime.min': './src/index.ts',
        'examples/examples.ts': './src/examples/examples.ts'
    },
    output: {
        path: path.resolve(__dirname),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: 'dragtime',
        umdNamedDefine: true
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devtool: 'source-map',
    plugins: [
        new UglifyJsPlugin({
            sourceMap: true,
            include: /\.min\.js$/,
        }),
        new HtmlWebpackPlugin({
            template: './src/examples/index.html',
            filename: './examples/index.html',
            hash: false,
            inject: true,
            compile: true,
            favicon: false,
            minify: false,
            cache: true,
            showErrors: true,
            title: 'examples',
            xhtml: true,
            alwaysWriteToDisk: true
        }),
        new HtmlWebpackHarddiskPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'raw-loader'
            },
            {
                test: /\.tsx?$/,
                loader: 'ts-loader'
            }
        ]
    },
    devServer: {
        contentBase: path.join(__dirname, 'examples'),
        watchContentBase: true,
        compress: false,
        port: 3000,
        host: '0.0.0.0'
    }
}

