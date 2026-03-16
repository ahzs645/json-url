export function cleanEncodedInput(str) {
  let out = '';
  let i = 0;
  let j = 0;
  let codePoint;
  while (i < str.length) {
    codePoint = str.charCodeAt(i);
    if (codePoint === 37) {
      if (i > j) out += str.slice(j, i);
      str = decodeURIComponent(str.slice(i));
      i = 0;
      j = 0;
    } else if (codePoint === 32 || codePoint === 10 || codePoint === 13 || codePoint === 0 || codePoint === 8232 || codePoint === 8233) {
      if (i > j) out += str.slice(j, i);
      i += 1;
      j = i;
    } else {
      i += 1;
    }
  }
  if (i > j) out += str.slice(j, i);
  return out;
}
export function normalizeDecodeOptions(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Expected decode options to be an object');
  }
  return {
    deURI: options.deURI === true
  };
}
export function prepareEncodedInput(input, options = {}) {
  if (typeof input !== 'string') {
    throw new Error('Expected encoded input to be a string');
  }
  const {
    deURI
  } = normalizeDecodeOptions(options);
  return deURI ? cleanEncodedInput(input) : input;
}