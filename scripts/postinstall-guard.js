// Skip build during CI/Netlify/Render install
// This file is executed as an ES module (package.json has "type": "module"),
// so use dynamic import instead of require.
const isCI = Boolean(process.env.CI || process.env.NETLIFY || process.env.RENDER);

if (isCI) {
  console.log('Skipping postinstall build in CI/Netlify/Render environment');
} else {
  // Run build only for local installs
  const { spawnSync } = await import('child_process');
  const res = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (res.error) {
    console.error('postinstall build failed:', res.error);
    process.exit(1);
  }
  process.exit(res.status || 0);
}