import * as path from 'path'
import * as fs from 'fs-extra'
import {exec, indentLog} from './workflows'

export interface AsserterServiceConfig {
  assertion: {apply_only_to_repos: string[]};
  dryRun: boolean;
  repoFullName: string;
  branchName: string;
  templateDir: string;
}

abstract class AsserterBase {
  protected assertion: any

  protected branchName: string

  protected dryRun: boolean

  protected templateDir: string

  protected repoFullName: string

  constructor({assertion, repoFullName, dryRun, branchName, templateDir}: AsserterServiceConfig) {
    this.assertion = assertion
    this.branchName = branchName
    this.templateDir = templateDir
    this.dryRun = dryRun
    this.repoFullName = repoFullName
  }

  protected get workingDir() {
    return `${process.env.HOME}/.leif/github/${this.repoFullName}`
  }

  async run() {
    // 1.
    await exec(`git -C ${this.workingDir} checkout master`) // branch from master
    try {
      await exec(`git -C ${this.workingDir} checkout ${this.branchName}`)
      indentLog(8, `Checking out branch ${this.branchName}...`)
    } catch (error) {
      if (error.toString().match(/did not match/)) {
        await exec(`git -C ${this.workingDir} checkout -b ${this.branchName}`)
        indentLog(8, `Creating branch ${this.branchName}...`)
      } else {
        throw new Error('Error creating a working branch')
      }
    }

    // 2.
    await this.uniqWork()

    // 3.
    const {stdout} = await exec(`git -C ${this.workingDir} status`)
    if (stdout.toString().match(/nothing to commit, working tree clean/)) {
      // if working dir clean
      indentLog(8, 'Working directory clean, no changes to push...')
    } else {
      // 4.
      await exec(`git -C ${this.workingDir} add --all`)
      await exec(`git -C ${this.workingDir} commit -m "${this.commitDescription}" -m "leif asserted state via leifyaml"`)
      indentLog(8, `Commiting changes to branch ${this.branchName}...`)
    }

    // work is done, return to master
    await exec(`git -C ${this.workingDir} checkout master`)
  }

  protected async uniqWork() {
    // not implemented==
  }

  private get commitDescription() {
    return this.assertion.description || `leif ${this.assertion.type} assertion`
  }
}

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

export class NodeProjectHasDepsAsserter extends AsserterBase {
  protected async uniqWork() {
    if (!fs.existsSync(path.join(this.workingDir, 'package.json'))) {
      console.log('No package.json file found, skipping...')
      return
    }

    const manager = this.assertion.manager
    const depsToInstall = this.assertion.dependencies
    const devToInstall = this.assertion.dev_dependencies

    if (manager !== 'yarn' || manager !== 'npm') {
      throw new Error(`Manager ${this.assertion.manager} not found`)
    }

    if (depsToInstall && depsToInstall.length > 0) {
      if (this.assertion.manager === 'yarn') {
        await exec(`cd ${this.workingDir}; yarn add ${depsToInstall.join(' ')}`)
      } else if (this.assertion.manager === 'npm') {
        await exec(`cd ${this.workingDir}; npm install ${depsToInstall.join(' ')}`)
      }
    }

    if (devToInstall && devToInstall.length > 0) {
      if (this.assertion.manager === 'yarn') {
        await exec(`cd ${this.workingDir}; yarn add --dev ${devToInstall.join(' ')}`)
      } else if (this.assertion.manager === 'npm') {
        await exec(`cd ${this.workingDir}; npm install --save-dev ${devToInstall.join(' ')}`)
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

export const AsserterLookup: { [key: string]: any } = {
  'file-is-exact': FileExactMatchAsserter,
  'file-does-not-exist': FileDoesNotExistAsserter,
  'json-has-properties': JsonHasPropertiesAsserter,
  'node-project-has-deps': NodeProjectHasDepsAsserter,
  'node-project-does-not-have-deps': NodeProjectDoesNotHaveDepsAsserter,
}
