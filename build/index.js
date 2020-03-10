const path = require('path')
const {
    CleanWebpackPlugin
} = require('clean-webpack-plugin')

const config = {
    entry: {
        douyudanmu: path.resolve(__dirname, '..', 'src/index.js'),
    },
    output: {
        path: path.resolve(__dirname, '..', 'dist'),
        filename: '[name].min.js'
    },
    plugins: [
        new CleanWebpackPlugin(),
    ],
    module: {
        rules: [{
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    plugins: [
                        // "@babel/transform-runtime",
                        "@babel/plugin-transform-runtime",
                    ]
                },
            },
        }]
    },
}



module.exports = function (argv) {
    if (argv === 'dev') {
        config.output.filename = '[name].js'
        return Object.assign({}, config, require('./dev'))
    } else {
        return Object.assign({}, config, require('./prod'))
    }
}