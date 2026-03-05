const fs = require('fs');
const { execSync } = require('child_process');

console.log('Loading railway.json envs or env_vars.txt...');
try {
    const envVars = JSON.parse(fs.readFileSync('./env_vars.txt', 'utf8'));

    // It appears the production database URL wasn't easily dumped earlier. 
    // We'll read the .env and extract whatever we can, or just use node run-migration-final.js directly 
    // if we can fetch it. Let's look at the source first.

    const content = fs.readFileSync('.env', 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.startsWith('DATABASE_URL=')) {
            process.env.DATABASE_URL = line.split('=')[1].replace(/"/g, '').trim();
        }
    }

    console.log('Got DATABASE_URL:', process.env.DATABASE_URL ? 'YES' : 'NO');

    execSync('npx tsx src/db/migrate.ts', { stdio: 'inherit', env: process.env });
} catch (e) {
    console.error(e);
}
