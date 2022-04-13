const path = require("path");
const webpack = require("webpack");

module.exports = (env) => ({
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
  plugins: [
    new webpack.DefinePlugin({ SKIP_REACTION_TIMES: JSON.stringify((env && env.SKIP_REACTION_TIMES) || false) })
  ]
});
