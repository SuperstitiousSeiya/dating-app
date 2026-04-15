/** @type {import("eslint").Linter.Config} */
module.exports = {
  ...require("./index.js"),
  env: { "react-native/react-native": true },
  plugins: [...(require("./index.js").plugins ?? []), "react-native"],
  rules: {
    ...require("./index.js").rules,
    "react-native/no-unused-styles": "error",
    "react-native/no-inline-styles": "warn",
  },
};
