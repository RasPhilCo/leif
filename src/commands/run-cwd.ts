import {Command, flags} from '@oclif/command'
import * as fs from 'fs-extra'
import * as path from 'path'

import {Leif} from '../types'
import {exec, syncProcessArray, indentLog, masterBranchName} from '../utils'
import WorkflowService from '../workflows'
import {AsserterLookup} from '../asserters'

const yaml = require('js-yaml')

const readYAMLFromRelativePath = async (relativeFilepath: string) => {
  const fileContents = await fs.readFile(path.join(process.cwd(), relativeFilepath), 'utf8')
  return yaml.load(fileContents)
}

const runSequenceOnCWD = async (sequence: Leif.Sequence) => {
  const sequenceLength = sequence.assertions.length
  const branchName = sequence.branch_name || sequence.id
  const dryRun = sequence.dryRun
  const workingDir = process.cwd()
  const masterMain = masterBranchName(workingDir)

  for (let i = 0; i < sequenceLength; i++) {
    const assertion = sequence.assertions[i]

    indentLog(6, `Assert: ${assertion.description} (type: ${assertion.type})`)

    const Asserter = AsserterLookup[assertion.type]

    try {
      if (!Asserter) throw new Error(`Invalid asserter type ${assertion.type}`)

      const asserter = new Asserter({
        assertion,
        repoFullName: 'foo',
        dryRun,
        branchName,
        workingDir,
        templateDir: sequence.templateDir,
      })
      await asserter.run()
    } catch (error) {
      await exec(`git -C ${workingDir} checkout ${masterMain}`)
      await exec(`git -C ${workingDir} branch -D ${branchName}`)
      throw error
    }
  }
}

export default class RunCWD extends Command {
  static description = 'run a leif config on the cwd repo only (no PRs will be created)'

  static hidden = true

  static flags = {
    dir: flags.string({
      char: 'f',
      description: 'absolute path to directory with supporting files',
      required: true,
      default: '.',
    }),
    workflow: flags.string({
      char: 'w',
      description: 'run a specific workflow instead of all workflows',
      multiple: true,
    }),
    sequence: flags.string({
      char: 's',
      description: 'run a specific sequence in a workflow',
      dependsOn: ['workflow'],
      multiple: true,
    }),
  }

  static args = [
    {
      name: 'yaml',
      description: 'path to a leif config yaml file',
      required: true,
    },
  ]

  async run() {
    const {args, flags} = this.parse(RunCWD)
    const dir = flags.dir === '.' ? process.cwd() : flags.dir

    const yamlContents = await readYAMLFromRelativePath(args.yaml)
    let preparedWorkflows = WorkflowService.workflowsFromYaml(yamlContents, dir, true)

    if (flags.workflow) {
      const workflows = flags.workflow
      const sequences = flags.sequence

      preparedWorkflows = preparedWorkflows.filter(workflow => {
        const shouldInclude = workflows.includes(workflow.id)
        if (shouldInclude) {
          workflow.sequences = workflow.sequences.filter(sequence => sequences ? sequences.includes(sequence.id) : sequence)
        }
        return shouldInclude
      })
    }

    syncProcessArray(preparedWorkflows, w => {
      syncProcessArray(w.sequences, runSequenceOnCWD)
    })
  }
}

