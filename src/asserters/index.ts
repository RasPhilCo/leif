import {FileExactMatchAsserter, FileDoesNotExistAsserter} from './file'
import {GithubRepoPropertyValueAsserter} from './github'
import {JsonHasPropertiesAsserter} from './json'
import {YamlHasPropertiesAsserter} from './yaml'
import {
  NodeProjectHasDepsAsserter,
  NodeProjectDoesNotHaveDepsAsserter,
  NodeLernaProjectHasDepsAsserter,
} from './node'

export const AsserterLookup: { [key: string]: any } = {
  'file-is-exact': FileExactMatchAsserter,
  'file-does-not-exist': FileDoesNotExistAsserter,
  'json-has-properties': JsonHasPropertiesAsserter,
  'node-project-has-deps': NodeProjectHasDepsAsserter,
  'node-lerna-project-has-deps': NodeLernaProjectHasDepsAsserter,
  'node-project-does-not-have-deps': NodeProjectDoesNotHaveDepsAsserter,
  'github-repo-property-has-value': GithubRepoPropertyValueAsserter,
  'yaml-has-properties': YamlHasPropertiesAsserter,
}
