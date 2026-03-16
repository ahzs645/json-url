"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _engine = require("./engine");
var createClient = Object.assign(function createClient(algorithm) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return (0, _engine.createNamedCodec)(algorithm, options);
}, {
  availableCodecs: _engine.AVAILABLE_CODECS,
  createEngine: _engine.createEngine,
  createNamedCodec: _engine.createNamedCodec
});
var _default = exports["default"] = createClient;
module.exports = exports.default;