import * as path from 'node:path'
import * as fs from 'fs-extra'
import * as yaml from 'js-yaml'

import AsserterBase from './base'
import {deepAssign} from '../utils'

export class YamlHasPropertiesAsserter extends AsserterBase {
  protected async uniqWork() {
    const targetYamlPath = path.join(this.workingDir, this.assertion.target_relative_filepath)
    const sourceYamlAsJson = yaml.load(await fs.readFile(path.join(this.templateDir, this.assertion.source_relative_filepath), 'utf8')) as object
    const targetYamlAsJson = yaml.load(await fs.readFile(targetYamlPath, 'utf8')) as object

    const assertedJson = deepAssign({...targetYamlAsJson}, sourceYamlAsJson, {arrayBehavior: this.assertion.array_behavior})
    const assertedYaml = yaml.dump(assertedJson, {indent: 2})
    await fs.writeFile(targetYamlPath, assertedYaml)
  }
}
