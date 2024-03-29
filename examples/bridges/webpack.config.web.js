const path = require("path");

module.exports = {
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
  resolve: {
    alias: {
      "@gonorth$": path.resolve(__dirname, "../../lib/gonorth.js")
    }
  }
};
