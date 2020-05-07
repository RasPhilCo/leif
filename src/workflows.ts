import * as fs from 'fs-extra'
import ux from 'cli-ux'
import * as util from 'util'
import SequenceService from './sequences'

export const exec = util.promisify(require('child_process').exec)

export const indentLog = (spaces: number, ...loglines: string[]) => {
  loglines.forEach(line => {
    console.log(`${''.padEnd(spaces)}${line}`)
  })
}

class RepoService {
  static async runMany(repos: string[]) {
    await Promise.all(repos.map(async (repo: string) => {
      await RepoService.run(repo)
    }))
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

export default class WorkflowService {
  static workflowsFromYaml(yaml: Leif.Yaml.File, templateDir: string, dryRun = false) {
    return Object.keys(yaml.workflows).map((key: string) => {
      const workflow = yaml.workflows[key]
      const prepared: Leif.Workflow = {repos: [], sequences: []}

      // 1. turn apply_to_X to repos
      prepared.repos = prepared.repos.concat(workflow.apply_to_repo || [])
      workflow.apply_to_groups.forEach((groupId: string) => {
        const matchingGroupIndx = yaml.repos.findIndex(r => {
          return typeof r !== 'string' && r.group === groupId
        })
        if (matchingGroupIndx < 0) return
        const matchingGroup = yaml.repos[matchingGroupIndx] as Leif.Yaml.Repo
        const matchingRepos = matchingGroup.repos.map((repo: string) => `${matchingGroup.github_org}/${repo}`)
        prepared.repos = prepared.repos.concat(matchingRepos)
      })

      // 2. turn sequence id's to sequence arrays
      workflow.sequences.forEach((yamlSeqId: string) => {
        const yamlSeq = yaml.sequences[yamlSeqId]
        const seq: Leif.Sequence = {id: yamlSeqId, ...yamlSeq, repos: prepared.repos, templateDir, dryRun}
        prepared.sequences = prepared.sequences.concat(seq)
      })
      return prepared
    })
  }

  static async runMany(workflows: Leif.Workflow[]) {
    await Promise.all(workflows.map((workflow: Leif.Workflow) => {
      const w = new WorkflowService(workflow)
      return w.run()
    }))
  }

  repos: string[]

  sequences: Leif.Sequence[]

  constructor(config: Leif.Workflow) {
    this.repos = config.repos
    this.sequences = config.sequences
  }

  async run() {
    // 1. pull repo's origin master
    await RepoService.runMany(this.repos)
    // 2. run sequences
    await SequenceService.runMany(this.sequences)
  }
}

export namespace Leif {
  export namespace Yaml {
    export type Repo = { group: string; github_org: string; repos: string[] }
    export type Sequence = { description: string; assertions: any[] }
    export type Workflow = { apply_to_repo?: string[]; apply_to_groups: string[]; sequences: string[] }
    export type File = {
      version: string;
      repos: Array<string | Repo>;
      sequences: { [key: string]: Sequence };
      workflows: { [key: string]: Workflow };
    }
  }

  export type Assertion = {
    type: string;
    description?: string;
  }

  export type Sequence = {
    id: string;
    description?: string;
    assertions: Assertion[];
    repos: string[];
    templateDir: string;
    dryRun: boolean;
  }

  export type Workflow = {
    repos: string[];
    sequences: Sequence[];
  }
}
