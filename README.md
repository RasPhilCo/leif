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
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @rasphilco/leif
$ leif COMMAND
running command...
$ leif (-v|--version|version)
@rasphilco/leif/0.6.0 darwin-x64 node-v12.14.1
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

_See code: [src/commands/cleanup.ts](https://github.com/RasPhilCo/leif/blob/v0.6.0/src/commands/cleanup.ts)_

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

_See code: [src/commands/run.ts](https://github.com/RasPhilCo/leif/blob/v0.6.0/src/commands/run.ts)_
<!-- commandsstop -->
