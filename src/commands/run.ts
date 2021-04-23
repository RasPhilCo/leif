import {Command, flags} from '@oclif/command'
import * as fs from 'fs-extra'
import * as path from 'path'
import {syncProcessArray} from '../utils'

import WorkflowService from '../workflows'

const yaml = require('js-yaml')

const readYAMLFromRelativePath = async (relativeFilepath: string) => {
  const fileContents = await fs.readFile(path.join(process.cwd(), relativeFilepath), 'utf8')
  return yaml.load(fileContents)
}

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
    const dir = flags.dir === '.' ? process.cwd() : flags.dir
    const dryRun = Boolean(flags['dry-run'])

    if (!dryRun && !process.env.GITHUB_OAUTH_TOKEN) {
      this.error('Missing env var GITHUB_OAUTH_TOKEN')
    }

    const runWorkflowService = async (workflowFilepath: string) => {
      const yamlContents = await readYAMLFromRelativePath(workflowFilepath)
      let preparedWorkflows = WorkflowService.workflowsFromYaml(yamlContents, dir, dryRun)

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
      return WorkflowService.runMany(preparedWorkflows)
    }
    syncProcessArray([args.yaml], runWorkflowService)
  }
}
