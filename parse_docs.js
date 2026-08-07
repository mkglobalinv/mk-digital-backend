import fs from 'fs';

const content = fs.readFileSync('identro_docs_chunk.js', 'utf8');

const endpointRegex = /\/merchant-api\/[a-zA-Z0-9_/-]+/g;
const endpoints = [...new Set(content.match(endpointRegex))];
console.log('Endpoints found:', endpoints);

const headerRegex = /x-api-key|Authorization|Bearer/ig;
const headers = [...new Set(content.match(headerRegex))];
console.log('\nHeaders mentioned:', headers);

const stringRegex = /"([A-Z][a-zA-Z0-9 ,.\-]{20,})"/g;
const strings = [...content.matchAll(stringRegex)].map(m => m[1]);
console.log('\nSample text strings:');
console.log(strings.join('\n'));
