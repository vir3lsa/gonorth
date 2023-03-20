const { defineConfig } = require("cypress");
import webpackConfig from "./examples/white_room/webpack.config";

module.exports = defineConfig({
  projectId: "ryv1fy",

  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    video: false,
    experimentalRunAllSpecs: true
  }
});
