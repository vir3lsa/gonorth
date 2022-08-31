const path = require("path");
const webpack = require("webpack");

module.exports = (env) => ({
  mode: "development",
  context: __dirname,
  devServer: {
    static: {
      directory: __dirname
    },
    allowedHosts: "all"
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      DEBUG_MODE: JSON.stringify((env && env.DEBUG_MODE) || false),
      UI_TEST_MODE: JSON.stringify((env && env.UI_TEST_MODE) || false),
      USER_TEST_MODE: JSON.stringify((env && env.USER_TEST_MODE) || false)
    })
  ]
});
