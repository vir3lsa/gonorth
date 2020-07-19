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
  }
};
