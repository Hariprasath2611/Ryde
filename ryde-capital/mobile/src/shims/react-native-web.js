const ReactNativeWeb = require('react-native-web');

module.exports = {
  ...ReactNativeWeb,
  codegenNativeComponent: function (name) {
    return name;
  },
};

// Also support ES module named exports
Object.defineProperty(module.exports, '__esModule', { value: true });
module.exports.default = module.exports;
module.exports.codegenNativeComponent = function (name) {
  return name;
};
