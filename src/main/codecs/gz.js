import { compressTextWithStreamCodec, decompressTextWithStreamCodec } from 'main/codecs/stream-codec';

export default {
	pack: false,
	encode: true,
	compress: async string => compressTextWithStreamCodec(string, 'gzip', 'gz'),
	decompress: async buffer => decompressTextWithStreamCodec(buffer, 'gzip', 'gz')
};
