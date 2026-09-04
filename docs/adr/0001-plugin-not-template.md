# The Kit is a Claude Code plugin, not a cloned template

Despite the repo name, this is not a starter you copy to begin a project. It is a Claude Code plugin (skills, workflows, loops) installed once and used from every Project, plus a Scaffold skill that generates a new Project into its own repo. The plugin composes already-installed plugins (superpowers, mattpocock-skills, ponytail, frontend-design) rather than vendoring them; the dependency list lives in this repo.

Scaffold copies the Reference Project, a real monorepo kept green by this repo's CI, rather than driving the official CLIs step by step. Copying a tree that CI proved green is deterministic; forty agent-driven CLI steps are not. The staleness risk of a copied template is handled by the CI, not by avoiding copying.
