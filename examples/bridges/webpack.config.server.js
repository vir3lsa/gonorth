const path = require("path");

module.exports = {
  mode: "development",
  context: __dirname,
  output: {
    path: path.resolve(__dirname, "dist-server")
  },
  target: "node"
};
