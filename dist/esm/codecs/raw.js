export default {
  pack: false,
  encode: true,
  compress: async string => Buffer.from(string, 'utf8'),
  decompress: async buffer => Buffer.from(buffer).toString('utf8')
};