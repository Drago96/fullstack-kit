# Loops run in each Project's GitHub Actions, on a cron, using the Claude subscription

A Loop is a scheduled GitHub Actions workflow in the Project repo (cron, every 6 hours) running the official Claude Code action. It authenticates with a `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`, so it draws from the Claude subscription and keeps the stack free; there is no API billing. A Loop may open a pull request with a fix and tests. It never merges or deploys. Running Loops locally or as Claude cloud routines was rejected: CI lives next to the code it fixes, already holds repo credentials, and runs while the laptop is closed.

Amended by ADR 0008: the Review Loop does merge, via GitHub auto-merge once CI and its review are green.

Superseded by ADR 0009: Loops run on demand from the owner's terminal, not in GitHub Actions.
