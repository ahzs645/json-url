import { cleanEncodedInput } from "./decode-utils.js";
import { AVAILABLE_CODECS, DEFAULT_WEB_SHARE_CODECS, DEFAULT_WEB_SHARE_MAX_LENGTH, DEFAULT_WEB_SHARE_VERSION, createEngine, createNamedCodec, createWebShareEngine } from "./engine.js";
const createClient = Object.assign(function createClient(algorithm, options = {}) {
  return createNamedCodec(algorithm, options);
}, {
  availableCodecs: AVAILABLE_CODECS,
  cleanEncodedInput,
  defaultWebShareCodecs: DEFAULT_WEB_SHARE_CODECS,
  defaultWebShareMaxLength: DEFAULT_WEB_SHARE_MAX_LENGTH,
  defaultWebShareVersion: DEFAULT_WEB_SHARE_VERSION,
  createEngine,
  createNamedCodec,
  createWebShareEngine
});
export default createClient;