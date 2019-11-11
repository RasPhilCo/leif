keef
====

multi-repo syncronization &amp; management tool

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/keef.svg)](https://npmjs.org/package/keef)
[![CircleCI](https://circleci.com/gh/RasPhilCo/keef/tree/master.svg?style=shield)](https://circleci.com/gh/RasPhilCo/keef/tree/master)
[![Codecov](https://codecov.io/gh/RasPhilCo/keef/branch/master/graph/badge.svg)](https://codecov.io/gh/RasPhilCo/keef)
[![Downloads/week](https://img.shields.io/npm/dw/keef.svg)](https://npmjs.org/package/keef)
[![License](https://img.shields.io/npm/l/keef.svg)](https://github.com/RasPhilCo/keef/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g keef
$ keef COMMAND
running command...
$ keef (-v|--version|version)
keef/0.0.0 darwin-x64 node-v12.13.0
$ keef --help [COMMAND]
USAGE
  $ keef COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`keef assert`](#keef-assert)
* [`keef help [COMMAND]`](#keef-help-command)
* [`keef list`](#keef-list)
* [`keef sync`](#keef-sync)

## `keef assert`

apply keef config to repositories

```
USAGE
  $ keef assert

OPTIONS
  -c, --config=config  (required) path to a keef config file
```

_See code: [src/commands/assert.ts](https://github.com/RasPhilCo/keef/blob/v0.0.0/src/commands/assert.ts)_

## `keef help [COMMAND]`

display help for keef

```
USAGE
  $ keef help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `keef list`

list repository being managed

```
USAGE
  $ keef list

OPTIONS
  -c, --config=config  (required) path to a keef config file
```

_See code: [src/commands/list.ts](https://github.com/RasPhilCo/keef/blob/v0.0.0/src/commands/list.ts)_

## `keef sync`

sync repository being managed locally

```
USAGE
  $ keef sync

OPTIONS
  -c, --config=config  (required) path to a keef config file
```

_See code: [src/commands/sync.ts](https://github.com/RasPhilCo/keef/blob/v0.0.0/src/commands/sync.ts)_
<!-- commandsstop -->
