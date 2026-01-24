# Plugin Handlers

This directory is for plugin event handlers and lifecycle management.

## Expected Structure

- `src/plugin-handlers/<plugin-name>/` - Individual plugin handlers
- Each handler should export: `onLoad`, `onUnload`, `onMessage` functions

## Purpose

Plugin handlers manage plugin lifecycle and event processing.

See `AGENTS.md` for plugin development guidelines.
