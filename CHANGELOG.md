# Changelog

## [2.0.0] - 2026-03-15

### Added

- **Jira importer** (`import-jira-issue` command): import one or more Jira issues into Redmine by key (e.g. `PROJ-123`). Fetches issue details from Jira, checks for an existing Redmine issue, prompts for target project, and creates the Redmine issue with the Jira key in the subject.
- **Toggl Projects sync** (`projects` command): syncs Redmine issues from configured saved queries to Toggl as projects. Skips issues already mapped, reports partial failures caused by Toggl API rate limits.
- **Orphan entry resolver**: Toggl entries without a linked Redmine issue can now be resolved interactively before tracking.
- **RM tracking UX improvements**: time entries are now sorted ascending by start time before confirmation; total hours are shown in the confirmation prompt.

### Changed

- Migrated codegen from self-contained to `@saboit/toggl-redmine-bridge` GitHub module; updated to latest bridge version with generated React Query hooks.
- Toggl API optimization: existing projects are fetched upfront to avoid redundant creation calls.
- Fixed Redmine activity IDs after upstream changes; added debug logging for RM insert operations.

### Dependencies

- Upgraded `react` to `^19.2.4` (React 19).
- Upgraded `ink` to `^6.8.0` (requires React 19; includes React 19-compatible `react-reconciler`).
