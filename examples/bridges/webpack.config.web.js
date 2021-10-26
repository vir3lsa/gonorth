const path = require("path");

module.exports = {
  mode: "development",
  context: __dirname,
  devServer: {
    contentBase: __dirname,
    disableHostCheck: true
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
  resolve: {
    alias: {
      "@gonorth$": path.resolve(__dirname, "../../lib/gonorth.js")
    }
  }
};
