import * as path from 'path'
import * as fs from 'fs-extra'

import AsserterBase from './base'
import {exec} from '../utils'
import * as glob from 'fast-glob'

export class NodeProjectHasDepsAsserter extends AsserterBase {
  async doWork(workingDir = this.workingDir, flags = '') {
    const manager = this.assertion.manager
    const depsToInstall = this.assertion.dependencies
    const devToInstall = this.assertion.dev_dependencies
    const forceInstall = this.assertion.force_install

    if (manager !== 'yarn' && manager !== 'npm') {
      throw new Error(`Manager ${this.assertion.manager} not found`)
    }

    if (depsToInstall && depsToInstall.length > 0) {
      if (this.assertion.manager === 'yarn') {
        await exec(`cd ${workingDir}; yarn add ${depsToInstall.join(' ')} ${flags}`)
      } else if (this.assertion.manager === 'npm') {
        await exec(`cd ${workingDir}; npm install ${depsToInstall.join(' ')}`)
      }
    }

    if (devToInstall && devToInstall.length > 0) {
      if (this.assertion.manager === 'yarn') {
        await exec(`cd ${workingDir}; yarn add --dev ${devToInstall.join(' ')} ${flags}`)
      } else if (this.assertion.manager === 'npm') {
        await exec(`cd ${workingDir}; npm install --save-dev ${devToInstall.join(' ')}`)
      }
    }

    if (forceInstall) {
      if (this.assertion.manager === 'yarn') {
        await exec(`cd ${workingDir}; yarn install --force`)
      } else if (this.assertion.manager === 'npm') {
        await exec(`cd ${workingDir}; npm install --force`)
      }
    }
  }

  protected async uniqWork() {
    if (!fs.existsSync(path.join(this.workingDir, 'package.json'))) {
      console.log('No package.json file found, skipping...')
      return
    }

    await this.doWork()
  }
}

export class NodeLernaProjectHasDepsAsserter extends NodeProjectHasDepsAsserter {
  protected async uniqWork() {
    if (!fs.existsSync(path.join(this.workingDir, 'lerna.json'))) {
      console.log('No lerna.json file found, skipping...')
      return
    }
    const targets: string[] = []
    if (this.assertion.target_glob_filepath) {
      const fullGlob = path.join(this.workingDir, this.assertion.target_glob_filepath)
      const matches = await glob(fullGlob, {onlyDirectories: true})
      targets.push(...matches)
    } else {
      targets.push(this.workingDir)
    }

    for (const target of targets) {
      if (target === this.workingDir) {
        await this.doWork(target, '-W')
      } else {
        await this.doWork(target)
      }
    }
  }
}

export class NodeProjectDoesNotHaveDepsAsserter extends AsserterBase {
  protected async uniqWork() {
    if (!fs.existsSync(path.join(this.workingDir, 'package.json'))) {
      console.log('No package.json file found, skipping...')
      return
    }

    const manager = this.assertion.manager
    const depsToUninstall = this.assertion.dependencies

    if (manager !== 'yarn' || manager !== 'npm') {
      throw new Error(`Manager ${this.assertion.manager} not found`)
    }

    if (depsToUninstall && depsToUninstall.length > 0) {
      try {
        if (this.assertion.manager === 'yarn') {
          await exec(`cd ${this.workingDir}; yarn remove ${depsToUninstall.join(' ')}`)
        } else if (this.assertion.manager === 'npm') {
          await exec(`cd ${this.workingDir}; npm uninstall ${depsToUninstall.join(' ')}`)
        }
      } catch (error) {
        if (error.toString().match(/This module isn't specified in a/)) {
          // carry on
        } else {
          console.log(error)
        }
      }
    }
  }
}
