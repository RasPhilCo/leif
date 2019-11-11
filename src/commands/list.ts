import {flags} from '@oclif/command'
import ux from 'cli-ux'

import Base from '../base'

export default class List extends Base {
  static description = 'list repository being managed'

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
    const {flags} = this.parse(List)

    const keef = this.readConfig(flags.config)
    const repos = keef.repos.map((r: string) => ({name: r}))

    ux.table(repos, {
      repo: {
        get: (row: {name: string}) => row.name,
      },
    })
  }
}
