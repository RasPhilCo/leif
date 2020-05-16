import {exec, indentLog} from '../utils'

export interface AsserterServiceConfig {
  assertion: { apply_only_to_repos: string[] };
  dryRun: boolean;
  repoFullName: string;
  branchName: string;
  templateDir: string;
}

export default abstract class AsserterBase {
  protected assertion: any

  protected branchName: string

  protected dryRun: boolean

  protected templateDir: string

  protected repoFullName: string

  constructor({assertion, repoFullName, dryRun, branchName, templateDir}: AsserterServiceConfig) {
    this.assertion = assertion
    this.branchName = branchName
    this.templateDir = templateDir
    this.dryRun = dryRun
    this.repoFullName = repoFullName
  }

  protected get workingDir() {
    return `${process.env.HOME}/.leif/github/${this.repoFullName}`
  }

  async run() {
    // 1.
    await exec(`git -C ${this.workingDir} checkout master`) // branch from master
    try {
      await exec(`git -C ${this.workingDir} checkout ${this.branchName}`)
      indentLog(8, `Checking out branch ${this.branchName}...`)
    } catch (error) {
      if (error.toString().match(/did not match/)) {
        await exec(`git -C ${this.workingDir} checkout -b ${this.branchName}`)
        indentLog(8, `Creating branch ${this.branchName}...`)
      } else {
        throw new Error('Error creating a working branch')
      }
    }

    // 2.

    if (this.assertion.if) {
      try {
        await new Promise((res, rej) => {
          exec(this.assertion.if, (error: any, _stdout: string, _stderr: string) => {
            if (error) rej()
            res()
          })
        })
        indentLog(8, 'Passed `if` guard, continuing assertion...')
      } catch (error) {
        indentLog(8, 'Did not pass `if` guard, skipping assertion...')
        await exec(`git -C ${this.workingDir} checkout master`)
        return
      }
    }

    await this.uniqWork()

    // 3.
    const {stdout} = await exec(`git -C ${this.workingDir} status`)
    if (stdout.toString().match(/nothing to commit, working tree clean/)) {
      // if working dir clean
      indentLog(8, 'Working directory clean, no changes to push...')
    } else {
      // 4.
      await exec(`git -C ${this.workingDir} add --all`)
      await exec(`git -C ${this.workingDir} commit -m "${this.commitDescription}" -m "leif asserted state via leifyaml"`)
      indentLog(8, `Commiting changes to branch ${this.branchName}...`)
    }

    // work is done, return to master
    await exec(`git -C ${this.workingDir} checkout master`)
  }

  protected async uniqWork() {
    // not implemented==
  }

  private get commitDescription() {
    return this.assertion.description || `leif ${this.assertion.type} assertion`
  }
}
