function readPackage(pkg) {
  // Allow build scripts for packages that need them
  if (pkg.name === 'sharp' || pkg.name === 'unrs-resolver') {
    pkg.pnpm = pkg.pnpm || {}
  }
  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}
