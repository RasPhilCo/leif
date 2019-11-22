import {Command} from '@oclif/command'
import * as crypto from 'crypto'
import * as path from 'path'
import * as util from 'util'
import * as Octokit from '@octokit/rest'
import * as fs from 'fs-extra'

const yaml = require('js-yaml')

const exec = util.promisify(require('child_process').exec)

const GitHubClient = new Octokit({
  auth: process.env.GITHUB_OAUTH_TOKEN,
})

const tabLog = (spaces: number, ...logline: string[]) => {
  console.log(`${''.padEnd(spaces)}${logline.join(' ')}`)
}

const branchNameAndIDCreater = (assertion: any, configDir: string): string => {
  const shasum = crypto.createHash('sha1')
  let input = JSON.stringify(assertion)
  if (assertion.type === 'file' || assertion.type === 'json') {
    input += fs.readFileSync(path.join(configDir, assertion.source)).toString()
  }
  shasum.update(input)
  const assertionID = shasum.digest('hex').slice(0, 8)
  const branchName = `leif-assert-${assertion.type}-${assertionID}`
  return branchName
}

type AsserterSequenceMetastate = {
  first: boolean;
  last: boolean;
  current: number;
  length: number;
};

export interface Assertion {
  type: string;
  repos_to_apply?: string[];
}

export interface Sequence extends Assertion {
  type: 'sequence';
  assert: Assertion[];
}

type AsserterServiceConfig = {
  assertion: Assertion;
  branchName?: string;
  repoFullname: string;
  configDir: string;
  dryRun: boolean;
  sequence: AsserterSequenceMetastate;
}

type AssertionRunnerConfig = {
  assertion: Assertion;
  owner: string;
  configDir: string;
  dryRun: boolean;
  branchName?: string;
  sequence: AsserterSequenceMetastate;
}

type ApplySequenceAssertionsConfig = {
  assertions: Assertion[];
  owner: string;
  configDir: string;
  dryRun: boolean;
  branchName?: string;
}

type ApplySequencesConfig = {
  sequences: Sequence[];
  owner: string;
  configDir: string;
  dryRun: boolean;
}

abstract class AsserterBase {
  protected assertion: any

  protected branchName: string

  protected dryRun: boolean

  protected configDir: string

  protected repoFullname: string

  protected github: typeof GitHubClient

  protected sequence: AsserterSequenceMetastate

  constructor({assertion, configDir, dryRun, repoFullname, branchName, sequence}: AsserterServiceConfig) {
    this.assertion = assertion
    this.branchName = branchName || branchNameAndIDCreater(assertion, configDir)
    this.configDir = configDir
    this.dryRun = dryRun
    this.repoFullname = repoFullname
    this.sequence = sequence
    this.github = GitHubClient
  }

  protected get workingDir() {
    return `${process.env.HOME}/.leif/github/${this.repoFullname}`
  }

