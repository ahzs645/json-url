import createClient from '../src/main/index.js';
import samples from './samples.json';

const algorithms = createClient.availableCodecs;

async function main(): Promise<void> {
	const results: Array<Record<string, unknown>> = new Array(samples.length);

	for (const algorithm of algorithms) {
		const lib = createClient(algorithm);
		let counter = 0;
		for (const datum of samples) {
			const { raw, rawencoded, compressedencoded, compression } = await lib.stats(datum);
			results[counter] = results[counter] || {};
			results[counter].json = raw;
			results[counter].jsonencoded = rawencoded;
			results[counter][algorithm] = {
				ratio: compression,
				compressed: compressedencoded
			};
			counter += 1;
		}
	}

	console.log(JSON.stringify(results, null, 2));
}

await main();
