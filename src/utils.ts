import * as util from 'util'
import * as fs from 'fs-extra'
import * as path from 'path'

import {Leif} from './types'
import WorkflowService from './workflows'

const yaml = require('js-yaml')

const {exec: execz, execSync} = require('child_process')

export const exec = util.promisify(execz)

export const homedir = require('os').homedir()

export const indentLog = (spaces: number, ...loglines: string[]) => {
  loglines.forEach(line => {
    console.log(`${''.padEnd(spaces)}${line}`)
  })
}

export const syncProcessArray = async (array: any[], fn: (x: any) => void) => {
  for (let i = 0; i < array.length; i++) {
    await fn(array[i])
  }
  return Promise.resolve()
}

export function masterBranchName(cwd: string): string {
  return String(execSync(`git -C ${cwd} symbolic-ref --short HEAD`)).replace('\n', '')
}

interface AnyObject {
  [key: string]: any;
}

export function deepAssign(target: AnyObject, source: AnyObject, opts?: {arrayBehavior?: 'merge' | 'concat' | 'replace' | 'unique-key-objects'}): AnyObject {
  if (typeof target !== 'object' || typeof source !== 'object') {
    return source
  }
  const behavior = opts?.arrayBehavior

  function handleUniqueKeyObjectsArray(target: any, source: any) {
    source.forEach((s: any): any => {
      let present = false
      const sourceKey = Object.keys(s)[0]
      target.forEach((t: any, index: number): any => {
        const targetKey = Object.keys(t)[0]
        if (targetKey === sourceKey) {
          target[index][targetKey] = deepAssign(target[index][targetKey], s[sourceKey], {arrayBehavior: 'unique-key-objects'})
          present = true
        }
      })
      if (!present) {
        target = target.concat(s)
      }
    })
    return target
  }

  function handleArray(target: any, source: any) {
    if (behavior === 'concat') {
      return target.concat(source)
    }
    if (behavior === 'merge') {
      return source.map((v: any, i: number) => {
        return deepAssign(target[i] || {}, v, {arrayBehavior: 'merge'})
      })
    }
    if (behavior === 'unique-key-objects') {
      const isUniqueKeyObjectsArray = target.length > 1 && target.find((t: any) => {
        return typeof t === 'object' && Object.keys(t).length === 1
      })
      if (isUniqueKeyObjectsArray) {
        return handleUniqueKeyObjectsArray(target, source)
      }
      // if not uniq keys, fallback to merge behavior
      return source.map((s: any, i: number) => {
        return deepAssign(target[i], s, {arrayBehavior: 'merge'})
      })
    }
    // replace target[key] (default behavior)
    return source
  }

  Object.keys(source).forEach(k => {
    if (source[k] && typeof source[k] === 'object') {
      // source[key] value is truthy && of type object
      // eslint-disable-next-line no-negated-condition
      if (!target[k]) {
        // key doesn't exist, just assign it
        target[k] = source[k]
      } else if (Array.isArray(target[k])) {
        // key is array, handle specially
        target[k] = handleArray(target[k], source[k])
      } else {
        // key is obj, down the rabbithole again
        const newTk = deepAssign(target[k], source[k], {arrayBehavior: behavior})
        target[k] = newTk
      }
    } else {
      // source[key] value is possible falsey || not of type object
      // replace key with source
      target[k] = source[k]
    }
  })
  return target
}

export async function readYAMLFromRelativePath(relativeFilepath: string) {
  const fileContents = await fs.readFile(path.join(process.cwd(), relativeFilepath), 'utf8')
  return yaml.load(fileContents)
}

export function filterWorkflows(preparedWorkflows: Leif.Workflow[], filters: {workflows: string[]; sequences: string[]}): Leif.Workflow[] {
  const {workflows, sequences} = filters
  preparedWorkflows = preparedWorkflows.filter(pw => {
    const shouldInclude = workflows.includes(pw.id)
    if (shouldInclude && sequences.length > 0) {
      pw.sequences = pw.sequences.filter(s => sequences.includes(s.id))
      if (pw.sequences.length === 0) throw new Error(`Could not find any matching sequences for ${sequences}`)
    }
    return shouldInclude
  })
  if (preparedWorkflows.length === 0) throw new Error(`Could not find any matching workflows for ${workflows}`)
  return preparedWorkflows
}

export async function prepareWorkflows(args: AnyObject, flags: AnyObject) {
  const dir = flags.dir === '.' ? process.cwd() : flags.dir
  const dryRun = Boolean(flags['dry-run'])

  const workflowFilepath = args.yaml
  const yamlContents = await readYAMLFromRelativePath(workflowFilepath)
  let preparedWorkflows = WorkflowService.workflowsFromYaml(yamlContents, dir, dryRun)
  const workflows = flags.workflow
  if (!flags.sequence) flags.sequence = [] // oclif should be setting an empty array, but it is not
  const sequences = flags.sequence
  const repos = flags.repo

  if (repos) {
    preparedWorkflows.forEach(w => {
      w.repos = repos
      w.sequences.forEach(s => {
        s.repos = repos
      })
    })
  }

  if (workflows) {
    preparedWorkflows = filterWorkflows(preparedWorkflows, {workflows, sequences})
  }
  return preparedWorkflows
}
