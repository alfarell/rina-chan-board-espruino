const webpack = require('webpack')

module.exports = {
  externals: {
    Wifi: 'commonjs Wifi',
    neopixel: 'commonjs neopixel',
  },
  optimization: {
    minimize: false,
  },
}
