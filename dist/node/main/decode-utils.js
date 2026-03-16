"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanEncodedInput = cleanEncodedInput;
exports.normalizeDecodeOptions = normalizeDecodeOptions;
exports.prepareEncodedInput = prepareEncodedInput;
var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));
function cleanEncodedInput(str) {
  var out = '';
  var i = 0;
  var j = 0;
  var codePoint;
  while (i < str.length) {
    codePoint = str.charCodeAt(i);
    if (codePoint === 37) {
      if (i > j) out += str.slice(j, i);
      str = decodeURIComponent(str.slice(i));
      i = 0;
      j = 0;
    } else if (codePoint === 32 || codePoint === 10 || codePoint === 13 || codePoint === 0 || codePoint === 8232 || codePoint === 8233) {
      if (i > j) out += str.slice(j, i);
      i += 1;
      j = i;
    } else {
      i += 1;
    }
  }
  if (i > j) out += str.slice(j, i);
  return out;
}
function normalizeDecodeOptions() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  if (!options || (0, _typeof2["default"])(options) !== 'object' || Array.isArray(options)) {
    throw new Error('Expected decode options to be an object');
  }
  return {
    deURI: options.deURI === true
  };
}
function prepareEncodedInput(input) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (typeof input !== 'string') {
    throw new Error('Expected encoded input to be a string');
  }
  var _normalizeDecodeOptio = normalizeDecodeOptions(options),
    deURI = _normalizeDecodeOptio.deURI;
  return deURI ? cleanEncodedInput(input) : input;
}