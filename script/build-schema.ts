#!/usr/bin/env bun
import * as z from "zod"
import { OpenCodeXConfigSchema } from "../src/config/schema"

const SCHEMA_OUTPUT_PATH = "assets/kraken-code.schema.json"

async function main() {
  console.log("Generating JSON Schema...")

  const jsonSchema = z.toJSONSchema(OpenCodeXConfigSchema, {
    io: "input",
    target: "draft-7",
  })

  const finalSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://raw.githubusercontent.com/leviathofnoesia/kraken-code/main/assets/kraken-code.schema.json",
    title: "Kraken-Code Configuration",
    description: "Configuration schema for kraken-code plugin",
    ...jsonSchema,
  }

  await Bun.write(SCHEMA_OUTPUT_PATH, JSON.stringify(finalSchema, null, 2))

  console.log(`✓ JSON Schema generated: ${SCHEMA_OUTPUT_PATH}`)
}

main()
