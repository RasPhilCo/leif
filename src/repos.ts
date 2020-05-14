import * as fs from 'fs-extra'
import ux from 'cli-ux'
import {exec, syncProcessArray} from './utils'

export default class RepoService {
  static async runMany(repos: string[]) {
    await syncProcessArray(repos, RepoService.run)
    console.log('')
  }

  static async run(repoFullName: string) {
    const localDir = `${process.env.HOME}/.leif/github`
    await fs.ensureDir(localDir)
    const localRepoDir = `${localDir}/${repoFullName}`
    if (fs.existsSync(localRepoDir)) {
      console.log(`Pulling origin master for repo ${repoFullName}...`)
      await exec(`git -C ${localRepoDir} checkout master`)
      await exec(`git -C ${localRepoDir} fetch --prune`)
      await exec(`git -C ${localRepoDir} pull`)
      await exec(`git -C ${localRepoDir} branch -vv | grep ': gone' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`)
      await exec(`git -C ${localRepoDir} branch -vv | grep -vE 'origin/' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`)
    } else {
      ux.action.start(`Cloning from github repo ${repoFullName}`)
      await exec(`git clone git@github.com:${repoFullName}.git ${localRepoDir}`)
      ux.action.stop()
    }
  }
}
