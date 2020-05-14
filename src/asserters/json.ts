import * as path from 'path'
import * as fs from 'fs-extra'

import AsserterBase from './base'

export class JsonHasPropertiesAsserter extends AsserterBase {
  protected async uniqWork() {
    const sourceJSON = require(path.join(this.templateDir, this.assertion.source_relative_filepath))
    const deepAssign = (target: any, source: any) => {
      Object.keys(source).forEach(k => {
        if (typeof source[k] === 'object') {
          // eslint-disable-next-line no-negated-condition
          if (!target[k]) {
            // doesn't exist, just assign it
            target[k] = source[k]
          } else {
            const newTk = deepAssign(target[k], source[k])
            target[k] = newTk
          }
        } else {
          target[k] = source[k]
        }
      })
      return target
    }
    const targetJSONPath = path.join(this.workingDir, this.assertion.target_relative_filepath)
    const targetJSON = require(targetJSONPath)
    const assertedJSON = deepAssign({...targetJSON}, sourceJSON)
    await fs.writeFile(targetJSONPath, JSON.stringify(assertedJSON, null, 2) + '\n')
  }
}
