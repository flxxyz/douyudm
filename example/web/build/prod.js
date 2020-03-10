const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    mode: 'production',
    // devtool: 'eval',
    optimization: {
        minimizer: [
            new UglifyJSPlugin({
                uglifyOptions: {
                    mangle: false,
                    output: {
                        ascii_only: true,
                        beautify: false,
                    },
                    compress: {
                        drop_debugger: false,
                        drop_console: true,
                    },
                }
            })
        ]
    },
}