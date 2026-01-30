import { z } from "zod"

const EnvironmentSchema = z.object({
  ANTIGRAVITY_DEBUG: z.enum(["0", "1"]).optional(),
  DEBUG: z.enum(["1", "true"]).optional(),
  CI: z.string().optional(),
  EXA_API_KEY: z.string().min(20).optional(),
  CONTEXT7_API_KEY: z.string().min(20).optional(),
  GITHUB_TOKEN: z.string().min(20).optional(),
  OPENAI_CLIENT_ID: z.string().min(10).optional(),
  OPENAI_CLIENT_SECRET: z.string().min(10).optional(),
  OPENAI_REDIRECT_URI: z.string().url().optional(),
  OPENAI_CALLBACK_PORT: z.string().regex(/^\d+$/).optional(),
  HOME: z.string().optional(),
  XDG_CONFIG_HOME: z.string().optional(),
})

export type Environment = z.infer<typeof EnvironmentSchema>

let cachedEnv: Environment | null = null

export function getEnv(): Environment {
  if (!cachedEnv) {
    cachedEnv = EnvironmentSchema.parse(process.env)
  }
  return cachedEnv
}

export function validateEnv(): { valid: boolean; errors: string[] } {
  const result = EnvironmentSchema.safeParse(process.env)
  
  if (result.success) {
    return { valid: true, errors: [] }
  }
  
  const issues: z.ZodIssue[] = (result.error as any).issues || []
  const errors = issues.map((err) => 
    `Environment variable ${err.path.join(".")}: ${err.message}`
  )
  
  return { valid: false, errors }
}

export function getEnvVar<T extends keyof Environment>(
  key: T,
  defaultValue: Required<Environment>[T]
): Required<Environment>[T] {
  const env = getEnv()
  return (env[key] ?? defaultValue) as Required<Environment>[T]
}
