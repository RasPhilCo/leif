import { flags } from '@oclif/command'
import ux from 'cli-ux'

import Base from '../base'

type Repo = {
  name: string
}

export default class List extends Base {
  static description = 'list repository being managed'

  static args = [
    // { name: 'repository', required: true }
  ]

  static flags = {
    config: flags.string({
      char: 'c',
      description: 'path to a keef config file',
      required: true,
    }),
  }

  async run() {
    const { flags } = this.parse(List)

    const keef = this.readConfig(flags.config)
    // console.log(keef); return
    const { data } = await this.github.get<Repo[]>(`/orgs/${keef.org}/repos`)
    // console.log(data)
    const repos = data.filter((r: Repo) => keef.repos.includes(r.name))

    ux.table(repos, {
      repo: {
        get: (row: Repo) => row.name
      },
    })
  }
}