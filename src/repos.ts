import * as fs from 'fs-extra'
import ux from 'cli-ux'
import { exec, syncProcessArray, masterBranchName} from './utils'


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
      const masterMain = masterBranchName()
      console.log(`Pulling origin ${masterMain} for repo ${repoFullName}...`)
      await exec(`git -C ${localRepoDir} checkout ${masterMain}`)
      await exec(`git -C ${localRepoDir} fetch --prune`)
      await exec(`git -C ${localRepoDir} pull`)
      await exec(`git -C ${localRepoDir} branch -vv | grep ': gone' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`)
      await exec(`git -C ${localRepoDir} branch -vv | grep -vE 'origin/' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`)
    } else {
      ux.action.start(`Cloning from github repo ${repoFullName}`)
      let cloneCmd = `git clone git@github.com:${repoFullName}.git ${localRepoDir}`
      const gitCredential = `${process.env.GITHUB_USERNAME}:${process.env.GITHUB_OAUTH_TOKEN || process.env.GITHUB_TOKEN}`
      if (process.env.CI) cloneCmd = `git clone https://${gitCredential}@github.com/${repoFullName} ${localRepoDir}`
      await exec(cloneCmd)
      ux.action.stop()
    }
  }
}