  async run(): Promise<(string | boolean)[]> {
    // console.log(this.sequence.length, this.sequence.current, this.sequence.first, this.sequence.last)
    // 0. check if PR exists already
    // 1. create working branch (if it doesn't exist)
    // 2. do work
    // 3. check if work created changes
    // 4. if changes, commit changes
    // 5. push commit
    // 6. create PR

    console.log('==', this.repoFullname, 'on', this.branchName)

    // 0.
    const [owner, repo] = this.repoFullname.split('/')
    const {data: pullRequests} = await this.github.pulls.list({
      owner,
      repo,
    })
    const pullReqExists = pullRequests.find((p: any) => p.head.ref === this.branchName)
    if (pullReqExists) {
      tabLog(5, `leif has already pushed a PR for this assertion on branch ${this.branchName}...`)
      tabLog(5, 'Checking for changes...')
    }

    // 1.
    await exec(`git -C ${this.workingDir} checkout master`) // branch from master
    try {
      await exec(`git -C ${this.workingDir} checkout ${this.branchName}`)
      tabLog(5, 'Checking out branch', this.branchName)
    } catch (error) {
      if (error.toString().match(/did not match/)) {
        await exec(`git -C ${this.workingDir} checkout -b ${this.branchName}`)
        tabLog(5, 'Creating branch', this.branchName)
      } else {
        throw new Error('Error creating a working branch')
      }
    }

    // 2.
    await this.uniqWork()

    // 3.
    const {stdout} = await exec(`git -C ${this.workingDir} status`)
    // git diff --name-status master

    if (stdout.toString().match(/nothing to commit, working tree clean/)) {
      // if working dir clean
      tabLog(5, 'Working directory clean, no changes to push...')
      // hop back to master
      await exec(`git -C ${this.workingDir} checkout master`)
      if (this.sequence.length === 1) {
        // if not a multi-assertion sequence, clean up and exit
        await exec(`git -C ${this.workingDir} branch -D ${this.branchName} `)
        return [repo, true]
      }
      if (!this.sequence.last) {
        // if sequence & not last
        // don't clean branch but exit
        return [repo, true]
      }
    } else {
      // 4.
      await exec(`git -C ${this.workingDir} add --all`)
      await exec(`git -C ${this.workingDir} commit -m "${this.commitDescription}" -m "leif asserted state via leifconfig"`)
      tabLog(5, 'Commiting changes to branch...')
    }
    // work is done, return to master
    await exec(`git -C ${this.workingDir} checkout master`)

    // *********
    // we should only reach here if:
    // 1.) we just made a commit to the working branch in step 3
    // OR
    // 2.) we're in a sequence and this is the last assertion in step 3
    // *********

    // bail on --dry-run for ALL scenarios
    // but also delete working branch
    // 1) if not in a sequence (i.e. the end)
    // OR
    // 2) or last in a sequence (i.e. the end)
    if (this.dryRun) {
      if (this.sequence.last) await exec(`git -C ${this.workingDir} branch -D ${this.branchName}`)
      return [repo, true]
    }

    // 5.
    await exec(`git -C ${this.workingDir} push origin ${this.branchName}`)
    tabLog(5, 'Pushing branch to GitHub...')

    // 6.0
    if (pullReqExists || !this.sequence.last) return [repo, true]
    try {
      tabLog(5, 'Creating PR...')
      await this.github.pulls.create({
        owner,
        repo,
        title: this.prDescription,
        head: this.branchName,
        base: 'master',
      })
    } catch (error) {
      console.log(error)
    }

    return [repo, true]
  }

  protected async uniqWork() {
    // not implemented==
  }

  private get prDescription() {
    return (this.sequence.length > 1 && 'leif sequence assertion') || this.assertion.description || `leif ${this.assertion.type} assertion`
  }

  private get commitDescription() {
    return this.assertion.description || `leif ${this.assertion.type} assertion`
  }
}

