require('dotenv').config();
const { encryptObject } = require('../utils/secretVault');

function main() {
  const hasKey = !!process.env.MASTER_KEY;
  console.log('MASTER_KEY present:', hasKey);
  try {
    const out = encryptObject({ hello: 'world' }, 'test-user-id');
    console.log('Encrypt OK:', typeof out === 'object', Object.keys(out));
  } catch (e) {
    console.error('Encrypt failed:', e.message);
    process.exitCode = 1;
  }
}

main();
