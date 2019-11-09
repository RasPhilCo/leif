import {flags} from '@oclif/command'
import ux from 'cli-ux'
import {exec} from 'child_process'
import * as fs from 'fs-extra'

import Base, {Repo} from '../base'

export default class Sync extends Base {
  static description = 'sync repository being managed locally'

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
    const {flags} = this.parse(Sync)
    const keef = this.readConfig(flags.config)
    const {data} = await this.github.get<Repo[]>(`/orgs/${keef.org}/repos`)
    const repos = data.filter((r: Repo) => keef.repos.includes(r.name))
    const localDir = `~/.keef/github/${keef.org}`
    await fs.ensureDir(localDir)
    repos.forEach(repo => {
      const repoName = repo.name
      ux.action.start(`Syncing ${repoName}`)
      exec(['git', 'clone', `https://github.com/${keef.org}/${repoName}`, `${localDir}/${repoName}`].join(' '))
      ux.action.stop()
    })
  }
}
