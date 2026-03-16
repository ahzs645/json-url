"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compressTextWithStreamCodec = compressTextWithStreamCodec;
exports.createUnsupportedCodecError = createUnsupportedCodecError;
exports.decompressTextWithStreamCodec = decompressTextWithStreamCodec;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _loaders = _interopRequireDefault(require("../loaders"));
function createUnsupportedCodecError(codecId, message, cause) {
  var error = new Error(message);
  error.code = 'ERR_UNSUPPORTED_CODEC';
  error.codec = codecId;
  if (cause) {
    error.cause = cause;
  }
  return error;
}
function compressWithStreams(_x, _x2) {
  return _compressWithStreams.apply(this, arguments);
}
function _compressWithStreams() {
  _compressWithStreams = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee(input, format) {
    var stream, buffer, _t;
    return _regenerator["default"].wrap(function (_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          if (!(typeof CompressionStream === 'undefined' || typeof Blob === 'undefined' || typeof Response === 'undefined')) {
            _context.next = 1;
            break;
          }
          return _context.abrupt("return", null);
        case 1:
          _context.prev = 1;
          stream = new Blob([input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)]).stream().pipeThrough(new CompressionStream(format));
          _context.next = 2;
          return new Response(stream).arrayBuffer();
        case 2:
          buffer = _context.sent;
          return _context.abrupt("return", Buffer.from(buffer));
        case 3:
          _context.prev = 3;
          _t = _context["catch"](1);
          return _context.abrupt("return", null);
        case 4:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[1, 3]]);
  }));
  return _compressWithStreams.apply(this, arguments);
}
function decompressWithStreams(_x3, _x4) {
  return _decompressWithStreams.apply(this, arguments);
}
function _decompressWithStreams() {
  _decompressWithStreams = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2(input, format) {
    var stream, buffer, _t2;
    return _regenerator["default"].wrap(function (_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          if (!(typeof DecompressionStream === 'undefined' || typeof Blob === 'undefined' || typeof Response === 'undefined')) {
            _context2.next = 1;
            break;
          }
          return _context2.abrupt("return", null);
        case 1:
          _context2.prev = 1;
          stream = new Blob([input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)]).stream().pipeThrough(new DecompressionStream(format));
          _context2.next = 2;
          return new Response(stream).arrayBuffer();
        case 2:
          buffer = _context2.sent;
          return _context2.abrupt("return", Buffer.from(buffer));
        case 3:
          _context2.prev = 3;
          _t2 = _context2["catch"](1);
          return _context2.abrupt("return", null);
        case 4:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[1, 3]]);
  }));
  return _decompressWithStreams.apply(this, arguments);
}
function compressWithNodeZlib(input, format, zlib) {
  switch (format) {
    case 'gzip':
      return Buffer.from(zlib.gzipSync(input));
    case 'deflate-raw':
      return Buffer.from(zlib.deflateRawSync(input));
    case 'brotli':
      if (typeof zlib.brotliCompressSync !== 'function') return null;
      return Buffer.from(zlib.brotliCompressSync(input));
    default:
      return null;
  }
}
function decompressWithNodeZlib(input, format, zlib) {
  switch (format) {
    case 'gzip':
      return Buffer.from(zlib.gunzipSync(input));
    case 'deflate-raw':
      return Buffer.from(zlib.inflateRawSync(input));
    case 'brotli':
      if (typeof zlib.brotliDecompressSync !== 'function') return null;
      return Buffer.from(zlib.brotliDecompressSync(input));
    default:
      return null;
  }
}
function compressTextWithStreamCodec(_x5, _x6, _x7) {
  return _compressTextWithStreamCodec.apply(this, arguments);
}
function _compressTextWithStreamCodec() {
  _compressTextWithStreamCodec = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3(string, format, codecId) {
    var input, streamResult, zlib, fallbackResult;
    return _regenerator["default"].wrap(function (_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          input = Buffer.from(string, 'utf8');
          _context3.next = 1;
          return compressWithStreams(input, format);
        case 1:
          streamResult = _context3.sent;
          if (!streamResult) {
            _context3.next = 2;
            break;
          }
          return _context3.abrupt("return", streamResult);
        case 2:
          _context3.next = 3;
          return _loaders["default"].zlib();
        case 3:
          zlib = _context3.sent;
          if (!zlib) {
            _context3.next = 4;
            break;
          }
          fallbackResult = compressWithNodeZlib(input, format, zlib);
          if (!fallbackResult) {
            _context3.next = 4;
            break;
          }
          return _context3.abrupt("return", fallbackResult);
        case 4:
          throw createUnsupportedCodecError(codecId, "Codec \"".concat(codecId, "\" is not supported in this environment."));
        case 5:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return _compressTextWithStreamCodec.apply(this, arguments);
}
function decompressTextWithStreamCodec(_x8, _x9, _x0) {
  return _decompressTextWithStreamCodec.apply(this, arguments);
}
function _decompressTextWithStreamCodec() {
  _decompressTextWithStreamCodec = (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4(buffer, format, codecId) {
    var input, streamResult, zlib, fallbackResult;
    return _regenerator["default"].wrap(function (_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          input = Buffer.from(buffer);
          _context4.next = 1;
          return decompressWithStreams(input, format);
        case 1:
          streamResult = _context4.sent;
          if (!streamResult) {
            _context4.next = 2;
            break;
          }
          return _context4.abrupt("return", streamResult.toString('utf8'));
        case 2:
          _context4.next = 3;
          return _loaders["default"].zlib();
        case 3:
          zlib = _context4.sent;
          if (!zlib) {
            _context4.next = 4;
            break;
          }
          fallbackResult = decompressWithNodeZlib(input, format, zlib);
          if (!fallbackResult) {
            _context4.next = 4;
            break;
          }
          return _context4.abrupt("return", fallbackResult.toString('utf8'));
        case 4:
          throw createUnsupportedCodecError(codecId, "Codec \"".concat(codecId, "\" cannot be decoded in this environment."));
        case 5:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return _decompressTextWithStreamCodec.apply(this, arguments);
}