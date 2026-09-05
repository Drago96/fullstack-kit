# Loops run on demand, not in CI

Supersedes ADR 0004 (Loops run in each Project's GitHub Actions, on a cron, using the Claude subscription).

A Loop scheduled in GitHub Actions runs whether or not anyone wants it: it burns subscription quota on a cron, opens PRs nobody asked for that hour, and needs a `CLAUDE_CODE_OAUTH_TOKEN` sitting in every Project's secrets. The laptop-closed argument that carried ADR 0004 turned out to be worth less than the control.

So a Loop is now a skill the owner runs on demand, in a checkout with `gh` authenticated: `/review-loop <pr>`, `/kit-loop [issue]`, `/error-loop` in a separate terminal, or launched as a subagent from an interactive session. No cron, no `workflow_dispatch`, no Claude token in GitHub. The three Loop workflows and the two Reference callers are deleted; `ci.yml`, `publish-reference.yml` and the deploy workflows stay.

Consequences: the Loops keep their behaviour and their boundaries — the Kit Loop implements one triaged issue per run, the Error Loop one PR per Sentry issue, the Review Loop still gates every PR and merges on `pass` (ADR 0008) — but nothing runs unattended, so nothing happens while nobody is watching. `Reference Project` is the only required check; `Review Loop` no longer exists as a status check, so the review's verdict is enforced by the owner's own run rather than by branch protection. Sentry credentials for the Error Loop now live in the owner's shell, not in GitHub secrets. `REVIEW_LOOP_GH_TOKEN` stays, because `publish-reference.yml` pushes `reference/`, which carries workflow files.
