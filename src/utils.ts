import * as util from 'util'

export const exec = util.promisify(require('child_process').exec)

export const indentLog = (spaces: number, ...loglines: string[]) => {
  loglines.forEach(line => {
    console.log(`${''.padEnd(spaces)}${line}`)
  })
}

export const syncProcessArray = async (array: any[], fn: (x: any) => void) => {
  for (let i = 0; i < array.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await fn(array[i])
  }
  return Promise.resolve()
}

export function masterBranchName(): string {
  const {stdout} = require('child_process').execSync(`git symbolic-ref --short HEAD`)
  return stdout.trim('\n')
}