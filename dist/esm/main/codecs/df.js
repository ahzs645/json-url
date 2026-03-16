import { compressTextWithStreamCodec, decompressTextWithStreamCodec } from "./stream-codec.js";
export default {
  pack: false,
  encode: true,
  compress: async string => compressTextWithStreamCodec(string, 'deflate-raw', 'df'),
  decompress: async buffer => decompressTextWithStreamCodec(buffer, 'deflate-raw', 'df')
};