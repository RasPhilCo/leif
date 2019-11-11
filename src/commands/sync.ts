import {flags} from '@oclif/command'
import ux from 'cli-ux'
import * as fs from 'fs-extra'

import Base from '../base'
import * as util from 'util'

const exec = util.promisify(require('child_process').exec)

export default class Sync extends Base {
  static description = 'sync managage repos'

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
    const {flags} = this.parse(Sync)
    const leif = this.readConfig(flags.config)
    const accountName = leif.org || leif.user
    const localDir = `${process.env.HOME}/.leif/github/${accountName}`
    await fs.ensureDir(localDir)

    await Promise.all(leif.repos.map(async (repoName: string) => {
      const localRepoDir = `${localDir}/${repoName}`
      if (fs.existsSync(localRepoDir)) {
        console.log(`Cleaning local repo ${repoName}...`)
        await exec(`git -C ${localRepoDir} checkout master`)
        await exec(`git -C ${localRepoDir} fetch --prune`)
        await exec(`git -C ${localRepoDir} pull`)
        await exec(`git -C ${localRepoDir} branch -vv | grep ': gone' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`)
        await exec(`git -C ${localRepoDir} branch -vv | grep -vE 'origin/' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`)
      } else {
        ux.action.start(`Syncing ${repoName}`)
        await exec(`git clone https://github.com/${accountName}/${repoName} ${localRepoDir}`)
        ux.action.stop()
      }
    }))
  }
}
