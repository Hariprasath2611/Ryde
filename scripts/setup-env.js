const fs = require('fs');
const path = require('path');

const targets = [
  'ryde-capital/backend',
  'ryde-capital/mobile',
  'shared',
];

console.log('🔄 Setting up local .env files from .env.example templates...');

let createdCount = 0;

targets.forEach((relDir) => {
  const dir = path.resolve(__dirname, '..', relDir);
  const src = path.join(dir, '.env.example');
  const dest = path.join(dir, '.env');

  if (!fs.existsSync(src)) {
    console.warn(`⚠️ Warning: Template not found at ${src}`);
    return;
  }

  // Copy template to active .env
  fs.copyFileSync(src, dest);
  console.log(`✅ Created: ${path.relative(path.resolve(__dirname, '..'), dest)}`);
  createdCount++;
});

console.log(`\n🎉 Success: ${createdCount} environment files generated! Teammates are ready to run.`);
