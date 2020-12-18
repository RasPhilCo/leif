import SequenceService from './sequences'
import RepoService from './repos'
import {Leif} from './types'
import {indentLog, syncProcessArray} from './utils'

export default class WorkflowService {
  static workflowsFromYaml(yaml: Leif.Yaml.File, templateDir: string, dryRun = false) {
    return Object.keys(yaml.workflows).map((id: string) => {
      const workflow = yaml.workflows[id]
      const prepared: Leif.Workflow = {id, repos: [], sequences: []}

      // 1. turn apply_to_X to repos
      prepared.repos = prepared.repos.concat(workflow.apply_to_repos || [])
      const groups = workflow.apply_to_groups || []
      groups.forEach((groupId: string) => {
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
    await syncProcessArray(workflows, WorkflowService.run)
  }

  static async run(workflow: Leif.Workflow) {
    const w = new WorkflowService(workflow)
    return w.run()
  }

  id: string

  repos: string[]

  sequences: Leif.Sequence[]

  constructor(config: Leif.Workflow) {
    this.id = config.id
    this.repos = config.repos
    this.sequences = config.sequences
  }

  async run() {
    indentLog(0, `Running workflow ${this.id}`)
    indentLog(0, '=================\n')
    // 1. pull repo's origin master/main
    await RepoService.runMany(this.repos)
    // 2. run sequences
    await SequenceService.runMany(this.sequences)
  }
}
