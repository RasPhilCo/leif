import AsserterBase from './base'
import {exec} from '../utils'

export class RunCommandsAsserter extends AsserterBase {
  protected async uniqWork() {
    if (!this.assertion.commands) {
      throw new Error('No commands were provided in the sequence.')
    }

    const commands: string[] = Array.isArray(this.assertion.commands) ?
      this.assertion.commands :
      [this.assertion.commands]

    for (const cmd of commands) {
      await exec(cmd, {cwd: this.workingDir})
    }
  }
}
