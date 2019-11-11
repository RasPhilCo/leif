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
$ npm install -g leif
$ leif COMMAND
running command...
$ leif (-v|--version|version)
leif/0.0.0 darwin-x64 node-v12.13.0
$ leif --help [COMMAND]
USAGE
  $ leif COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`leif assert`](#leif-assert)
* [`leif cleanup`](#leif-cleanup)
* [`leif help [COMMAND]`](#leif-help-command)
* [`leif list`](#leif-list)
* [`leif sync`](#leif-sync)

## `leif assert`

apply leif config to repositories

```
USAGE
  $ leif assert

OPTIONS
  -c, --config=config  (required) path to a leif config file
```

_See code: [src/commands/assert.ts](https://github.com/RasPhilCo/leif/blob/v0.0.0/src/commands/assert.ts)_

## `leif cleanup`

remove managed repos

```
USAGE
  $ leif cleanup

OPTIONS
  -c, --config=config  (required) path to a leif config file
```

_See code: [src/commands/cleanup.ts](https://github.com/RasPhilCo/leif/blob/v0.0.0/src/commands/cleanup.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `leif list`

list repository being managed

```
USAGE
  $ leif list

OPTIONS
  -c, --config=config  (required) path to a leif config file
```

_See code: [src/commands/list.ts](https://github.com/RasPhilCo/leif/blob/v0.0.0/src/commands/list.ts)_

## `leif sync`

sync managage repos

```
USAGE
  $ leif sync

OPTIONS
  -c, --config=config  (required) path to a leif config file
```

_See code: [src/commands/sync.ts](https://github.com/RasPhilCo/leif/blob/v0.0.0/src/commands/sync.ts)_
<!-- commandsstop -->
