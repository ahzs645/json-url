const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'dist', 'esm');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
	path.join(outputDir, 'package.json'),
	'{\n  "type": "module"\n}\n'
);
