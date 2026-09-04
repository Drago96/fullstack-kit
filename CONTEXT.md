# Personal Fullstack Kit

A Claude Code plugin holding the skills, workflows and loops used to build and run personal full-stack production-ready projects. Installed once, consumed from every project.

## Language

**Skill**:
One self-contained instruction set that Claude Code loads to do one kind of task.
_Avoid_: Prompt, command, recipe

**Workflow**:
A named, ordered path through skills, written as prose (e.g. idea → spec → tickets → implement).
_Avoid_: Pipeline, flow, process, orchestration script

**Loop**:
A fully automated, unattended run of a skill that watches a signal and acts on it repeatedly (e.g. watch production errors, fix them).
_Avoid_: Ralph loop, agent, bot, cron job

**Project**:
One application generated from the Kit and living in its own repository.
_Avoid_: App, service, instance

**Contract**:
The shared package of Zod schemas that defines every API request and response. Everything else (OpenAPI spec, typed client) derives from it.
_Avoid_: API types, DTOs, swagger spec

**Scaffold**:
The skill that generates a new Project by copying and renaming the Reference Project.
_Avoid_: Template, boilerplate, starter, generator

**Reference Project**:
The one real, CI-green monorepo inside the Kit that every Project starts from.
_Avoid_: Template, example app, demo

**Stack Rules**:
The document in the Kit (`STACK-RULES.md`) holding the conventions every Project follows (module shape, Contract-first endpoints, migrations, deploy). Projects point at it; they never copy it. Its numbered hard rules are what the Review Loop blocks on.
_Avoid_: Guidelines, best practices, conventions doc

## Self-improvement

**Lesson**:
A candidate improvement to the Kit discovered while working on a Project.
_Avoid_: Feedback, learning, note, TODO

**Harvest**:
Capturing a Lesson as a GitHub issue on the Kit, from inside a Project session, either on request or when prompted at a phase boundary.
_Avoid_: Sync back, upstream, report

**Kit Loop**:
The Loop on the Kit repo that turns `ready-for-agent` Lessons into pull requests. Triage stays human.
_Avoid_: Self-learning loop, auto-improve

**Sync Loop**:
The Loop in every Project that merges the Kit's latest Reference Project into the Project as a pull request.
_Avoid_: Update, upgrade, pull from kit

**Review Loop**:
The Loop that reviews every pull request against Stack Rules and its linked issue, fixes what it can, and merges when CI and the review are green. Hands a PR to a human only when it cannot get it green.
_Avoid_: Auto-merge bot, PR bot, code review action

**Finding**:
One reviewer observation on a pull request. Blocking Findings (a Spec gap or a hard Stack Rule violation) stop a merge; smells do not.
_Avoid_: Comment, nit, issue, violation

**Fix Round**:
One agent attempt to resolve the blocking Findings on a pull request by pushing to its branch. A PR gets at most two.
_Avoid_: Retry, iteration, re-review

## Testing

**E2E Test**:
A Playwright test driving a real browser against the whole running stack (Next, Nest, Postgres). Blocks merge on every PR, including Loop PRs.
_Avoid_: Integration test, browser test, e2e-spec

**API Test**:
An HTTP test against a running Nest with a real database, in `*.api-spec.ts` files. Blocks merge.
_Avoid_: E2E test, e2e-spec, integration test
