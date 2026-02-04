import type { Hooks } from '@opencode-ai/plugin';
import type { PluginInput } from '@opencode-ai/plugin';
import { exec } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createLogger } from '../../utils/logger';

export interface AutoUpdateCheckerConfig {
  enabled?: boolean;
  checkOnLoad?: boolean;
  cacheDir?: string;
  cacheTTL?: number;
  notify?: boolean;
  checkInterval?: number;
}

interface UpdateCache {
  currentVersion: string;
  latestVersion: string;
  lastChecked: number;
  updateAvailable: boolean;
}

const PACKAGE_NAME = 'kraken-code';
const DEFAULT_CACHE_TTL = 86400000;
const DEFAULT_CACHE_DIR = join(homedir(), '.config', 'kraken-code', 'cache');
const CACHE_FILE = 'update-check.json';
const SHOULD_LOG =
  process.env.ANTIGRAVITY_DEBUG === "1" ||
  process.env.DEBUG === "1" ||
  process.env.KRAKEN_LOG === "1";
const logger = createLogger('auto-update-checker');

let currentVersion: string = '';
let updateCache: UpdateCache | null = null;

function getCurrentVersion(): string {
  if (!currentVersion) {
    try {
      const packageJson = require('../package.json');
      currentVersion = packageJson.version || '0.0.0';
    } catch (e) {
      currentVersion = '0.0.0';
    }
  }
  return currentVersion;
}

function getCachePath(config: AutoUpdateCheckerConfig): string {
  const cacheDir = config.cacheDir ?? DEFAULT_CACHE_DIR;
  return join(cacheDir, CACHE_FILE);
}

async function loadCache(config: AutoUpdateCheckerConfig): Promise<UpdateCache | null> {
  try {
    const cachePath = getCachePath(config);
    if (!existsSync(cachePath)) {
      return null;
    }

    const content = await readFile(cachePath, 'utf-8');
    const cache = JSON.parse(content) as UpdateCache;
    return cache;
  } catch (e) {
    return null;
  }
}

async function saveCache(config: AutoUpdateCheckerConfig, cache: UpdateCache): Promise<void> {
  try {
    const cacheDir = config.cacheDir ?? DEFAULT_CACHE_DIR;
    if (!existsSync(cacheDir)) {
      await mkdir(cacheDir, { recursive: true });
    }

    const cachePath = getCachePath(config);
    await writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (e) {
    if (SHOULD_LOG) {
      logger.warn('Failed to save cache:', e);
    }
  }
}

async function checkNpmRegistry(): Promise<string | null> {
  return new Promise((resolve) => {
    exec(
      `npm view ${PACKAGE_NAME} version`,
      (error, stdout, stderr) => {
        if (error) {
          if (SHOULD_LOG) {
            logger.warn('Failed to check npm registry:', error);
          }
          resolve(null);
          return;
        }

        if (stderr) {
          if (SHOULD_LOG) {
            logger.warn('npm error:', stderr);
          }
          resolve(null);
          return;
        }

        const version = stdout.trim();
        if (version) {
          resolve(version);
        } else {
          resolve(null);
        }
      }
    );
  });
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

async function checkForUpdates(
  config: AutoUpdateCheckerConfig
): Promise<{ updateAvailable: boolean; latestVersion: string | null }> {
  const currentVersionValue = getCurrentVersion();
  const cacheTTL = config.cacheTTL ?? DEFAULT_CACHE_TTL;
  const now = Date.now();

  const cache = await loadCache(config);
  updateCache = cache;

  if (cache && (now - cache.lastChecked) < cacheTTL) {
    if (SHOULD_LOG) {
      logger.debug(
        `Using cached update check from ${new Date(cache.lastChecked).toISOString()}`
      );
    }
    return {
      updateAvailable: cache.updateAvailable,
      latestVersion: cache.latestVersion,
    };
  }

  if (SHOULD_LOG) {
    logger.debug('Checking npm registry for updates...');
  }
  const latestVersion = await checkNpmRegistry();

  if (!latestVersion) {
    if (SHOULD_LOG) {
      logger.debug('Could not determine latest version');
    }
    return {
      updateAvailable: false,
      latestVersion: null,
    };
  }

  const updateAvailable = compareVersions(latestVersion, currentVersionValue) > 0;

  const newCache: UpdateCache = {
    currentVersion: currentVersionValue,
    latestVersion,
    lastChecked: now,
    updateAvailable,
  };

  await saveCache(config, newCache);
  updateCache = newCache;

  return {
    updateAvailable,
    latestVersion,
  };
}

export function createAutoUpdateChecker(
  _input: PluginInput,
  options?: { config?: AutoUpdateCheckerConfig }
): Hooks {
  const config = options?.config ?? {
    enabled: true,
    checkOnLoad: true,
    cacheDir: DEFAULT_CACHE_DIR,
    cacheTTL: DEFAULT_CACHE_TTL,
    notify: true,
    checkInterval: DEFAULT_CACHE_TTL,
  };

  return {
    config: async (configInput) => {
      if (!config.enabled) return;

      if (config.checkOnLoad) {
        if (SHOULD_LOG) {
          logger.debug('Checking for updates on load...');
        }
        const { updateAvailable, latestVersion } = await checkForUpdates(config);

        if (updateAvailable && config.notify) {
          if (SHOULD_LOG) {
            logger.info('UPDATE AVAILABLE');
            logger.info(`Current version: ${getCurrentVersion()}`);
            logger.info(`Latest version:  ${latestVersion}`);
            logger.info('To update, run: npm update kraken-code (or bun update kraken-code)');
          }
        } else if (!updateAvailable) {
          if (SHOULD_LOG) {
            logger.debug(`You are using the latest version: ${getCurrentVersion()}`);
          }
        }
      }
    },

    event: async (input) => {
      if (!config.enabled) return;

      if (input.event?.type === 'installation.updated') {
        if (SHOULD_LOG) {
          logger.debug('Installation was updated');
        }
        const cacheDir = config.cacheDir ?? DEFAULT_CACHE_DIR;
        const cachePath = join(cacheDir, CACHE_FILE);
        try {
          const { unlink } = await import('node:fs/promises');
          await unlink(cachePath);
          if (SHOULD_LOG) {
            logger.debug('Cleared update cache');
          }
        } catch (e) {
        }
      }

      if (input.event?.type === 'installation.update-available') {
        if (SHOULD_LOG) {
          logger.debug('New update available');
        }
        const { latestVersion } = await checkForUpdates(config);
        if (latestVersion) {
          if (SHOULD_LOG) {
            logger.debug(`Latest version: ${latestVersion}`);
          }
        }
      }
    },
  };
}

export function getUpdateCache(): UpdateCache | null {
  return updateCache;
}

export function getCurrentInstalledVersion(): string {
  return getCurrentVersion();
}

export async function manualUpdateCheck(
  config?: AutoUpdateCheckerConfig
): Promise<{ updateAvailable: boolean; latestVersion: string | null }> {
  const fullConfig = {
    enabled: true,
    checkOnLoad: true,
    cacheDir: DEFAULT_CACHE_DIR,
    cacheTTL: 0,
    notify: true,
    ...config,
  };
  return checkForUpdates(fullConfig);
}
