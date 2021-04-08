import {exec, indentLog, masterBranchName} from '../utils'

export interface AsserterServiceConfig {
  assertion: { apply_only_to_repos: string[] };
  dryRun: boolean;
  repoFullName: string;
  branchName: string;
  templateDir: string;
  workingDir: string;
}

export default abstract class AsserterBase {
  protected assertion: any

  protected branchName: string

  protected dryRun: boolean

  protected templateDir: string

  protected repoFullName: string

  protected mainBranchName: string

  protected workingDir: string

  constructor({assertion, repoFullName, dryRun, branchName, templateDir, workingDir}: AsserterServiceConfig) {
    this.assertion = assertion
    this.branchName = branchName
    this.templateDir = templateDir
    this.workingDir = workingDir
    this.dryRun = dryRun
    this.repoFullName = repoFullName
    this.mainBranchName = masterBranchName(this.workingDir)
  }

  async run() {
    // 1.
    await exec(`git -C ${this.workingDir} checkout ${this.mainBranchName}`) // branch from master/main
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
        await exec(`cd ${this.workingDir} && ${this.assertion.if}`)
        indentLog(8, 'Passed `if` guard, continuing assertion...')
      } catch (error) {
        indentLog(8, 'Did not pass `if` guard, skipping assertion...')
        await exec(`git -C ${this.workingDir} checkout ${this.mainBranchName}`)
        return
      }
    }

    const result = await this.uniqWork()
    if (result) {
      indentLog(8, result)
    }

    if (this.assertion.post_steps) {
      indentLog(8, 'Running post assertion steps')
      const steps: string[] = Array.isArray(this.assertion.post_steps) ?
        this.assertion.post_steps :
        [this.assertion.post_steps]
      for (const step of steps) {
        indentLog(10, step)
        await exec(step, {cwd: this.workingDir})
      }
    }

    // 3.
    const {stdout} = await exec(`git -C ${this.workingDir} status`)
    if (stdout.toString().match(/nothing to commit, working tree clean/)) {
      // if working dir clean
      indentLog(8, 'Working directory clean, no changes to push...')
    } else {
      // 4.
      await exec(`git -C ${this.workingDir} add --all`)
      await exec(`git -C ${this.workingDir} commit -m "${this.commitDescription}" -m "Authored via Leif" --no-verify`)
      indentLog(8, `Commiting changes to branch ${this.branchName}...`)
    }

    // work is done, return to master/main
    await exec(`git -C ${this.workingDir} checkout ${this.mainBranchName}`)
  }

  protected abstract uniqWork(): Promise<string | void>;

  private get commitDescription() {
    return this.assertion.description || `leif ${this.assertion.type} assertion`
  }
}
