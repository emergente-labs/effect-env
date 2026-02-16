# Release Checklist

- [ ] Confirm `package.json` metadata and repository links are correct
- [ ] Run `pnpm install`
- [ ] Run `pnpm build`
- [ ] Run `pnpm typecheck`
- [ ] Run `pnpm test`
- [ ] Validate README examples still compile conceptually
- [ ] Bump version in `package.json`
- [ ] Add/update changelog entry for the release
- [ ] Create git tag: `v<version>`
- [ ] Publish: `npm publish --access public`
- [ ] Verify npm page and installation from a clean project
