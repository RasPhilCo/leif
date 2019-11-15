import * as fs from 'fs-extra'
import {Command} from '@oclif/command'

export default class Cleanup extends Command {
  static description = 'remove managed repos'

  static args = [
    {name: 'scope', description: 'scope of repos to remove'},
  ]

  static flags = {
  }

  async run() {
    const {args} = this.parse(Cleanup)
    const localDir = `${process.env.HOME}/.leif/github/${args.scope}`
    await fs.ensureDir(localDir)
  }
}
