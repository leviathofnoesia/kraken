/**
 * Binary Build Script
 * 
 * Cross-platform binary compilation for kraken-code.
 * Supports Linux, macOS, and Windows across x64 and ARM64 architectures.
 * 
 * Usage:
 *   bun run script/build-binary.ts              # Build for current platform
 *   bun run script/build-binary.ts --all       # Build for all platforms
 *   bun run script/build-binary.ts --linux      # Build for Linux only
 *   bun run script/build-binary.ts --macos      # Build for macOS only  
 *   bun run script/build-binary.ts --windows    # Build for Windows only
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
const BIN_DIR = join(ROOT_DIR, 'bin')
const DIST_DIR = join(ROOT_DIR, 'dist')

interface Platform {
  name: string
  bunName: string
  extension: string
  arch: string
}

const PLATFORMS: Platform[] = [
  { name: 'linux-x64', bunName: 'linux-x64', extension: '', arch: 'x64' },
  { name: 'linux-arm64', bunName: 'linux-arm64', extension: '', arch: 'arm64' },
  { name: 'macos-x64', bunName: 'darwin-x64', extension: '', arch: 'x64' },
  { name: 'macos-arm64', bunName: 'darwin-arm64', extension: '', arch: 'arm64' },
  { name: 'windows-x64', bunName: 'windows-x64', extension: '.exe', arch: 'x64' },
]

function ensureDirectories(): void {
  if (!existsSync(BIN_DIR)) {
    mkdirSync(BIN_DIR, { recursive: true })
  }
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }
}

function getCurrentPlatform(): Platform {
  const platform = process.platform
  const arch = process.arch
  
  if (platform === 'linux') {
    return { name: 'linux-' + arch, bunName: 'linux-' + arch, extension: '', arch }
  } else if (platform === 'darwin') {
    return { name: 'macos-' + arch, bunName: 'darwin-' + arch, extension: '', arch }
  } else if (platform === 'win32') {
    return { name: 'windows-x64', bunName: 'windows-x64', extension: '.exe', arch: 'x64' }
  }
  
  throw new Error(`Unsupported platform: ${platform}-${arch}`)
}

function buildBinary(platform: Platform): void {
  console.log(`\n🔨 Building binary for ${platform.name}...`)
  
  const outputName = `kraken-code${platform.extension}`
  const outputPath = join(BIN_DIR, outputName)
  
  // Remove existing binary if present
  if (existsSync(outputPath)) {
    rmSync(outputPath)
  }
  
  // For current platform, use simple compile
  // Cross-platform builds require the target platform's bun runtime
  const isCurrentPlatform = (
    (platform.name.startsWith('linux') && process.platform === 'linux') ||
    (platform.name.startsWith('macos') && process.platform === 'darwin') ||
    (platform.name.startsWith('windows') && process.platform === 'win32')
  )
  
  let buildCmd: string
  if (isCurrentPlatform) {
    buildCmd = `bun build --compile src/cli/index.ts --outfile ${outputPath}`
  } else {
    // For cross-platform, we need docker or native bun on target
    // For now, skip with a message
    console.log(`⚠️ Cross-platform build for ${platform.name} requires running on that platform or using Docker`)
    return
  }
  
  try {
    execSync(buildCmd, { 
      cwd: ROOT_DIR,
      stdio: 'inherit'
    })
    
    console.log(`✅ Successfully built: ${outputPath}`)
  } catch (error) {
    console.error(`❌ Failed to build for ${platform.name}:`, error)
    throw error
  }
}

function createDistribution(platforms: Platform[]): void {
  console.log('\n📦 Creating distribution packages...')
  
  const releaseDir = join(DIST_DIR, 'release')
  if (existsSync(releaseDir)) {
    rmSync(releaseDir, { recursive: true })
  }
  mkdirSync(releaseDir, { recursive: true })
  
  // Copy binaries to release directory
  for (const platform of platforms) {
    const outputName = `kraken-code${platform.extension}`
    const srcPath = join(BIN_DIR, outputName)
    const destPath = join(releaseDir, outputName)
    
    if (existsSync(srcPath)) {
      execSync(`cp "${srcPath}" "${destPath}"`)
      console.log(`📄 Copied: ${outputName}`)
    }
  }
  
  // Create version file
  const version = require(join(ROOT_DIR, 'package.json')).version
  execSync(`echo "${version}" > "${join(releaseDir, 'VERSION')}"`)
  
  console.log(`✅ Distribution created in: ${releaseDir}`)
}

function parseArgs(): { platforms: Platform[], all: boolean } {
  const args = process.argv.slice(2)
  const all = args.includes('--all')
  
  if (all) {
    return { platforms: PLATFORMS, all: true }
  }
  
  const platforms: Platform[] = []
  
  for (const arg of args) {
    if (arg === '--linux') {
      platforms.push(...PLATFORMS.filter(p => p.name.startsWith('linux')))
    } else if (arg === '--macos') {
      platforms.push(...PLATFORMS.filter(p => p.name.startsWith('macos')))
    } else if (arg === '--windows') {
      platforms.push(...PLATFORMS.filter(p => p.name.startsWith('windows')))
    }
  }
  
  // Default to current platform
  if (platforms.length === 0) {
    platforms.push(getCurrentPlatform())
  }
  
  return { platforms, all: false }
}

async function main(): Promise<void> {
  console.log('🚀 Kraken-Code Binary Builder')
  console.log('=============================')
  
  const { platforms, all } = parseArgs()
  
  console.log(`\nTarget platforms: ${platforms.map(p => p.name).join(', ')}`)
  
  ensureDirectories()
  
  // First build the main TypeScript
  console.log('\n📦 Building TypeScript...')
  execSync('bun run build', { cwd: ROOT_DIR, stdio: 'inherit' })
  
  // Build binaries
  for (const platform of platforms) {
    buildBinary(platform)
  }
  
  // Create distribution if building multiple platforms
  if (all || platforms.length > 1) {
    createDistribution(platforms)
  }
  
  console.log('\n✨ Build complete!')
  console.log(`Binaries located in: ${BIN_DIR}`)
}

main().catch(console.error)
