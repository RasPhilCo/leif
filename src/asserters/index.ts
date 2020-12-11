import {FileExactMatchAsserter, FileDoesNotExistAsserter} from './file'
import {GithubRepoPropertyValueAsserter} from './github'
import {JsonHasPropertiesAsserter} from './json'
import {NodeProjectHasDepsAsserter, NodeProjectDoesNotHaveDepsAsserter} from './node'

export const AsserterLookup: { [key: string]: any } = {
  'file-is-exact': FileExactMatchAsserter,
  'file-does-not-exist': FileDoesNotExistAsserter,
  'json-has-properties': JsonHasPropertiesAsserter,
  'node-project-has-deps': NodeProjectHasDepsAsserter,
  'node-project-does-not-have-deps': NodeProjectDoesNotHaveDepsAsserter,
  'github-repo-property-is-value': GithubRepoPropertyValueAsserter,
}
