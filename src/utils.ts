import * as util from 'util'

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

function transformArrayToObject(source: AnyObject) {
  if (Array.isArray(source) && source.map(s => typeof s === 'object').reduce((a, b) => a && b, true)) {
    return source.reduce((a, b) => Object.assign(a, b), {})
  }
  return source
}

export function deepAssign(target: AnyObject, source: AnyObject): AnyObject {
  const tt = transformArrayToObject(target)
  const st = transformArrayToObject(source)
  Object.keys(st).forEach(k => {
    if (typeof source[k] === 'object') {
      // eslint-disable-next-line no-negated-condition
      if (!Reflect.has(tt, k)) {
        // doesn't exist, just assign it
        tt[k] = st[k]
      } else {
        const newTk = deepAssign(tt[k], st[k])
        target[k] = newTk
      }
    } else {
      tt[k] = st[k]
    }
  })
  return target
}
