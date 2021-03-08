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

export function deepAssign(target: AnyObject, source: AnyObject): AnyObject {
  Object.keys(source).forEach(k => {
    if (typeof source[k] === 'object') {
      // eslint-disable-next-line no-negated-condition
      if (!target[k]) {
        // doesn't exist, just assign it
        target[k] = source[k]
      } else {
        const newTk = deepAssign(target[k], source[k])
        target[k] = newTk
      }
    } else {
      target[k] = source[k]
    }
  })
  return target
}
