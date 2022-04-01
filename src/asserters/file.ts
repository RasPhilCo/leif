import * as path from 'node:path'
import * as fs from 'fs-extra'

import AsserterBase from './base'

export class FileExactMatchAsserter extends AsserterBase {
  protected async uniqWork() {
    await fs.copy(path.join(this.templateDir, this.assertion.source_relative_filepath), path.join(this.workingDir, this.assertion.target_relative_filepath))
  }
}

export class FileDoesNotExistAsserter extends AsserterBase {
  protected async uniqWork() {
    await fs.remove(path.join(this.workingDir, this.assertion.target_relative_filepath))
  }
}
