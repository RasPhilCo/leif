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
* [Assertion types (Assertors)](#assertions)
* [Example leif.yml](#leif.yml)
* [CLI Usage](#usage)
* [CLI Commands](#commands)
<!-- tocstop -->
# About
Leif, best explained through its history, was born out of needs arising from managing the oclif CLI project (Leif itself is an oclif CLI).

The oclif GitHub organization contains roughly 50 repos. On occasion, we need to perform the same small task in every repo, like updating the open-source license file. Secondly, as a NodeJS project, a lot of the oclif repos have very similiar state (think: dependencies, package.json properties, testing configs, etc) which, over time, would drift slightly from one-another over the natural course of many folks developing them and we need to be have them all be brought back inline.

Leif performs these time consuming tasks for us.

To run Leif, you need the Leif CLI (this repo) and a leif.yml file. The leif.yml is where you will define repos from a GitHub org and assertions. An assertion is explicit state about a repo, "state" here refers to both git commitable changes and also GitHub repo properites. When run, Leif will read the provided leif.yml file and check that each repo has the defined state. If not, Leif creates a PR to the repo with the applicable changes or sets the GitHub repo property via the GitHub API, i.e. _Leif asserts explicit state on repos_.

With Leif, we now define one-off changes to our repos in our leif.yml file, run the `leif` CLI and _assert_ them on every repo in the org within minutes. Coupled with a cron executor, like CicleCI, Leif can run on a regular candence and ensure repos do not drift from a desired defined state. Maintenance bliss!

# Definitions
**Assertion** - A user defined state on a repo. Users define assertions using of the many [Assertion types](#assertion-types). If the repo's state differs from the assertion, leif commits the changes; an Assertion becomes a single commit.

**Sequence** - A logical grouping of one or more assertions. Leif allows us to chain many assertions into a sequenece and run them all syncronously. Leif.yml can have one or many sequences. A Sequence becomes a PR.

**Workflow** - A workflow marries repos with sequences, it is where users define which sequences run on which repos. Leif.yml can have one or many workflows.

**Repo groups** - A logical grouping of repos in the same GitHub org, ex: Core repos, documation repos, forked repos, etc.
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
