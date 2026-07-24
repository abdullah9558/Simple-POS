/**
 * electron-builder cannot produce a working .app/.dmg from Windows/Linux.
 * Native libsql bindings and DMG tooling require a macOS build host.
 */
if (process.platform !== 'darwin') {
  console.error('')
  console.error('Mac installers must be built on macOS (Apple Silicon or Intel Mac).')
  console.error('')
  console.error('On a Mac:')
  console.error('  npm install')
  console.error('  npm run dist:mac')
  console.error('')
  console.error(`This host is "${process.platform}" — aborting.`)
  console.error('')
  process.exit(1)
}
