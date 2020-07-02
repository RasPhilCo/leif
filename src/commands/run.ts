import {Command, flags} from '@oclif/command'
import * as fs from 'fs-extra'
import * as path from 'path'
import {syncProcessArray} from '../utils'

import WorkflowService from '../workflows'

const yaml = require('js-yaml')

const readYAMLFromRelativePath = async (relativeFilepath: string) => {
  const fileContents = await fs.readFile(path.join(process.cwd(), relativeFilepath), 'utf8')
  return yaml.safeLoad(fileContents)
}

export default class Run extends Command {
  static description = 'run leif state workflows'

  static flags = {
    'dry-run': flags.boolean({
      char: 'd',
      description: 'view output without commiting changes',
    }),
    dir: flags.string({
      char: 'f',
      description: 'absolute path to directory with supporting files',
      required: true,
      default: '.',
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

    const runWorkflowService = async (workflowFilepath: string) => {
      const yamlContents = await readYAMLFromRelativePath(workflowFilepath)
      const preparedWorkflows = WorkflowService.workflowsFromYaml(yamlContents, dir, dryRun)
      return WorkflowService.runMany(preparedWorkflows)
    }
    syncProcessArray([args.yaml], runWorkflowService)
  }
}
