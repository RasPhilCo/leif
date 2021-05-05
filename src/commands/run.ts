import {Command, flags} from '@oclif/command'

import {prepareWorkflows} from '../utils'
import WorkflowService from '../workflows'

export default class Run extends Command {
  static description = 'run leif state workflows'

  static flags = {
    'dry-run': flags.boolean({
      char: 'd',
      description: 'view output without committing changes',
    }),
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
    repo: flags.string({
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
    const {args, flags} = this.parse(Run)
    const dryRun = Boolean(flags['dry-run'])

    if (!dryRun && !process.env.GITHUB_OAUTH_TOKEN) {
      this.error('Missing env var GITHUB_OAUTH_TOKEN')
    }

    const pws = await prepareWorkflows(args.yaml, flags)
    await WorkflowService.runMany(pws)
  }
}
