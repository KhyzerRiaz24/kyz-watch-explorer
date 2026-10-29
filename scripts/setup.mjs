import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const filename = new URL('../.env', import.meta.url);
let contents = existsSync(filename)
  ? readFileSync(filename, 'utf8')
  : readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
if (!/^ADMIN_TOKEN=.+/m.test(contents)) {
  const setting = `ADMIN_TOKEN=${randomBytes(32).toString('base64url')}`;
  contents = /^ADMIN_TOKEN=/m.test(contents)
    ? contents.replace(/^ADMIN_TOKEN=.*$/m, setting)
    : `${contents.trimEnd()}\n${setting}\n`;
  writeFileSync(filename, contents, { mode: 0o600 });
  console.log(
    'Local configuration created with a private studio access key. Run npm run admin-key to view it privately.',
  );
} else console.log('Your existing local configuration has been preserved.');
