import {flags} from '@oclif/command'

import Base from '../base'
import Sync from './sync'

export default class Assert extends Base {
  static description = 'apply keef config to repositories'

  static args = [
  ]

  static flags = {
    config: flags.string({
      char: 'c',
      description: 'path to a keef config file',
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(Assert)
    await Sync.run(this.argv, this.config)
    const keef = this.readConfig(flags.config)
    await this.applyAssertions(keef.assert, keef.org ? keef.org : keef.user, keef.repos, keef.configDir)
  }
}
