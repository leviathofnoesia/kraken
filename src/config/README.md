# Config Schema

This directory is for Zod schema definitions for Kraken Code configuration.

## Expected Structure

- `schema.ts` - Main config schema definition
- `types.ts` - TypeScript types derived from schema

## Usage

Run `bun run build:schema` after modifying the schema to generate types.

See `AGENTS.md` for schema documentation.