class FileAsserter extends AsserterBase {
  protected async uniqWork() {
    if (this.assertion.source) {
      await fs.copy(path.join(this.configDir, this.assertion.source), path.join(this.workingDir, this.assertion.target))
    } else {
      await fs.remove(path.join(this.workingDir, this.assertion.target))
    }
  }
}
class JSONAsserter extends AsserterBase {
  protected async uniqWork() {
    const sourceJSON = require(path.join(this.configDir, this.assertion.source))
    const deepAssign = (target: any, source: any) => {
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
    const targetJSONPath = path.join(this.workingDir, this.assertion.target)
    const targetJSON = require(targetJSONPath)
    const assertedJSON = deepAssign({...targetJSON}, sourceJSON)
    await fs.writeFile(targetJSONPath, JSON.stringify(assertedJSON, null, 2) + '\n')
  }
}

class DependencyAsserter extends AsserterBase {
  protected async uniqWork() {
    const depsToInstall = this.assertion.dependencies
    const devToInstall = this.assertion.dev_dependencies
    const depsToUninstall = this.assertion.removed

    if (this.assertion.manager === 'yarn') {
      if (!fs.existsSync(path.join(this.workingDir, 'package.json'))) {
        console.log('No package.json file found, skipping...')
        return
      }

      if (depsToInstall && depsToInstall.length > 0) {
        await exec(`cd ${this.workingDir}; yarn add ${depsToInstall.join(' ')}`)
      }

      if (devToInstall && devToInstall.length > 0) {
        await exec(`cd ${this.workingDir}; yarn add ${devToInstall.join(' ')} --dev`)
      }

      if (depsToUninstall && depsToUninstall.length > 0) {
        try {
          await exec(`cd ${this.workingDir}; yarn remove ${depsToUninstall.join(' ')}`)
        } catch (error) {
          if (error.toString().match(/This module isn't specified in a/)) {
            // carry on
          } else {
            console.log(error)
          }
        }
      }
    }
  }
}

class MultiRepoAssertionRunner {
  static async run({assertion, owner, configDir, dryRun, branchName, sequence}: AssertionRunnerConfig) {
    console.log(`> Running ${assertion.type} assertion`)
    const repos = assertion.repos_to_apply!

    const summary = []
    switch (assertion.type) {
    case 'dependency':
      for (const repo of repos) {
        const asserter = new DependencyAsserter({
          assertion,
          repoFullname: `${owner}/${repo}`,
          configDir,
          dryRun,
          branchName,
          sequence,
        })
        // eslint-disable-next-line no-await-in-loop
        const result = await asserter.run()
        summary.push(result)
      }
      break
    case 'json':
      for (const repo of repos) {
        const asserter = new JSONAsserter({
          assertion,
          repoFullname: `${owner}/${repo}`,
          configDir,
          dryRun,
          branchName,
          sequence,
        })
        // eslint-disable-next-line no-await-in-loop
        const result = await asserter.run()
        summary.push(result)
      }
      break
    case 'file':
      for (const repo of repos) {
        const asserter = new FileAsserter({
          assertion,
          repoFullname: `${owner}/${repo}`,
          configDir,
          dryRun,
          branchName,
          sequence,
        })
        // eslint-disable-next-line no-await-in-loop
        const result = await asserter.run()
        summary.push(result)
      }
      break
    default:
      console.log(`Skipping ${assertion.type} assertion...`)
      console.log(assertion)
    }
    return summary
  }
}

export default abstract class extends Command {
  protected async applySequenceAssertions({assertions, owner, configDir, dryRun, branchName}: ApplySequenceAssertionsConfig) {
    const sequenceLength = assertions.length
    const sequence: any = {
      length: sequenceLength,
    }

    for (let i = 0; i < sequenceLength; i++) {
      sequence.current = i + 1
      sequence.first = i + 1 === 1
      sequence.last = i + 1 === sequenceLength
      const assertion = assertions[i]
      // eslint-disable-next-line no-await-in-loop
      const outputs = await MultiRepoAssertionRunner.run({
        assertion,
        owner,
        configDir,
        dryRun,
        branchName,
        sequence,
      })
      console.log('== assertion summary')
      outputs?.forEach((o: any[]) => {
        tabLog(2, o[0], ':', o[1])
      })
      console.log('')
    }

    // weird state to fix:
    // remote branch present, no PR in github, no local changes/wd clean.
  }

  protected async applySequences({sequences, owner, configDir, dryRun}: ApplySequencesConfig) {
    for (const seq of sequences) {
      if (!this.validateSequence(seq)) return
      console.log('Running sequence assertions...')
      // eslint-disable-next-line no-await-in-loop
      await this.applySequenceAssertions({
        assertions: seq.assert,
        owner,
        configDir,
        dryRun,
        branchName: branchNameAndIDCreater(seq, configDir),
      })
    }

    // weird state to fix:
    // remote branch present, no PR in github, no local changes/wd clean.
  }

  protected readConfig(file: string) {
    const configPath = path.join(process.cwd(), file)
    const configDir = configPath.replace(file.split('/')[file.split('/').length - 1], '')
    try {
      const fileContents = fs.readFileSync(configPath, 'utf8')
      const data = yaml.safeLoad(fileContents)
      data.configPath = configPath
      data.configDir = configDir
      return data
    } catch (error) {
      console.log(error)
    }
  }

  private validateSequence(seq: {type: string; assert: any[]}): boolean {
    if (seq.type && seq.assert) return true
    return false
  }
}

// (Schema | Assertion | Sequence)[] => Sequence(Assetions)[] => applySequences => applyAssertions
