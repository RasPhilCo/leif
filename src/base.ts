import {Command} from '@oclif/command'
import * as crypto from 'crypto'
import * as path from 'path'
import * as util from 'util'

const fs = require('fs-extra')
const yaml = require('js-yaml')
const Octokit = require('@octokit/rest')

const exec = util.promisify(require('child_process').exec)

const GitHubClient = new Octokit({
  auth: process.env.GITHUB_OAUTH_TOKEN,
})

abstract class AsserterBase {
  protected assertion: any

  protected repoFullname: string

  protected github: typeof GitHubClient

  constructor(assertion: any, repoFullname: string) {
    this.assertion = assertion
    this.repoFullname = repoFullname
    this.github = GitHubClient
  }

  protected pathToLocalRepo(repoFullname: string) {
    return `${process.env.HOME}/.keef/github/${repoFullname}`
  }

  async run() {
    // 0. check if PR exists already
    // 1. create working branch (if it doesn't exit)
    // 2. do work
    // 3. check if work created changes
    // 4. if changes, commit changes
    // 5. push commit
    // 6. create PR

    // prework
    const workingDir = `${this.pathToLocalRepo(this.repoFullname)}`
    const shasum = crypto.createHash('sha1')
    let input = JSON.stringify(this.assertion)
    if (this.assertion.type === 'file') {
      input += fs.readFileSync(this.assertion.source).toString()
    }
    shasum.update(input)
    const assertionID = shasum.digest('hex').slice(0, 8)
    const branchName = `keef-assert-${this.assertion.type}-${assertionID}`

    // 0.
    const [owner, repo] = this.repoFullname.split('/')
    const {data: pullRequests} = await this.github.pulls.list({
      owner,
      repo,
    })
    const pullReqExists = pullRequests.find(p => p.head.ref === branchName)
    if (pullReqExists) {
      console.log(`Keef has already pushed a PR for this assertion on branch ${branchName}...`)
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
      return
    }
    // 4.
    await exec(`git -C ${workingDir} add --all`)
    await exec(`git -C ${workingDir} commit -m "${this.assertion.description}" -m "keef asserted state via keefconfig"`)

    // 5.
    await exec(`git -C ${workingDir} push origin ${branchName}`)

    // 6.
    if (pullReqExists) return
    this.github.pulls.create({
      owner,
      repo,
      title: this.assertion.description,
      head: branchName,
      base: 'master',
    })
  }

  protected async uniqWork() {
    // not implemented
  }
}

class FileAsserter extends AsserterBase {
  protected async uniqWork() {
    await fs.copy(this.assertion.source, path.join(`${this.pathToLocalRepo(this.repoFullname)}`, this.assertion.target))
  }
}

class AssertionService {
  static run(assertion: any, owner: string, repos: string[]) {
    switch (assertion.type) {
    case 'file':
      repos.forEach(async repo => {
        const asserter = new FileAsserter(assertion, `${owner}/${repo}`)
        console.log(`Running ${assertion.type} assertion...`)
        await asserter.run()
      })
      break
    default:
      console.log(`Skipping ${assertion.type} assertion...`)
    }
  }
}

export default abstract class extends Command {
  protected applyAssertion(assertion: any, owner: string, repos: string[]) {
    AssertionService.run(assertion, owner, repos)
  }

  protected readConfig(file: string) {
    try {
      const fileContents = fs.readFileSync(file, 'utf8')
      const data = yaml.safeLoad(fileContents)
      return data
    } catch (error) {
      console.log(error)
    }
  }
}
