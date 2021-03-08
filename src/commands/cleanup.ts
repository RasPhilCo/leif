import * as fs from 'fs-extra'
import {Command} from '@oclif/command'
import {homedir} from '../utils'

export default class Cleanup extends Command {
  static description = 'remove managed repos'

  static args = [
    {name: 'scope', description: 'scope of repos to remove'},
  ]

  static flags = {
  }

  async run() {
    const {args} = this.parse(Cleanup)
    const localDir = `${homedir}/.leif/github/${args.scope}`
    await fs.ensureDir(localDir)
  }
}
