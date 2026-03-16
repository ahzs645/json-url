import LOADERS from "../loaders.js";
export default {
  pack: false,
  encode: false,
  compress: async string => (await LOADERS.lzstring()).compressToEncodedURIComponent(string),
  decompress: async value => {
    const result = (await LOADERS.lzstring()).decompressFromEncodedURIComponent(value);
    if (result === null) {
      throw new Error('Unable to decode lz codec payload');
    }
    return result;
  }
};