// Skip build during CI/Netlify/Render install
// This file is executed as an ES module (package.json has "type": "module"),
// so use dynamic import instead of require.

const isCI = Boolean(process.env.CI || process.env.NETLIFY || process.env.RENDER);

if (isCI) {
  console.log('Skipping postinstall build in CI/Netlify/Render environment');
  process.exit(0);
} else {
  // Run build only for local installs
  import('child_process').then(({ spawnSync }) => {
    const res = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
    if (res.error) {
      console.error('postinstall build failed:', res.error);
      process.exit(1);
    }
    process.exit(res.status || 0);
  }).catch(err => {
    console.error('Failed to import child_process:', err);
    process.exit(1);
  });
}