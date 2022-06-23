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
  output: {
    path: path.resolve(__dirname, "dist-web")
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
  plugins: [new webpack.DefinePlugin({ UI_TEST_MODE: JSON.stringify((env && env.UI_TEST_MODE) || false) })]
});
