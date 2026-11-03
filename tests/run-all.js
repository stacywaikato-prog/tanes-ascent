// Runs every browser test in turn and stops on the first failure.
const { execFileSync } = require('child_process');
const fs = require('fs'); fs.mkdirSync(__dirname + '/output', { recursive: true });
for (const f of ['smoke.js', 'bot.js', 'solve.js', 'regress.js']) {
  console.log('\n=== ' + f + ' ===');
  try { execFileSync(process.execPath, [__dirname + '/' + f], { stdio: 'inherit', timeout: 900000 }); }
  catch (e) { console.error(f + ' failed'); process.exit(1); }
}
console.log('\nAll browser tests finished. Read the output above: every heaven should say GATE in the gates-open run, and every boss should end with the gate open.');
