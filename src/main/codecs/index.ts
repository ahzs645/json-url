import br from './br.js';
import df from './df.js';
import gz from './gz.js';
import lz from './lz.js';
import lzma from './lzma.js';
import lzstring from './lzstring.js';
import lzw from './lzw.js';
import pack from './pack.js';
import raw from './raw.js';

import type { CodecAlgorithmConfig } from '../types.js';

const ALGORITHMS: Record<string, CodecAlgorithmConfig> = {
	lzma,
	lzstring,
	lzw,
	pack,
	raw,
	gz,
	df,
	br,
	lz
};

export default ALGORITHMS;
