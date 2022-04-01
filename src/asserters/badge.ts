import * as path from 'node:path'
import * as fs from 'fs-extra'

import AsserterBase from './base'

const LICENSES: Record<string, string> = {
  'BSD-2-Clause': 'https://img.shields.io/badge/License-BSD%202--Clause-brightgreen.svg',
  'BSD 2-Clause': 'https://img.shields.io/badge/License-BSD%202--Clause-brightgreen.svg',
  'BSD-3-Clause': 'https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg',
  'BSD 3-Clause': 'https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg',
  MIT: 'https://img.shields.io/badge/License-MIT-brightgreen.svg',
}

export class ReadmeHasBadgesAsserter extends AsserterBase {
  protected async uniqWork() {
    const pkgJson = require(path.join(this.workingDir, 'package.json'))
    const readmePath = path.join(this.workingDir, 'README.md')
    let readme = fs.readFileSync(readmePath, 'utf8')

    const {name, license} = pkgJson
    const BADGES: Record<string, string> = {
      npm: `[![NPM](https://img.shields.io/npm/v/${name}.svg?label=${name})](https://www.npmjs.com/package/${name})`,
      circleci: `[![CircleCI](https://circleci.com/gh/${this.repoFullName}/tree/${this.mainBranchName}.svg?style=shield)](https://circleci.com/gh/${this.repoFullName}/tree/${this.mainBranchName})`,
      license: `[![License](${LICENSES[license]})](https://raw.githubusercontent.com/${this.repoFullName}/${this.mainBranchName}/LICENSE.txt)`,
      downloads: `[![Downloads/week](https://img.shields.io/npm/dw/${name}.svg)](https://npmjs.org/package/${name})`,
    }
    const requestedBadges = (this.assertion.badges || []) as string[]
    const badges: string[] = requestedBadges.map(badge => BADGES[badge]).filter(badge => !readme.includes(badge))

    if (badges.length === 0) return

    const headerRegex = /^#\s(.*?)\n|(=*)\n/gi
    const header = readme.match(headerRegex)
    if (header) {
      // if we can find a header, insert the badges just below that
      readme = readme.replace(header[0], `${header[0]}\n${badges.join(' ')}\n`)
    } else {
      // if we can't find the header, insert the badges as the first line
      readme = `${badges.join(' ')}\n${readme}`
    }

    fs.writeFileSync(readmePath, readme)
  }
}
