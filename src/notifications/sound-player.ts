import { getPlatform, type Platform } from './platform-detector'
import { createLogger } from '../utils/logger'

const logger = createLogger('sound-player')

export interface SoundConfig {
  enabled: boolean
  volume?: number
  customPaths?: Record<Platform, Partial<Record<string, string>>>
}

export interface SoundEvent {
  type: 'task_complete' | 'agent_idle' | 'notification' | 'error'
  severity?: 'info' | 'warning' | 'error'
}

const DEFAULT_SOUND_PATHS: Record<Platform, Record<string, string>> = {
  darwin: {
    task_complete: '/System/Library/Sounds/Ping.aiff',
    agent_idle: '/System/Library/Sounds/Glass.aiff',
    notification: '/System/Library/Sounds/Purr.aiff',
    error: '/System/Library/Sounds/Basso.aiff',
  },
  linux: {
    task_complete: '/usr/share/sounds/freedesktop/stereo/complete.oga',
    agent_idle: '/usr/share/sounds/freedesktop/stereo/message.oga',
    notification: '/usr/share/sounds/freedesktop/stereo/dialog-information.oga',
    error: '/usr/share/sounds/freedesktop/stereo/dialog-error.oga',
  },
  win32: {
    task_complete: 'C:\\Windows\\Media\\notify.wav',
    agent_idle: 'C:\\Windows\\Media\\Windows Hardware Fail.wav',
    notification: 'C:\\Windows\\Media\\Windows Notify.wav',
    error: 'C:\\Windows\\Media\\Windows Error.wav',
  },
  unsupported: {
    task_complete: '',
    agent_idle: '',
    notification: '',
    error: '',
  },
}

const PLATFORM_SOUND_COMMANDS: Record<Platform, { command: string; args: string[] } | null> = {
  darwin: {
    command: 'afplay',
    args: [],
  },
  linux: {
    command: 'paplay',
    args: [],
  },
  win32: {
    command: 'powershell',
    args: ['-Command'],
  },
  unsupported: null,
}

export function getSoundPath(
  event: SoundEvent,
  config: SoundConfig = { enabled: true },
): string | null {
  if (!config.enabled) {
    return null
  }

  const platform = getPlatform()

  if (config.customPaths && config.customPaths[platform]) {
    const platformSounds = config.customPaths[platform]
    if (platformSounds && event.type in platformSounds) {
      const eventType = event.type as keyof typeof platformSounds
      const customSound = platformSounds[eventType]
      if (customSound) {
        return customSound
      }
    }
  }

  const defaultSounds = DEFAULT_SOUND_PATHS[platform]
  if (defaultSounds && event.type in defaultSounds) {
    const eventType = event.type as keyof typeof defaultSounds
    return defaultSounds[eventType]
  }

  return null
}

export async function playSound(
  event: SoundEvent,
  config: SoundConfig = { enabled: true, volume: 1.0 },
): Promise<boolean> {
  if (!config.enabled) {
    return false
  }

  const soundPath = getSoundPath(event, config)
  if (!soundPath) {
    logger.debug(`No sound path for event ${event.type}`)
    return false
  }

  const platform = getPlatform()
  const platformCommand =
    PLATFORM_SOUND_COMMANDS !== null
      ? PLATFORM_SOUND_COMMANDS[platform as keyof typeof PLATFORM_SOUND_COMMANDS]
      : null

  if (!platformCommand) {
    logger.debug(`No sound command for platform ${platform}`)
    return false
  }

  try {
    const { spawn } = await import('node:child_process')

    const args: string[] = []

    if (platform === 'win32') {
      const volume = config.volume || 1.0
      const sound = `(New-Object Media.SoundPlayer "${soundPath}").Volume = ${volume}; $sound.PlaySync()`
      args.push(`(Add-Type -AssemblyName PresentationCore; ${sound})`)
    } else {
      const volumeArg =
        config.volume !== undefined && config.volume !== 1.0
          ? [`--volume=${config.volume.toFixed(2)}`]
          : []
      args.push(...platformCommand.args, ...volumeArg, soundPath)
    }

    const result = spawn(platformCommand.command, args, {
      detached: true,
      stdio: 'ignore',
    })

    result.unref()

    logger.debug(`Playing ${event.type} sound for ${platform}`)
    return true
  } catch (error) {
    logger.error(`Error playing sound:`, error)
    return false
  }
}

export function testSoundPlayback(): {
  platformName: Platform
  supported: boolean
  soundPath: string | null
} {
  const platformName = getPlatform()
  const command =
    PLATFORM_SOUND_COMMANDS !== null
      ? PLATFORM_SOUND_COMMANDS[platformName as keyof typeof PLATFORM_SOUND_COMMANDS]
      : null
  const soundPath = getSoundPath({ type: 'notification' }, { enabled: true })

  return {
    platformName,
    supported: command !== null && soundPath !== null,
    soundPath,
  }
}

export function getDefaultSoundConfig(): SoundConfig {
  return {
    enabled: true,
    volume: 1.0,
  }
}
