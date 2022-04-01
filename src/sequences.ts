import {Octokit} from '@octokit/rest'

import {AsserterLookup} from './asserters'
import {Leif} from './types'
import {exec, indentLog, syncProcessArray, masterBranchName, homedir} from './utils'

const GitHubClient = new Octokit({
  auth: process.env.GITHUB_OAUTH_TOKEN || process.env.GITHUB_TOKEN,
})

export default class SequenceService {
  static async runMany(seqs: Leif.Sequence[]) {
    await syncProcessArray(seqs, SequenceService.run)
  }

  static async run(seq: Leif.Sequence) {
    indentLog(0, `# Running sequence ${seq.id}`, '')
    indentLog(0, `## With ${seq.assertions.length} assertions: `)
    indentLog(2, ...seq.assertions.map((a: Leif.Assertion) => '- ' + a.description || a.type), '')
    indentLog(2, 'On repos:')
    indentLog(2, ...seq.repos, '')

    for (const repoFullName of seq.repos) {
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
    const workingDir = `${homedir}/.leif/github/${repoFullName}`
    const prDescription = sequence.description || `leif sequence ${sequence.id}`
    const branchName = sequence.branch_name || sequence.id
    const dryRun = sequence.dryRun
    const masterMain = masterBranchName(workingDir)

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
    await SequenceService.runAssertions(sequence.assertions, {
      repoFullName,
      dryRun,
      branchName,
      workingDir,
      masterMain,
      templateDir: sequence.templateDir,
    })

    // 5.
    let skipCreatingPR = false
    const {stdout} = await exec(`git -C ${workingDir} diff ${branchName} origin/${masterMain} --name-only`)
    if (stdout) {
      if (dryRun) {
        // clean-up dryRun
        indentLog(6, '(In --dry-run mode, output below does not actually happen)')
        await exec(`git -C ${workingDir} branch -D ${branchName}`)
      } else {
        await exec(`git -C ${workingDir} push origin ${branchName} --no-verify`)
      }

      indentLog(6, `Pushing branch ${branchName} to GitHub...`)
    } else {
      skipCreatingPR = true
      indentLog(6, `Deleting empty branch ${branchName}...`)
      await exec(`git -C ${workingDir} branch -D ${branchName} `)
    }

    // 6.0
    if (pullReqExists || skipCreatingPR) return indentLog(0, '')
    indentLog(6, 'Creating PR...')
    if (!dryRun) {
      await GitHubClient.pulls.create({
        owner,
        repo: repoShortName,
        title: prDescription,
        head: branchName,
        base: masterMain,
      })
    }

    indentLog(0, '')
  }

  static async runAssertions(assertions: Leif.Assertion[], opts: {
    repoFullName: string;
    dryRun: boolean;
    branchName: string;
    workingDir: string;
    templateDir: string;
    masterMain: string;
  }) {
    const {repoFullName, dryRun, branchName, workingDir, templateDir, masterMain} = opts
    await syncProcessArray(assertions, async assertion => {
      indentLog(6, `Assert: ${assertion.description} (type: ${assertion.type})`)

      const Asserter = AsserterLookup[assertion.type]
      if (!Asserter) throw new Error(`Invalid assertion type ${assertion.type}`)

      try {
        const asserter = new Asserter({
          assertion,
          repoFullName,
          dryRun,
          branchName,
          workingDir,
          templateDir,
        })
        await asserter.run()
      } catch (error: any) {
        await exec(`git -C ${workingDir} checkout ${masterMain}`)
        await exec(`git -C ${workingDir} branch -D ${branchName}`)
        throw error
      }
    })
  }
}

