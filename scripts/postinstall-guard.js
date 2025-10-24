// Skip build during CI/Netlify install
if (!process.env.NETLIFY && !process.env.CI) {
  // Run build only for local installs
  const { spawnSync } = require('child_process')
  spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
} else {
  console.log('Skipping postinstall build in CI/Netlify environment')
}