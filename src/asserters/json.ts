import * as path from 'node:path'
import * as fs from 'fs-extra'
import * as glob from 'fast-glob'

import AsserterBase from './base'
import {deepAssign} from '../utils'

export class JsonHasPropertiesAsserter extends AsserterBase {
  protected async uniqWork() {
    const sourceJSON = require(path.join(this.templateDir, this.assertion.source_relative_filepath))
    const jsonPaths: string[] = []
    if (this.assertion.target_relative_filepath) {
      jsonPaths.push(path.join(this.workingDir, this.assertion.target_relative_filepath))
    } else if (this.assertion.target_glob_filepath) {
      const matches = await glob(path.join(this.workingDir, this.assertion.target_glob_filepath))
      jsonPaths.push(...matches)
    } else {
      throw new Error('Neither target_glob_filepath nor target_relative_filepath are provided')
    }

    for (const targetJSONPath of jsonPaths) {
      const targetJSON = require(targetJSONPath)
      const assertedJSON = deepAssign({...targetJSON}, sourceJSON, {arrayBehavior: this.assertion.array_behavior})
      await fs.writeFile(targetJSONPath, JSON.stringify(assertedJSON, null, 2) + '\n')
    }
  }
}
