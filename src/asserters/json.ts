import * as path from 'path'
import * as fs from 'fs-extra'

import AsserterBase from './base'
import {deepAssign} from '../utils'

export class JsonHasPropertiesAsserter extends AsserterBase {
  protected async uniqWork() {
    const sourceJSON = require(path.join(this.templateDir, this.assertion.source_relative_filepath))
    const targetJSONPath = path.join(this.workingDir, this.assertion.target_relative_filepath)
    const targetJSON = require(targetJSONPath)
    const assertedJSON = deepAssign({...targetJSON}, sourceJSON)
    await fs.writeFile(targetJSONPath, JSON.stringify(assertedJSON, null, 2) + '\n')
  }
}
