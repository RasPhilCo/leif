import {flags} from '@oclif/command'

import Base from '../base'
import Sync from './sync'

export default class Assert extends Base {
  static description = 'apply leif config to repositories'

  static args = [
  ]

  static flags = {
    config: flags.string({
      char: 'c',
      description: 'path to a leif config file',
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(Assert)
    await Sync.run(this.argv, this.config)
    const leif = this.readConfig(flags.config)
    await this.applyAssertions(leif.assert, leif.org ? leif.org : leif.user, leif.repos, leif.configDir)
  }
}
