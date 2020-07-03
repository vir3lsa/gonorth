module.exports = {
  presets: [
    [
      "@babel/preset-react",
      {
        targets: {
          node: "current"
        }
      }
    ],
    [
      "@babel/preset-env",
      {
        targets: {
          node: "10"
        }
      }
    ]
  ],
  plugins: ["@babel/plugin-proposal-optional-chaining"]
};
