import {Command, Flags} from '@oclif/core'

import {prepareWorkflows} from '../utils'
import WorkflowService from '../workflows'

export default class Run extends Command {
  static description = 'run leif state workflows'

  static flags = {
    'dry-run': Flags.boolean({
      char: 'd',
      description: 'view output without committing changes',
    }),
    dir: Flags.string({
      char: 'f',
      description: 'absolute path to directory with supporting files',
      required: true,
      default: '.',
    }),
    workflow: Flags.string({
      char: 'w',
      description: 'run a specific workflow instead of all workflows',
      multiple: true,
    }),
    sequence: Flags.string({
      char: 's',
      description: 'run a specific sequence in a workflow',
      dependsOn: ['workflow'],
      multiple: true,
    }),
    repo: Flags.string({
      char: 'r',
      description: 'run only on given repo(s)',
      multiple: true,
    }),
  }

  static args = [
    {
      name: 'yaml',
      description: 'path to a leif yaml file',
      required: true,
    },
  ]

  async run() {
    const {args, flags} = await this.parse(Run)
    const dryRun = Boolean(flags['dry-run'])

    if (!dryRun && !process.env.GITHUB_OAUTH_TOKEN) {
      this.error('Missing env var GITHUB_OAUTH_TOKEN')
    }

    const pws = await prepareWorkflows(args, flags)
    await WorkflowService.runMany(pws)
  }
}
