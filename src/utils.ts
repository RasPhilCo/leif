import * as util from 'util'

const {exec: execz, execSync} = require('child_process')

export const exec = util.promisify(execz)

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
