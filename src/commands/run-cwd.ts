import {Command, flags} from '@oclif/command'

import {Leif} from '../types'
import {syncProcessArray, masterBranchName, prepareWorkflows, indentLog} from '../utils'
import SequenceService from '../sequences'

const runSequenceOnCWD = async (sequence: Leif.Sequence) => {
  const branchName = sequence.branch_name || sequence.id
  const workingDir = process.cwd()
  const masterMain = masterBranchName(workingDir)

  await SequenceService.runAssertions(sequence.assertions, {
    repoFullName: 'current-working-directory',
    dryRun: true,
    branchName,
    workingDir,
    masterMain,
    templateDir: sequence.templateDir,
  })
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

    const pws = await prepareWorkflows(args, flags)

    syncProcessArray(pws, w => {
      indentLog(0, `Running workflow ${w.id}`)
      indentLog(0, '=================\n')
      indentLog(0, 'Running on current working directory...\n')
      syncProcessArray(w.sequences, runSequenceOnCWD)
    })
  }
}
