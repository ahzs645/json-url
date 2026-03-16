"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t3 in e) "default" !== _t3 && {}.hasOwnProperty.call(e, _t3) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t3)) && (i.get || i.set) ? o(f, _t3, i) : f[_t3] = e[_t3]); return f; })(e, t); }
// centralize all chunks in one file
var _default = exports["default"] = {
  msgpack: function msgpack() {
    return (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee() {
      var module, factory;
      return _regenerator["default"].wrap(function (_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.next = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require(/* webpackChunkName: "msgpack" */'msgpack5'));
            });
          case 1:
            module = _context.sent;
            factory = module["default"] || module;
            return _context.abrupt("return", factory());
          case 2:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }))();
  },
  safe64: function safe64() {
    return (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee2() {
      var module;
      return _regenerator["default"].wrap(function (_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require(/* webpackChunkName: "safe64" */'urlsafe-base64'));
            });
          case 1:
            module = _context2.sent;
            return _context2.abrupt("return", module["default"] || module);
          case 2:
          case "end":
            return _context2.stop();
        }
      }, _callee2);
    }))();
  },
  lzma: function lzma() {
    return (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee3() {
      var lzma;
      return _regenerator["default"].wrap(function (_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require(/* webpackChunkName: "lzma" */'lzma'));
            });
          case 1:
            lzma = _context3.sent;
            return _context3.abrupt("return", lzma.compress ? lzma : lzma.LZMA);
          case 2:
          case "end":
            return _context3.stop();
        }
      }, _callee3);
    }))();
  },
  lzstring: function lzstring() {
    return (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee4() {
      var module;
      return _regenerator["default"].wrap(function (_context4) {
        while (1) switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require(/* webpackChunkName: "lzstring" */'lz-string'));
            });
          case 1:
            module = _context4.sent;
            return _context4.abrupt("return", module["default"] || module);
          case 2:
          case "end":
            return _context4.stop();
        }
      }, _callee4);
    }))();
  },
  lzw: function lzw() {
    return (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee5() {
      var module, lzw;
      return _regenerator["default"].wrap(function (_context5) {
        while (1) switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 1;
            return Promise.resolve().then(function () {
              return _interopRequireWildcard(require(/* webpackChunkName: "lzw" */'node-lzw'));
            });
          case 1:
            module = _context5.sent;
            lzw = module["default"] || module;
            return _context5.abrupt("return", lzw);
          case 2:
          case "end":
            return _context5.stop();
        }
      }, _callee5);
    }))();
  },
  zlib: function zlib() {
    return (0, _asyncToGenerator2["default"])(/*#__PURE__*/_regenerator["default"].mark(function _callee6() {
      var dynamicImport, module, dynamicRequire, requireFn, _t, _t2;
      return _regenerator["default"].wrap(function (_context6) {
        while (1) switch (_context6.prev = _context6.next) {
          case 0:
            if (!(typeof process === 'undefined' || !process.versions || !process.versions.node)) {
              _context6.next = 1;
              break;
            }
            return _context6.abrupt("return", null);
          case 1:
            _context6.prev = 1;
            dynamicImport = new Function('specifier', 'return import(specifier)');
            _context6.next = 2;
            return dynamicImport('node:zlib');
          case 2:
            module = _context6.sent;
            return _context6.abrupt("return", module["default"] || module);
          case 3:
            _context6.prev = 3;
            _t = _context6["catch"](1);
            _context6.prev = 4;
            dynamicRequire = new Function('return typeof require !== "undefined" ? require : null');
            requireFn = dynamicRequire();
            if (requireFn) {
              _context6.next = 5;
              break;
            }
            return _context6.abrupt("return", null);
          case 5:
            return _context6.abrupt("return", requireFn('zlib'));
          case 6:
            _context6.prev = 6;
            _t2 = _context6["catch"](4);
            return _context6.abrupt("return", null);
          case 7:
          case "end":
            return _context6.stop();
        }
      }, _callee6, null, [[1, 3], [4, 6]]);
    }))();
  }
};
module.exports = exports.default;