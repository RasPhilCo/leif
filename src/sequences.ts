import * as Octokit from '@octokit/rest'

import {AsserterLookup} from './asserters'
import {Leif} from './types'
import {exec, indentLog} from './utils'

const GitHubClient = new Octokit({
  auth: process.env.GITHUB_OAUTH_TOKEN,
})

export default class SequenceService {
  static async runMany(seq: Leif.Sequence[]) {
    await Promise.all(seq.map(async s => {
      await SequenceService.run(s)
    }))
  }

  static async run(seq: Leif.Sequence) {
    indentLog(0, `# Running sequence ${seq.id}`, '')
    indentLog(0, `## With ${seq.assertions.length} assertions: `)
    indentLog(2, ...seq.assertions.map((a: Leif.Assertion) => '- ' + a.description || a.type), '')
    indentLog(2, 'On repos:')
    indentLog(2, ...seq.repos, '')

    for (const repoFullName of seq.repos) {
      // eslint-disable-next-line no-await-in-loop
      await SequenceService.applyAssertionsToRepo(repoFullName, seq)
    }
  }

  static async applyAssertionsToRepo(repoFullName: string, sequence: Leif.Sequence) {
    // 0. check if PR exists already
    // 1. create working branch (if it doesn't exist)
    // 2. do work
    // 3. check if work created changes
    // 4. if changes, commit changes
    // 5. push commit
    // 6. create PR

    // pre-work
    const sequenceLength = sequence.assertions.length
    const workingDir = `${process.env.HOME}/.leif/github/${repoFullName}`
    const prDescription = sequence.description || `leif sequence ${sequence.id}`
    const branchName = sequence.id
    const dryRun = sequence.dryRun

    indentLog(4, repoFullName)

    // 0.
    const [owner, repoShortName] = repoFullName.split('/')
    const {data: pullRequests} = await GitHubClient.pulls.list({
      owner,
      repo: repoShortName,
    })
    const pullReqExists = pullRequests.find((p: any) => p.head.ref === branchName)
    if (pullReqExists) {
      indentLog(6, `leif has already pushed a PR for this assertion on branch ${branchName}...`)
      indentLog(6, 'But checking for changes...')
    }

    // 1. & 2. & 3. & 4.
    // moved inside asserter service

    const meta: any = {
      length: sequenceLength,
    }
    for (let i = 0; i < sequenceLength; i++) {
      meta.current = i + 1
      meta.first = i + 1 === 1
      meta.last = i + 1 === sequenceLength
      const assertion = sequence.assertions[i]
      sequence = Object.assign(sequence, meta)
      // eslint-disable-next-line no-await-in-loop
      indentLog(6, `Assert: ${assertion.description} (type: ${assertion.type})`)

      const Asserter = AsserterLookup[assertion.type]
      const asserter = new Asserter({
        assertion,
        repoFullName,
        dryRun,
        branchName,
        templateDir: sequence.templateDir,
      })
      // eslint-disable-next-line no-await-in-loop
      await asserter.run()
    }

    // 5.
    let skipCreatingPR = false
    const {stdout} = await exec(`git -C ${workingDir} diff ${branchName} origin/master --name-only`)
    if (stdout) {
      if (dryRun) {
        // clean-up dryRun
        indentLog(6, '(In --dry-run mode, output below does not actually happen)')
        if (meta.last) {
          await exec(`git -C ${workingDir} branch -D ${branchName}`)
        }
      } else {
        await exec(`git -C ${workingDir} push origin ${branchName}`)
      }
      indentLog(6, `Pushing branch ${branchName} to GitHub...`)
    } else {
      skipCreatingPR = true
      indentLog(6, `Deleting empty branch ${branchName}...`)
      await exec(`git -C ${workingDir} branch -D ${branchName} `)
    }

    // 6.0
    if (pullReqExists || skipCreatingPR || !meta.last) return indentLog(0, '')
    try {
      indentLog(6, 'Creating PR...')
      if (!dryRun) {
        await GitHubClient.pulls.create({
          owner,
          repo: repoShortName,
          title: prDescription,
          head: branchName,
          base: 'master',
        })
      }
    } catch (error) {
      console.error(error)
    }

    indentLog(0, '')
  }
}

