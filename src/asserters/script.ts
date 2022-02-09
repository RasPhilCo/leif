import * as path from 'path'

import AsserterBase from './base'
import {exec} from '../utils'

export class RunScriptAsserter extends AsserterBase {
  protected async uniqWork() {
    let command = this.assertion.command

    if (this.assertion.args) {
      command += ` ${this.assertion.args.join(' ')}`
    }

    command += ` ${path.join(this.templateDir, this.assertion.script_relative_filepath)}`

    try {
      await exec(command, {cwd: this.workingDir})
    } catch (err) {
      throw  err
    }
  }
}
