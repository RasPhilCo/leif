import * as fs from 'fs-extra'
import ux from 'cli-ux'
import {exec, syncProcessArray, masterBranchName, homedir} from './utils'

export default class RepoService {
  static async runMany(repos: string[]) {
    await syncProcessArray(repos, RepoService.run)
    console.log('')
  }

  static async run(repoFullName: string) {
    const localDir = `${homedir}/.leif/github`
    await fs.ensureDir(localDir)
    const localRepoDir = `${localDir}/${repoFullName}`
    if (fs.existsSync(localRepoDir)) {
      const masterMain = masterBranchName(localRepoDir)
      console.log(`Pulling origin ${masterMain} for repo ${repoFullName}...`)
      await exec(`git -C ${localRepoDir} checkout ${masterMain}`)
      await exec(`git -C ${localRepoDir} fetch --prune`)
      await exec(`git -C ${localRepoDir} pull`)
      try {
        const branches = (await exec(`git -C ${localRepoDir} branch -vv`)).stdout.split(/[\r\n]+/)

        // Clean up branches by finding any that match ': gone' or that don't have a remote tracking branch and delete them
        branches.forEach(async (branch: string) => {
          if (branch.match(/: gone/) || !branch.match(/origin\//)) {
            const branchMatch = branch.match(/^(?:[*\s]{2})([\w/-]+)/g) // Gets the branch name from the branch string that `git branch -vv` returns
            if (branchMatch) await exec(`git -C ${localRepoDir} branch ${branchMatch[0].trim()} -D`)
          }
        })
      } catch (_) {
        ux.log(`A error occured cleaning up stale branches in ${localRepoDir}`)
        ux.log('You may need to clean up branches manually')
      }
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
