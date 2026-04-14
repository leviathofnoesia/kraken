# Troubleshooting

## Learning data not updating

1. Confirm `learning.enabled` is `true`.
2. Ensure the storage path is writable.
3. Check that `learning.autoSave` is not disabled.

If changes still do not persist, delete `~/.kraken/learning/learning-state.json` to reset the store.

## Learning tools return empty results

- Verify that `kraken-code init --full` created the `learning` section.
- Add at least one experience or knowledge node and retry.

## Configuration errors

If Kraken Code fails to load configuration:

1. Validate JSON syntax in `~/.config/opencode/kraken-code.json`.
2. Ensure `learning` keys use the expected types (booleans, numbers, strings).
3. Remove deprecated keys such as `kratos`.

## Hooks not firing

Hooks may be disabled by configuration or external OpenCode settings:

- Check `claudeCodeCompatibility.toggles.hooks` if present.
- Ensure OpenCode is not running in a restricted mode that disables plugin hooks.
