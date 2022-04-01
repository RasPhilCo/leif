import {Octokit} from '@octokit/rest'
import {components} from '@octokit/openapi-types'

import AsserterBase from './base'

const GitHubClient = new Octokit({
  auth: process.env.GITHUB_OAUTH_TOKEN || process.env.GITHUB_TOKEN,
})

type ReposGetResponse = components['schemas']['repository']
export class GithubRepoPropertyValueAsserter extends AsserterBase {
  protected async uniqWork() {
    const [owner, repo] = this.repoFullName.split('/')
    const data = (await GitHubClient.repos.get({owner, repo})).data as ReposGetResponse
    const property = this.assertion.property as keyof ReposGetResponse
    const value = this.assertion.value

    if ((data[property] as any) === undefined) throw new Error(`Property ${property} not supported in the github API`)

    if (data[property] !== value) {
      const payload: {[key: string]: any} = {owner, repo}
      payload[property] = value
      if (this.dryRun) {
        return `In --dry-run mode: set ${property} to ${value} on ${owner}/${repo}`
      }

      await GitHubClient.repos.update(payload as any)
      return `Set ${property} to ${value} on ${owner}/${repo}`
    }

    return `The ${property} is already ${value} on ${owner}/${repo}`
  }
}
