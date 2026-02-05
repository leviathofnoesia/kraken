import { krakenAgent } from './kraken'
import { atlasAgent } from './atlas'
import { nautilusAgent } from './nautilus'
import { abyssalAgent } from './abyssal'
import { coralAgent } from './coral'
import { sirenAgent } from './siren'
import { scyllaAgent } from './scylla'
import { pearlAgent } from './pearl'
import { maelstromAgent } from './maelstrom'
import { leviathanAgent } from './leviathan'
import { poseidonAgent } from './poseidon'
import { cartographerAgent } from './cartographer'

export const agents = {
  Kraken: krakenAgent,
  Atlas: atlasAgent,
  Nautilus: nautilusAgent,
  Abyssal: abyssalAgent,
  Coral: coralAgent,
  Siren: sirenAgent,
  Scylla: scyllaAgent,
  Pearl: pearlAgent,
  Maelstrom: maelstromAgent,
  Leviathan: leviathanAgent,
  Poseidon: poseidonAgent,
  Cartographer: cartographerAgent,
}

export type AgentName = keyof typeof agents

export {
  krakenAgent,
  atlasAgent,
  nautilusAgent,
  abyssalAgent,
  coralAgent,
  sirenAgent,
  scyllaAgent,
  pearlAgent,
  maelstromAgent,
  leviathanAgent,
  poseidonAgent,
  cartographerAgent,
}
