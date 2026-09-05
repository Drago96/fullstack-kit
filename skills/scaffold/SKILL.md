---
name: scaffold
description: Generate a new Project from the Reference Project - "new project", "scaffold X", "start a project on the Kit", "/scaffold". Use once, at the birth of a Project, before any code is written in it.
---

# Scaffold

One script does the whole thing. Read the arguments with the human, run it, then hand off to the wizard.

```bash
bash "${CLAUDE_PLUGIN_ROOT:-.}/scripts/scaffold/scaffold.sh" <name> [--mobile] [--visibility private|public]
```

Run it from the directory that should hold the new Project; it creates `./<name>` and never touches anything above it.

| Input           | Default   | Notes                                                                                    |
| --------------- | --------- | ---------------------------------------------------------------------------------------- |
| `<name>`        | required  | Lowercase letters, digits and hyphens. It becomes the npm scope, the Expo slug, the deep-link scheme and the GitHub repo name, so ask before inventing one. |
| `--mobile`      | off       | Keeps `apps/mobile` (Expo Router). Off means a Project carries no Expo weight (ADR 0002). |
| `--visibility`  | `private` | Passed straight to `gh repo create`.                                                      |

Two more exist for the Kit's own CI and are not for interactive use: `--kit <path-or-url>` (where to clone the `reference` branch from, default the Kit's GitHub URL) and `--no-github` (stop after the first commit, create no repo, push nothing).

Needs `git`, `pnpm`, `node` and an authenticated `gh`. The script runs `gh auth switch -u Drago96` itself, because the active account reverts between shells.

## What it does, in order

1. Clones the Kit's `reference` branch into `./<name>` and renames the remote to `kit`, so `git merge kit/reference` is a no-op on day one and the Sync Loop has a shared base (ADR 0006). The Project's branch is `main`.
2. Renames the Reference Project's identifiers: the `@reference/*` package scope everywhere it appears (imports, `package.json`, the turbo task id, the lockfile's importers), the root package name, the `reference://` deep-link scheme, and — with `--mobile` — the Expo `name`/`slug`/`scheme` and the auth client's storage prefix. Biome then re-sorts the imports the new scope reorders.
3. Without `--mobile`, deletes `apps/mobile` along with its `knip.json` workspace and the `pnpm-workspace.yaml` release-age excludes only Expo needs, and regenerates the lockfile so `pnpm install --frozen-lockfile` still works.
4. Writes the Project's `CLAUDE.md` (a pointer at the `stack-rules` skill, the tracker and the PR rule — never a copy of the conventions) and `docs/agents/` with the GitHub issue tracker and the five triage labels.
5. Drops the Loops' workflow files. Loops reach a Project from the Kit, not from files copied into it.
6. Commits, creates `Drago96/<name>` with `gh`, pushes, and creates the five triage labels.
7. Prints the resources still to provision and the wizard command.

## After it prints the hand-off

Run the wizard from the new Project's root, exactly as the hand-off says:

```bash
cd <name> && bash scripts/provision.sh
```

Nothing in the Project works before that: it has no database, no deploy identity, no Sentry DSN and no Loop tokens. Re-running the wizard is safe.

Then say what Scaffold deliberately did not decide, because only a human can:

- The app's display name, in `packages/messages/src/*.json` (`app.title`), still reads "Reference Project" in every locale.
- `EMAIL_FROM` in `apps/api/src/env.ts` and `apps/api/.env.example` still says `Reference`.
- The walking skeleton — the Note entity, the `/hello` and `/ask` endpoints — is a worked example, not the Project's domain. Replace it through the feature path (`workflows`), one ticket at a time.

## Rules

- Once per Project. Scaffold never re-runs over an existing directory and never "re-scaffolds" an existing Project; a Project takes Reference Project changes through the Sync Loop's merge, never through a fresh copy.
- Never edit the generated tree before the first commit. The commit is the shared base every later merge is measured against.
- Do not add a `--force`, a re-run mode or an "update" flag. That is the Sync Loop's job (ADR 0006).
