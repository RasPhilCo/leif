import {FileExactMatchAsserter, FileDoesNotExistAsserter} from './file'
import {GithubRepoPropertyValueAsserter} from './github'
import {JsonHasPropertiesAsserter} from './json'
import {ReadmeHasBadgesAsserter} from './badge'
import {YamlHasPropertiesAsserter} from './yaml'
import {RunCommandsAsserter} from './script'
import {
  NodeProjectHasDepsAsserter,
  NodeProjectDoesNotHaveDepsAsserter,
  NodeLernaProjectHasDepsAsserter,
} from './node'

export const AsserterLookup: { [key: string]: any } = {
  'file-does-not-exist': FileDoesNotExistAsserter,
  'file-is-exact': FileExactMatchAsserter,
  'github-repo-property-has-value': GithubRepoPropertyValueAsserter,
  'json-has-properties': JsonHasPropertiesAsserter,
  'node-lerna-project-has-deps': NodeLernaProjectHasDepsAsserter,
  'node-project-does-not-have-deps': NodeProjectDoesNotHaveDepsAsserter,
  'node-project-has-deps': NodeProjectHasDepsAsserter,
  'readme-has-badges': ReadmeHasBadgesAsserter,
  'yaml-has-properties': YamlHasPropertiesAsserter,
  'run-commands': RunCommandsAsserter,
}
