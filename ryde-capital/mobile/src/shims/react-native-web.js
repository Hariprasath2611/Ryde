const ReactNativeWeb = require('react-native-web');

function codegenNativeComponent(name) {
  return name;
}

function codegenNativeCommands(options) {
  const commands = {};
  if (options && options.supportedCommands) {
    options.supportedCommands.forEach((cmd) => {
      commands[cmd] = () => {};
    });
  }
  return commands;
}

module.exports = {
  ...ReactNativeWeb,
  codegenNativeComponent,
  codegenNativeCommands,
};

// Also support ES module named exports
Object.defineProperty(module.exports, '__esModule', { value: true });
module.exports.default = module.exports;
module.exports.codegenNativeComponent = codegenNativeComponent;
module.exports.codegenNativeCommands = codegenNativeCommands;
