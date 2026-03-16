import type { CodecAlgorithmConfig } from '../types.js';
export type CodecAlgorithmLoader = () => Promise<CodecAlgorithmConfig>;
declare const ALGORITHMS: Record<string, CodecAlgorithmLoader>;
export default ALGORITHMS;
//# sourceMappingURL=index.d.ts.map