const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  context: __dirname,
  output: {
    path: path.resolve(__dirname, "dist-server")
  },
  target: "node",
  plugins: [
    new webpack.ProvidePlugin({
      prompts: "prompts"
    })
  ]
};
