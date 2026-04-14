export type Platform = "darwin" | "linux" | "win32" | "unsupported"

export function getPlatform(): Platform {
  const platform = process.platform
  
  if (platform === "darwin") {
    return "darwin"
  }
  
  if (platform === "linux") {
    return "linux"
  }
  
  if (platform === "win32") {
    return "win32"
  }
  
  return "unsupported"
}

export async function getNotifySendPath(): Promise<string | null> {
  if (process.platform !== "linux") {
    return null
  }
  
  try {
    const { spawn } = await import("node:child_process")
    const result = spawn("which", ["notify-send"])
    
    return new Promise((resolve) => {
      let output = ""
      result.stdout.on("data", (data: Buffer) => {
        output += data.toString()
      })
      
      result.on("close", (code: number | null) => {
        if (code === 0 && output.trim()) {
          resolve(output.trim())
        } else {
          resolve(null)
        }
      })
      
      result.on("error", () => {
        resolve(null)
      })
    })
  } catch {
    return null
  }
}

export async function getOsascriptPath(): Promise<string | null> {
  if (process.platform !== "darwin") {
    return null
  }
  
  try {
    const { spawn } = await import("node:child_process")
    const result = spawn("which", ["osascript"])
    
    return new Promise((resolve) => {
      let output = ""
      result.stdout.on("data", (data: Buffer) => {
        output += data.toString()
      })
      
      result.on("close", (code: number | null) => {
        if (code === 0 && output.trim()) {
          resolve(output.trim())
        } else {
          resolve(null)
        }
      })
      
      result.on("error", () => {
        resolve(null)
      })
    })
  } catch {
    return null
  }
}

export async function getPowershellPath(): Promise<string | null> {
  if (process.platform !== "win32") {
    return null
  }
  
  try {
    const { exec } = await import("node:child_process")
    
    return new Promise((resolve) => {
      exec("where powershell", (error, stdout, stderr) => {
        if (!error && stdout.trim()) {
          resolve(stdout.trim())
        } else {
          resolve(null)
        }
      })
    })
  } catch {
    return null
  }
}

export async function getNotificationCommand(): Promise<{
  command: string
  args: string[]
  platform: Platform
} | null> {
  const platform = getPlatform()
  
  if (platform === "linux") {
    const notifySendPath = await getNotifySendPath()
    if (notifySendPath) {
      return {
        command: notifySendPath,
        args: [],
        platform: "linux",
      }
    }
  }
  
  if (platform === "darwin") {
    const osascriptPath = await getOsascriptPath()
    if (osascriptPath) {
      return {
        command: osascriptPath,
        args: ["-e"],
        platform: "darwin",
      }
    }
  }
  
  if (platform === "win32") {
    const powershellPath = await getPowershellPath()
    if (powershellPath) {
      return {
        command: powershellPath,
        args: ["-Command"],
        platform: "win32",
      }
    }
  }
  
  return null
}

export function isNotificationSupported(): boolean {
  const platform = getPlatform()
  return platform !== "unsupported"
}
