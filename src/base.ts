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

abstract class AsserterBase {
  protected assertion: any

  protected configDir: string

  protected repoFullname: string

  protected github: typeof GitHubClient

  constructor(assertion: any, repoFullname: string, configDir = '.') {
    this.assertion = assertion
    this.repoFullname = repoFullname
    this.github = GitHubClient
    this.configDir = configDir
  }

  protected get pathToLocalRepo() {
    return `${process.env.HOME}/.leif/github/${this.repoFullname}`
  }

  async run(): Promise<boolean> {
    // 0. check if PR exists already
    // 1. create working branch (if it doesn't exit)
    // 2. do work
    // 3. check if work created changes
    // 4. if changes, commit changes
    // 5. push commit
    // 6. create PR

    // prework
    const workingDir = `${this.pathToLocalRepo}`
    const shasum = crypto.createHash('sha1')
    let input = JSON.stringify(this.assertion)
    if (this.assertion.type === 'file' || this.assertion.type === 'json') {
      input += fs.readFileSync(path.join(this.configDir, this.assertion.source)).toString()
    }
    shasum.update(input)
    const assertionID = shasum.digest('hex').slice(0, 8)
    const branchName = `leif-assert-${this.assertion.type}-${assertionID}`

    // 0.
    const [owner, repo] = this.repoFullname.split('/')
    const {data: pullRequests} = await this.github.pulls.list({
      owner,
      repo,
    })
    const pullReqExists = pullRequests.find((p: any) => p.head.ref === branchName)
    if (pullReqExists) {
      console.log(`leif has already pushed a PR for this assertion on branch ${branchName}...`)
      console.log('Checking for changes...')
    }

    // 1.
    try {
      await exec(`git -C ${workingDir} checkout ${branchName}`)
    } catch (error) {
      if (error.toString().match(/did not match/)) {
        await exec(`git -C ${workingDir} checkout -b ${branchName}`)
      } else {
        throw new Error('Error creating a working branch')
      }
    }

    // 2.
    await this.uniqWork()

    // 3.
    const {stdout} = await exec(`git -C ${workingDir} status`)
    if (stdout.toString().match(/nothing to commit, working tree clean/)) {
      console.log('Working directory clean, no changes to push...')
      if (!pullReqExists) {
        // if working dir clean & no PR, then clean up
        await exec(`git -C ${workingDir} checkout master`)
        await exec(`git -C ${workingDir} branch -D ${branchName} `)
      }
      return true
    }
    // 4.
    await exec(`git -C ${workingDir} add --all`)
    await exec(`git -C ${workingDir} commit -m "${this.prDescription}" -m "leif asserted state via leifconfig"`)

    // 5.
    await exec(`git -C ${workingDir} push origin ${branchName}`)

    // 6.0
    if (pullReqExists) return true
    try {
      await this.github.pulls.create({
        owner,
        repo,
        title: this.prDescription,
        head: branchName,
        base: 'master',
      })
    } catch (error) {
      console.log(error)
    }

    return true
  }

  protected async uniqWork() {
    // not implemented
  }

  private get prDescription() {
    return this.assertion.description || `leif ${this.assertion.type} assertion`
  }
}

class FileAsserter extends AsserterBase {
  protected async uniqWork() {
    await fs.copy(path.join(this.configDir, this.assertion.source), path.join(this.pathToLocalRepo, this.assertion.target))
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
    const targetJSONPath = path.join(this.pathToLocalRepo, this.assertion.target)
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
      if (!fs.existsSync(path.join(this.pathToLocalRepo, 'package.json'))) {
        console.log('No package.json file found, skipping...')
        return
      }

      if (depsToInstall && depsToInstall.length > 0) {
        await exec(`cd ${this.pathToLocalRepo}; yarn add ${depsToInstall.join('')}`)
      }

      if (devToInstall && devToInstall.length > 0) {
        await exec(`cd ${this.pathToLocalRepo}; yarn add ${devToInstall.join('')} --dev`)
      }

      if (depsToUninstall && depsToUninstall.length > 0) {
        try {
          await exec(`cd ${this.pathToLocalRepo}; yarn remove ${depsToUninstall.join('')}`)
        } catch (error) {
          if (error.toString().match(/This module isn't specified in a manifest/)) {
            // carry on
          } else {
            console.log(error)
          }
        }
      }
    }
  }
}

class AssertionService {
  static async run(assertion: any, owner: string, repos: string[], configPath: string) {
    console.log(`Running ${assertion.type} assertion...`)

    switch (assertion.type) {
    case 'dependency':
      return Promise.all(repos.map(async repo => {
        const asserter = new DependencyAsserter(assertion, `${owner}/${repo}`)
        return asserter.run()
      }))
    case 'json':
      return Promise.all(repos.map(async repo => {
        const asserter = new JSONAsserter(assertion, `${owner}/${repo}`, configPath)
        return asserter.run()
      }))
    case 'file':
      return Promise.all(repos.map(async repo => {
        const asserter = new FileAsserter(assertion, `${owner}/${repo}`, configPath)
        return asserter.run()
      }))
    default:
      console.log(`Skipping ${assertion.type} assertion...`)
      return [true]
    }
  }
}

export default abstract class extends Command {
  protected async applyAssertions(assertions: any[], owner: string, repos: string[], configDir: string) {
    for (const assertion of assertions) {
      // eslint-disable-next-line no-await-in-loop
      const output = await AssertionService.run(assertion, owner, repos, configDir)
      console.log(output)
    }

    // weird state to-do to fix:
    // remote branch, no PR, no local changes.
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
}
