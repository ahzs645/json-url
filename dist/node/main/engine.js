"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_WEB_SHARE_VERSION = exports.DEFAULT_WEB_SHARE_MAX_LENGTH = exports.DEFAULT_WEB_SHARE_CODECS = exports.AVAILABLE_CODECS = void 0;
exports.createEngine = createEngine;
exports.createNamedCodec = createNamedCodec;
exports.createWebShareEngine = createWebShareEngine;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));
var _codecs = _interopRequireDefault(require("./codecs"));
var _loaders = _interopRequireDefault(require("./loaders"));
var _streamCodec = require("./codecs/stream-codec");
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var AVAILABLE_CODECS = exports.AVAILABLE_CODECS = Object.freeze(Object.keys(_codecs["default"]));
var DEFAULT_WEB_SHARE_CODECS = exports.DEFAULT_WEB_SHARE_CODECS = Object.freeze(['raw', 'gz', 'df', 'br', 'lz']);
var DEFAULT_WEB_SHARE_VERSION = exports.DEFAULT_WEB_SHARE_VERSION = '1';
var DEFAULT_WEB_SHARE_MAX_LENGTH = exports.DEFAULT_WEB_SHARE_MAX_LENGTH = 12000;
function twoDigitPercentage(val) {
  return Math.floor(val * 10000) / 10000;
}
function isObject(value) {
  return Boolean(value) && (0, _typeof2["default"])(value) === 'object' && !Array.isArray(value);
}
function normalizeCodecId(id) {
  var label = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'codec';
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error("Expected ".concat(label, " to have a non-empty string id"));
  }
  var normalized = id.trim();
  if (normalized.includes('.')) {
    throw new Error("Expected ".concat(label, " id to not contain \".\""));
  }
  return normalized;
}
function normalizeTransforms() {
  var transforms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  if (!transforms) return [];
  if (!Array.isArray(transforms)) {
    throw new Error('Expected transforms to be an array');
  }
  return transforms.map(function (transform, index) {
    if (!isObject(transform)) {
      throw new Error("Transform at index ".concat(index, " must be an object"));
    }
    if (typeof transform.encode !== 'function' && typeof transform.decode !== 'function') {
      throw new Error("Transform at index ".concat(index, " must provide encode or decode"));
    }
    return {
      id: typeof transform.id === 'string' && transform.id.trim() ? transform.id.trim() : "transform_".concat(index + 1),
      encode: transform.encode,
      decode: transform.decode
    };
  });
}
function applyTransforms(_x, _x2, _x3) {
  return _applyTransforms.apply(this, arguments);
}
function _applyTransforms() {
  _applyTransforms = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee0(value, transforms, direction) {
    var ordered, next, _iterator2, _step2, transform, handler, _t3;
    return _regenerator["default"].wrap(function (_context0) {
      while (1) switch (_context0.prev = _context0.next) {
        case 0:
          ordered = direction === 'encode' ? transforms : (0, _toConsumableArray2["default"])(transforms).reverse();
          next = value;
          _iterator2 = _createForOfIteratorHelper(ordered);
          _context0.prev = 1;
          _iterator2.s();
        case 2:
          if ((_step2 = _iterator2.n()).done) {
            _context0.next = 6;
            break;
          }
          transform = _step2.value;
          handler = direction === 'encode' ? transform.encode : transform.decode;
          if (!(typeof handler !== 'function')) {
            _context0.next = 3;
            break;
          }
          return _context0.abrupt("continue", 5);
        case 3:
          _context0.next = 4;
          return handler(next);
        case 4:
          next = _context0.sent;
        case 5:
          _context0.next = 2;
          break;
        case 6:
          _context0.next = 8;
          break;
        case 7:
          _context0.prev = 7;
          _t3 = _context0["catch"](1);
          _iterator2.e(_t3);
        case 8:
          _context0.prev = 8;
          _iterator2.f();
          return _context0.finish(8);
        case 9:
          return _context0.abrupt("return", next);
        case 10:
        case "end":
          return _context0.stop();
      }
    }, _callee0, null, [[1, 7, 8, 9]]);
  }));
  return _applyTransforms.apply(this, arguments);
}
function serializeValue(_x4, _x5) {
  return _serializeValue.apply(this, arguments);
}
function _serializeValue() {
  _serializeValue = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee1(value, config) {
    var msgpack;
    return _regenerator["default"].wrap(function (_context1) {
      while (1) switch (_context1.prev = _context1.next) {
        case 0:
          if (config.pack) {
            _context1.next = 1;
            break;
          }
          return _context1.abrupt("return", JSON.stringify(value));
        case 1:
          _context1.next = 2;
          return _loaders["default"].msgpack();
        case 2:
          msgpack = _context1.sent;
          return _context1.abrupt("return", msgpack.encode(value));
        case 3:
        case "end":
          return _context1.stop();
      }
    }, _callee1);
  }));
  return _serializeValue.apply(this, arguments);
}
function deserializeValue(_x6, _x7) {
  return _deserializeValue.apply(this, arguments);
}
function _deserializeValue() {
  _deserializeValue = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee10(value, config) {
    var msgpack;
    return _regenerator["default"].wrap(function (_context10) {
      while (1) switch (_context10.prev = _context10.next) {
        case 0:
          if (config.pack) {
            _context10.next = 1;
            break;
          }
          return _context10.abrupt("return", JSON.parse(value));
        case 1:
          _context10.next = 2;
          return _loaders["default"].msgpack();
        case 2:
          msgpack = _context10.sent;
          return _context10.abrupt("return", msgpack.decode(value));
        case 3:
        case "end":
          return _context10.stop();
      }
    }, _callee10);
  }));
  return _deserializeValue.apply(this, arguments);
}
function encodeCompressedValue(_x8, _x9) {
  return _encodeCompressedValue.apply(this, arguments);
}
function _encodeCompressedValue() {
  _encodeCompressedValue = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee11(value, config) {
    var safe64;
    return _regenerator["default"].wrap(function (_context11) {
      while (1) switch (_context11.prev = _context11.next) {
        case 0:
          if (config.encode) {
            _context11.next = 1;
            break;
          }
          return _context11.abrupt("return", value);
        case 1:
          _context11.next = 2;
          return _loaders["default"].safe64();
        case 2:
          safe64 = _context11.sent;
          return _context11.abrupt("return", safe64.encode(value));
        case 3:
        case "end":
          return _context11.stop();
      }
    }, _callee11);
  }));
  return _encodeCompressedValue.apply(this, arguments);
}
function decodeCompressedValue(_x0, _x1) {
  return _decodeCompressedValue.apply(this, arguments);
}
function _decodeCompressedValue() {
  _decodeCompressedValue = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee12(value, config) {
    var safe64;
    return _regenerator["default"].wrap(function (_context12) {
      while (1) switch (_context12.prev = _context12.next) {
        case 0:
          if (config.encode) {
            _context12.next = 1;
            break;
          }
          return _context12.abrupt("return", value);
        case 1:
          _context12.next = 2;
          return _loaders["default"].safe64();
        case 2:
          safe64 = _context12.sent;
          return _context12.abrupt("return", safe64.decode(value));
        case 3:
        case "end":
          return _context12.stop();
      }
    }, _callee12);
  }));
  return _decodeCompressedValue.apply(this, arguments);
}
function getAlgorithmConfig(algorithm) {
  var codecId = normalizeCodecId(algorithm, 'algorithm');
  if (!Object.prototype.hasOwnProperty.call(_codecs["default"], codecId)) {
    throw new Error("No such algorithm ".concat(codecId));
  }
  return {
    id: codecId,
    config: _codecs["default"][codecId]
  };
}
function buildToken(version, codecId, payload) {
  return "".concat(version, ".").concat(codecId, ".").concat(payload);
}
function parseToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Expected token to be a non-empty string');
  }
  var trimmed = token.trim();
  var firstDot = trimmed.indexOf('.');
  var secondDot = trimmed.indexOf('.', firstDot + 1);
  if (firstDot <= 0 || secondDot <= firstDot + 1) {
    return null;
  }
  return {
    version: trimmed.slice(0, firstDot),
    codecId: trimmed.slice(firstDot + 1, secondDot),
    payload: trimmed.slice(secondDot + 1)
  };
}
function normalizeMaxLength(maxLength) {
  if (typeof maxLength === 'undefined' || maxLength === null) {
    return Infinity;
  }
  if (typeof maxLength !== 'number' || !Number.isFinite(maxLength) || maxLength <= 0) {
    throw new Error('Expected maxLength to be a positive finite number');
  }
  return Math.floor(maxLength);
}
function createStats(_ref) {
  var rawText = _ref.rawText,
    transformedText = _ref.transformedText,
    tokenLength = _ref.tokenLength,
    codecId = _ref.codecId,
    token = _ref.token,
    candidates = _ref.candidates;
  var rawencoded = encodeURIComponent(rawText).length;
  var transformedencoded = encodeURIComponent(transformedText).length;
  return {
    codec: codecId,
    token: token,
    raw: rawText.length,
    rawencoded: rawencoded,
    transformed: transformedText.length,
    transformedencoded: transformedencoded,
    compressedencoded: tokenLength,
    compression: twoDigitPercentage(rawencoded / tokenLength),
    candidates: candidates
  };
}
function normalizeCodecSpec(codec, index) {
  if (typeof codec === 'string') {
    var client = createNamedCodec(codec);
    return {
      id: client.id,
      client: client
    };
  }
  if (!isObject(codec)) {
    throw new Error("Codec at index ".concat(index, " must be a string or codec object"));
  }
  var codecId = normalizeCodecId(codec.id, "codec at index ".concat(index));
  if (typeof codec.compress !== 'function' || typeof codec.decompress !== 'function') {
    throw new Error("Codec \"".concat(codecId, "\" must provide compress and decompress"));
  }
  return {
    id: codecId,
    client: codec
  };
}
function isUnsupportedCodecError(error) {
  return Boolean(error) && error.code === 'ERR_UNSUPPORTED_CODEC';
}
function createNamedCodec(algorithm) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var transforms = normalizeTransforms(options.transforms);
  var _getAlgorithmConfig = getAlgorithmConfig(algorithm),
    id = _getAlgorithmConfig.id,
    config = _getAlgorithmConfig.config;
  function prepareInput(_x10) {
    return _prepareInput.apply(this, arguments);
  }
  function _prepareInput() {
    _prepareInput = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(json) {
      var transformed;
      return _regenerator["default"].wrap(function (_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.next = 1;
            return applyTransforms(json, transforms, 'encode');
          case 1:
            transformed = _context.sent;
            return _context.abrupt("return", {
              transformed: transformed,
              transformedText: JSON.stringify(transformed)
            });
          case 2:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    return _prepareInput.apply(this, arguments);
  }
  function compress(_x11) {
    return _compress.apply(this, arguments);
  }
  function _compress() {
    _compress = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(json) {
      var _yield$prepareInput, transformed, packed, compressed;
      return _regenerator["default"].wrap(function (_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 1;
            return prepareInput(json);
          case 1:
            _yield$prepareInput = _context2.sent;
            transformed = _yield$prepareInput.transformed;
            _context2.next = 2;
            return serializeValue(transformed, config);
          case 2:
            packed = _context2.sent;
            _context2.next = 3;
            return config.compress(packed);
          case 3:
            compressed = _context2.sent;
            return _context2.abrupt("return", encodeCompressedValue(compressed, config));
          case 4:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }));
    return _compress.apply(this, arguments);
  }
  function decompress(_x12) {
    return _decompress.apply(this, arguments);
  }
  function _decompress() {
    _decompress = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3(string) {
      var decoded, decompressed, unpacked;
      return _regenerator["default"].wrap(function (_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 1;
            return decodeCompressedValue(string, config);
          case 1:
            decoded = _context3.sent;
            _context3.next = 2;
            return config.decompress(decoded);
          case 2:
            decompressed = _context3.sent;
            _context3.next = 3;
            return deserializeValue(decompressed, config);
          case 3:
            unpacked = _context3.sent;
            return _context3.abrupt("return", applyTransforms(unpacked, transforms, 'decode'));
          case 4:
          case "end":
            return _context3.stop();
        }
      }, _callee3);
    }));
    return _decompress.apply(this, arguments);
  }
  function stats(_x13) {
    return _stats.apply(this, arguments);
  }
  function _stats() {
    _stats = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(json) {
      var rawText, _yield$prepareInput2, transformedText, token;
      return _regenerator["default"].wrap(function (_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            rawText = JSON.stringify(json);
            _context4.next = 1;
            return prepareInput(json);
          case 1:
            _yield$prepareInput2 = _context4.sent;
            transformedText = _yield$prepareInput2.transformedText;
            _context4.next = 2;
            return compress(json);
          case 2:
            token = _context4.sent;
            return _context4.abrupt("return", _objectSpread(_objectSpread({}, createStats({
              rawText: rawText,
              transformedText: transformedText,
              tokenLength: token.length,
              codecId: id,
              token: token
            })), {}, {
              algorithm: id,
              transforms: transforms.map(function (transform) {
                return transform.id;
              })
            }));
          case 3:
          case "end":
            return _context4.stop();
        }
      }, _callee4);
    }));
    return _stats.apply(this, arguments);
  }
  return {
    id: id,
    compress: compress,
    decompress: decompress,
    stats: stats,
    transforms: transforms.map(function (transform) {
      return transform.id;
    })
  };
}
function createEngine() {
  var _codecEntries$;
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var transforms = normalizeTransforms(options.transforms);
  var codecSpecs = Array.isArray(options.codecs) && options.codecs.length > 0 ? options.codecs : AVAILABLE_CODECS;
  var codecEntries = codecSpecs.map(function (codec, index) {
    return normalizeCodecSpec(codec, index);
  });
  var codecMap = new Map();
  var maxLength = normalizeMaxLength(options.maxLength);
  var version = typeof options.version === 'undefined' ? '1' : normalizeCodecId(String(options.version), 'version');
  var skipUnsupportedCodecs = options.skipUnsupportedCodecs === true;
  var alwaysPrefix = typeof options.alwaysPrefix === 'boolean' ? options.alwaysPrefix : codecEntries.length !== 1;
  var defaultCodec = typeof options.defaultCodec === 'undefined' ? (_codecEntries$ = codecEntries[0]) === null || _codecEntries$ === void 0 ? void 0 : _codecEntries$.id : normalizeCodecId(options.defaultCodec, 'default codec');
  codecEntries.forEach(function (entry) {
    if (codecMap.has(entry.id)) {
      throw new Error("Duplicate codec id \"".concat(entry.id, "\""));
    }
    codecMap.set(entry.id, entry);
  });
  if (!defaultCodec || !codecMap.has(defaultCodec)) {
    throw new Error("Unknown default codec \"".concat(defaultCodec, "\""));
  }
  function prepareInput(_x14) {
    return _prepareInput2.apply(this, arguments);
  }
  function _prepareInput2() {
    _prepareInput2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee5(json) {
      var transformed;
      return _regenerator["default"].wrap(function (_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 1;
            return applyTransforms(json, transforms, 'encode');
          case 1:
            transformed = _context5.sent;
            return _context5.abrupt("return", {
              rawText: JSON.stringify(json),
              transformed: transformed,
              transformedText: JSON.stringify(transformed)
            });
          case 2:
          case "end":
            return _context5.stop();
        }
      }, _callee5);
    }));
    return _prepareInput2.apply(this, arguments);
  }
  function compressDetailed(_x15) {
    return _compressDetailed.apply(this, arguments);
  }
  function _compressDetailed() {
    _compressDetailed = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee6(json) {
      var _yield$prepareInput3, rawText, transformed, transformedText, rawencoded, transformedencoded, candidates, skipped, _iterator, _step, entry, payload, token, best, _t, _t2;
      return _regenerator["default"].wrap(function (_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 1;
            return prepareInput(json);
          case 1:
            _yield$prepareInput3 = _context6.sent;
            rawText = _yield$prepareInput3.rawText;
            transformed = _yield$prepareInput3.transformed;
            transformedText = _yield$prepareInput3.transformedText;
            rawencoded = encodeURIComponent(rawText).length;
            transformedencoded = encodeURIComponent(transformedText).length;
            candidates = [];
            skipped = [];
            _iterator = _createForOfIteratorHelper(codecEntries);
            _context6.prev = 2;
            _iterator.s();
          case 3:
            if ((_step = _iterator.n()).done) {
              _context6.next = 10;
              break;
            }
            entry = _step.value;
            _context6.prev = 4;
            _context6.next = 5;
            return entry.client.compress(transformed);
          case 5:
            payload = _context6.sent;
            if (!(typeof payload !== 'string')) {
              _context6.next = 6;
              break;
            }
            throw new Error("Codec \"".concat(entry.id, "\" returned a non-string token"));
          case 6:
            token = alwaysPrefix ? buildToken(version, entry.id, payload) : payload;
            candidates.push({
              codec: entry.id,
              token: token,
              tokenLength: token.length,
              payloadLength: payload.length,
              raw: rawText.length,
              rawencoded: rawencoded,
              transformed: transformedText.length,
              transformedencoded: transformedencoded,
              compression: twoDigitPercentage(rawencoded / token.length)
            });
            _context6.next = 9;
            break;
          case 7:
            _context6.prev = 7;
            _t = _context6["catch"](4);
            if (!(!skipUnsupportedCodecs || !isUnsupportedCodecError(_t))) {
              _context6.next = 8;
              break;
            }
            throw _t;
          case 8:
            skipped.push({
              codec: entry.id,
              reason: _t.message
            });
          case 9:
            _context6.next = 3;
            break;
          case 10:
            _context6.next = 12;
            break;
          case 11:
            _context6.prev = 11;
            _t2 = _context6["catch"](2);
            _iterator.e(_t2);
          case 12:
            _context6.prev = 12;
            _iterator.f();
            return _context6.finish(12);
          case 13:
            if (!(candidates.length === 0)) {
              _context6.next = 15;
              break;
            }
            if (!(skipped.length > 0)) {
              _context6.next = 14;
              break;
            }
            throw (0, _streamCodec.createUnsupportedCodecError)('engine', "None of the configured codecs are supported in this environment: ".concat(skipped.map(function (entry) {
              return entry.codec;
            }).join(', ')));
          case 14:
            throw new Error('No codec candidates were produced');
          case 15:
            candidates.sort(function (a, b) {
              return a.tokenLength - b.tokenLength;
            });
            best = candidates[0];
            if (!(best.tokenLength > maxLength)) {
              _context6.next = 16;
              break;
            }
            throw new Error("Encoded token exceeds maxLength (".concat(best.tokenLength, " > ").concat(maxLength, ")"));
          case 16:
            return _context6.abrupt("return", {
              codec: best.codec,
              token: best.token,
              raw: rawText.length,
              rawencoded: rawencoded,
              transformed: transformedText.length,
              transformedencoded: transformedencoded,
              compressedencoded: best.tokenLength,
              compression: best.compression,
              candidates: candidates,
              skipped: skipped
            });
          case 17:
          case "end":
            return _context6.stop();
        }
      }, _callee6, null, [[2, 11, 12, 13], [4, 7]]);
    }));
    return _compressDetailed.apply(this, arguments);
  }
  function compress(_x16) {
    return _compress2.apply(this, arguments);
  }
  function _compress2() {
    _compress2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee7(json) {
      var result;
      return _regenerator["default"].wrap(function (_context7) {
        while (1) switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 1;
            return compressDetailed(json);
          case 1:
            result = _context7.sent;
            return _context7.abrupt("return", result.token);
          case 2:
          case "end":
            return _context7.stop();
        }
      }, _callee7);
    }));
    return _compress2.apply(this, arguments);
  }
  function decompress(_x17) {
    return _decompress2.apply(this, arguments);
  }
  function _decompress2() {
    _decompress2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee8(token) {
      var parsed, _decoded, decoded;
      return _regenerator["default"].wrap(function (_context8) {
        while (1) switch (_context8.prev = _context8.next) {
          case 0:
            parsed = parseToken(token);
            if (!(parsed && parsed.version === version && codecMap.has(parsed.codecId))) {
              _context8.next = 2;
              break;
            }
            _context8.next = 1;
            return codecMap.get(parsed.codecId).client.decompress(parsed.payload);
          case 1:
            _decoded = _context8.sent;
            return _context8.abrupt("return", applyTransforms(_decoded, transforms, 'decode'));
          case 2:
            if (!(parsed && (alwaysPrefix || codecEntries.length > 1))) {
              _context8.next = 4;
              break;
            }
            if (!(parsed.version !== version)) {
              _context8.next = 3;
              break;
            }
            throw new Error("Unsupported token version ".concat(parsed.version));
          case 3:
            throw new Error("Unsupported codec ".concat(parsed.codecId));
          case 4:
            if (!(alwaysPrefix || codecEntries.length > 1)) {
              _context8.next = 5;
              break;
            }
            throw new Error('Encoded token is missing a version/codec prefix');
          case 5:
            _context8.next = 6;
            return codecMap.get(defaultCodec).client.decompress(token);
          case 6:
            decoded = _context8.sent;
            return _context8.abrupt("return", applyTransforms(decoded, transforms, 'decode'));
          case 7:
          case "end":
            return _context8.stop();
        }
      }, _callee8);
    }));
    return _decompress2.apply(this, arguments);
  }
  function stats(_x18) {
    return _stats2.apply(this, arguments);
  }
  function _stats2() {
    _stats2 = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee9(json) {
      return _regenerator["default"].wrap(function (_context9) {
        while (1) switch (_context9.prev = _context9.next) {
          case 0:
            return _context9.abrupt("return", compressDetailed(json));
          case 1:
          case "end":
            return _context9.stop();
        }
      }, _callee9);
    }));
    return _stats2.apply(this, arguments);
  }
  return {
    version: version,
    codecs: codecEntries.map(function (entry) {
      return entry.id;
    }),
    transforms: transforms.map(function (transform) {
      return transform.id;
    }),
    skipUnsupportedCodecs: skipUnsupportedCodecs,
    compress: compress,
    compressBest: compressDetailed,
    compressDetailed: compressDetailed,
    decompress: decompress,
    stats: stats
  };
}
function createWebShareEngine() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var nextOptions = _objectSpread(_objectSpread({}, options), {}, {
    version: typeof options.version === 'undefined' ? DEFAULT_WEB_SHARE_VERSION : options.version,
    alwaysPrefix: typeof options.alwaysPrefix === 'undefined' ? true : options.alwaysPrefix,
    maxLength: typeof options.maxLength === 'undefined' ? DEFAULT_WEB_SHARE_MAX_LENGTH : options.maxLength,
    skipUnsupportedCodecs: typeof options.skipUnsupportedCodecs === 'undefined' ? true : options.skipUnsupportedCodecs,
    codecs: Array.isArray(options.codecs) && options.codecs.length > 0 ? options.codecs : DEFAULT_WEB_SHARE_CODECS
  });
  return createEngine(_objectSpread({}, nextOptions));
}