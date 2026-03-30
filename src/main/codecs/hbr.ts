import { createHomogeneousJsonCodec } from './homogeneous-json-codec.js';

const hbr = createHomogeneousJsonCodec('brotli', 'hbr');

export default hbr;
