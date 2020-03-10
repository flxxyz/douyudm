const path = require('path')
const {
    CleanWebpackPlugin
} = require('clean-webpack-plugin')

const config = {
    entry: {
        douyudanmu: path.resolve(__dirname, '..', 'index.js'),
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
                    ],
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                targets: {
                                    esmodules: true
                                }
                            }
                        ]
                    ],
                },
            },
        }]
    },
}



module.exports = function (argv) {
    if (argv === 'dev') {
        return Object.assign({}, config, require('./dev'))
    } else {
        return Object.assign({}, config, require('./prod'))
    }
}