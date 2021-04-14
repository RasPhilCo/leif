leif
====

multi-repo syncronization &amp; management tool

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/leif.svg)](https://npmjs.org/package/leif)
[![CircleCI](https://circleci.com/gh/RasPhilCo/leif/tree/master.svg?style=shield)](https://circleci.com/gh/RasPhilCo/leif/tree/master)
[![Codecov](https://codecov.io/gh/RasPhilCo/leif/branch/master/graph/badge.svg)](https://codecov.io/gh/RasPhilCo/leif)
[![Downloads/week](https://img.shields.io/npm/dw/leif.svg)](https://npmjs.org/package/leif)
[![License](https://img.shields.io/npm/l/leif.svg)](https://github.com/RasPhilCo/leif/blob/master/package.json)

<!-- toc -->
* [About](#about)
* [Definitions](#definitions)
* [Example leif.yml](#example-leifyml)
* [Assertions](#assertions)
* [CLI Usage](#usage)
* [CLI Commands](#commands)
<!-- tocstop -->
# About
Leif was born out of needs arising from managing the [oclif](https://github.com/oclif) CLI project (stylized "leif", itself an oclif CLI).

The oclif GitHub organization contains roughly 50 repositories. On occasion, we need to perform the same small task in every repo, such as updating the open-source license file. Secondly, as a NodeJS project, a lot of the oclif repos have very similiar state (think: dependencies, package.json properties, testing configs, etc) which, over time, drift slightly from one-another. This is natural entropy with many developers working in the project, so also occasionally we need to bring them all back into line.

Leif performs these time consuming tasks for us. We define state changes to our repos in a `leif.yml` file, run the `leif` CLI and _assert_ them on every repo in the org within minutes. Coupled with a cron executor, like CicleCI, leif runs on a regular candence and ensures our repos do not drift from the desired defined state. Maintenance bliss!

For you to run leif, you need the `leif` CLI (this repo), a `leif.yml` file and a GitHub API token with read/write access to your repos. The `leif.yml` file (see the [example](#example-leif.yml) below) is where you list GitHub repos names and define assertions. An assertion is explicit state about a repo. "State", as used here, means directories, files and GitHub repo properties. When run, the `leif` CLI will read the `leif.yml` file and check that each listed repo has the defined state. If not, leif creates a PR to the repo with the applicable changes or sets the GitHub repo property via the GitHub API.

_Leif asserts explicit state on repos_.

# Definitions
**assertion** - A user defined state of a repo. Users define assertions using of the many [Assertion types](#assertions). If the repo's state differs from the assertion, leif commits the changes; an assertion becomes a single commit.

**sequence** - A logical grouping of one or more assertions. Leif allows us to chain many assertions into a sequenece and run them all syncronously. `leif.yml` can have one or many sequences. A sequence becomes a GitHub PR.

**workflow** - A workflow marries repos with sequences. With workflows, users define which sequences run on which repos. `leif.yml` can have one or many workflows.

**repo groups** - A logical grouping of repos in the same GitHub org, ex: core repos, documentation repos, forked repos, etc.

# Example leif.yml
```yaml
---
repos:
  - rasphilco/leif
  - group: foo-example-org
    github_org: foo-example
    repos:
      - bar
      - baz
sequences:
  sync-package.json:
    description: 'sync pjson properties'
    assertions:
      - type: json-has-properties
        description: 'updating properties'
        source_relative_filepath: state/package.json
        target_relative_filepath: package.json
  sync-dependabot:
    description: 'sync dependabot.yml'
    assertions:
      - type: file-is-exact
        description: 'updating dependabot'
        source_relative_filepath: state/dependabot.yml
        target_relative_filepath: .github/dependabot.yml

workflows:
  sync-repo:
    apply_to_repos:
      - rasphilco/leif
    apply_to_groups:
      - foo-example-org
    sequences:
      - test-assertions
      - sync-dependabot
```

# Assertions

* [file-does-not-exist](#type-file-does-not-exist)
* [file-is-exact](#type-file-is-exact)

#### type: file-does-not-exist

Property | Example | Description
--- | --- | ---
description | `remove old LICENSE` | describe what is transpiring, which will become the commit message
if | `test -e "./new/LISCENSE.txt"` | assertion only runs if this bash expression returns successfully
target_relative_filepath (required) | `./old/LICENSE.txt` | relative filepath to target file (relative to repo root)

#### type: file-is-exact

Property | Example | Description
--- | --- | ---
description | `add LICENSE` | describe what is transpiring, which will become the commit message
if | `foo` | assertion only runs if this bash expression (run at the repo root) returns successfully
source_relative_filepath (required) | `path/to/LICENSE.txt` | relative filepath to source file (relative to the cwd where leif is ran)
target_relative_filepath (required) | `LICENSE.txt` | relative filepath to target file (relative to repo root)

# Usage
<!-- usage -->
```sh-session
$ npm install -g @rasphilco/leif
$ leif COMMAND
running command...
$ leif (-v|--version|version)
@rasphilco/leif/0.8.0 darwin-x64 node-v12.14.1
$ leif --help [COMMAND]
USAGE
  $ leif COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`leif cleanup [SCOPE]`](#leif-cleanup-scope)
* [`leif help [COMMAND]`](#leif-help-command)
* [`leif run YAML`](#leif-run-yaml)

## `leif cleanup [SCOPE]`

remove managed repos

```
USAGE
  $ leif cleanup [SCOPE]

ARGUMENTS
  SCOPE  scope of repos to remove
```

_See code: [src/commands/cleanup.ts](https://github.com/RasPhilCo/leif/blob/v0.8.0/src/commands/cleanup.ts)_

## `leif help [COMMAND]`

display help for leif

```
USAGE
  $ leif help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.1/src/commands/help.ts)_

## `leif run YAML`

run leif state workflows

```
USAGE
  $ leif run YAML

ARGUMENTS
  YAML  path to a leif yaml file

OPTIONS
  -d, --dry-run            view output without committing changes
  -f, --dir=dir            (required) [default: .] absolute path to directory with supporting files
  -s, --sequence=sequence  run a specific sequence in a workflow
  -w, --workflow=workflow  run a specific workflow instead of all workflows
```

_See code: [src/commands/run.ts](https://github.com/RasPhilCo/leif/blob/v0.8.0/src/commands/run.ts)_
<!-- commandsstop -->
