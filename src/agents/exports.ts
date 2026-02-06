export { krakenAgent } from './kraken'
export { atlasAgent } from './atlas'
export { nautilusAgent } from './nautilus'
export { abyssalAgent } from './abyssal'
export { coralAgent } from './coral'
export { sirenAgent } from './siren'
export { scyllaAgent } from './scylla'
export { pearlAgent } from './pearl'
export { cartographerAgent } from './cartographer'

import type { AgentPromptMetadata } from '../types'

export interface AvailableAgent {
  name: string
  description: string
  metadata: AgentPromptMetadata
}

export interface AgentConfig {
  model?: string
  prompts: {
    system: string
    user: string
  }
  tools?: any[]
  hooks?: any
}
