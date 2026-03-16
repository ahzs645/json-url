import { compressTextWithStreamCodec, decompressTextWithStreamCodec } from 'main/codecs/stream-codec';

export default {
	pack: false,
	encode: true,
	compress: async string => compressTextWithStreamCodec(string, 'brotli', 'br'),
	decompress: async buffer => decompressTextWithStreamCodec(buffer, 'brotli', 'br')
};
