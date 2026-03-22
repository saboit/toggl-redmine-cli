import { writeFileSync } from 'fs';

const buildDate = new Date().toISOString();
writeFileSync('src/buildInfo.ts', `export const BUILD_DATE = '${buildDate}';\n`);
