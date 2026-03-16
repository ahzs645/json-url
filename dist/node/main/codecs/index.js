"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _lzma = _interopRequireDefault(require("./lzma"));
var _lzstring = _interopRequireDefault(require("./lzstring"));
var _lzw = _interopRequireDefault(require("./lzw"));
var _pack = _interopRequireDefault(require("./pack"));
var _raw = _interopRequireDefault(require("./raw"));
var _gz = _interopRequireDefault(require("./gz"));
var _df = _interopRequireDefault(require("./df"));
var _br = _interopRequireDefault(require("./br"));
var _lz = _interopRequireDefault(require("./lz"));
var _default = exports["default"] = {
  lzma: _lzma["default"],
  lzstring: _lzstring["default"],
  lzw: _lzw["default"],
  pack: _pack["default"],
  raw: _raw["default"],
  gz: _gz["default"],
  df: _df["default"],
  br: _br["default"],
  lz: _lz["default"]
};
module.exports = exports.default;