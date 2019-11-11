import {flags} from '@oclif/command'
import * as fs from 'fs-extra'
import * as path from 'path'

import Base from '../base'

export default class Cleanup extends Base {
  static description = 'remove managed repos'

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
    const {flags} = this.parse(Cleanup)
    const keef = this.readConfig(flags.config)
    const accountName = keef.org || keef.user
    const localDir = `${process.env.HOME}/.keef/github/${accountName}`

    await Promise.all(keef.repos.map(async (repoName: string) => {
      await fs.ensureDir(path.join(localDir, repoName))
    }))
  }
}
