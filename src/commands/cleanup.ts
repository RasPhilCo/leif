import * as fs from 'fs-extra'
import {Command, flags} from '@oclif/command'
import {homedir} from '../utils'

export default class Cleanup extends Command {
  static description = 'remove repos from the local leif working directory'

  static args = [
    {name: 'org', description: 'GitHub org/username of repos to remove'},
  ]

  static flags = {
    all: flags.boolean({char: 'a', description: 'remove all orgs'}),
  }

  async run() {
    const {args, flags} = this.parse(Cleanup)
    let localDir = `${homedir}/.leif/github`
    if (!flags.all) {
      if (!args.org) this.error('Either an org or --all must be passed')
      localDir = `${localDir}/${args.org}`
    }
    this.log(`Removing ${localDir}`)
    await fs.ensureDir(localDir)
    await fs.rmdir(localDir)
  }
}
