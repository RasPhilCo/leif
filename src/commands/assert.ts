import {flags} from '@oclif/command'
import * as fs from 'fs-extra'
import ux from 'cli-ux'
import Base from '../base'
import * as util from 'util'

const exec = util.promisify(require('child_process').exec)

class Syncronizer {
  static async run(leif: any) {
    const accountName = leif.org || leif.user
    const localDir = `${process.env.HOME}/.leif/github/${accountName}`
    await fs.ensureDir(localDir)

    await Promise.all(leif.repos.map(async (repoName: string) => {
      const localRepoDir = `${localDir}/${repoName}`
      if (fs.existsSync(localRepoDir)) {
        console.log(`Cleaning local repo ${repoName}...`)
        await exec(`git -C ${localRepoDir} checkout master`)
        await exec(`git -C ${localRepoDir} fetch --prune`)
        await exec(`git -C ${localRepoDir} pull`)
        await exec(`git -C ${localRepoDir} branch -vv | grep ': gone' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`)
        await exec(`git -C ${localRepoDir} branch -vv | grep -vE 'origin/' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`)
      } else {
        ux.action.start(`Syncing ${repoName}`)
        await exec(`git clone git@github.com:${accountName}/${repoName}.git ${localRepoDir}`)
        ux.action.stop()
      }
    }))
    console.log('')
  }
}

interface Assertion {
  type: string;
}

interface Sequence extends Assertion {
  type: 'sequence';
  assert: Assertion[];
}

interface Schema {
  version: string;
  assert: (Assertion | Sequence)[];
}

export default class Assert extends Base {
  static description = 'apply leif config to repositories'

  static flags = {
    config: flags.string({
      char: 'c',
      description: 'path to a leif config file',
      required: true,
    }),
    schema: flags.string({
      char: 's',
      description: 'assert schema version only',
      multiple: true,
    }),
    'dry-run': flags.boolean({
      char: 'd',
      description: 'see output without implementing state',
    }),
  }

  async run() {
    const {flags} = this.parse(Assert)
    const leif = this.readConfig(flags.config)
    await Syncronizer.run(leif)

    const sequences: Sequence[] = []
    let schemas: Schema[] = leif.schema
    if (flags.schema) {
      schemas = leif.schema.filter((s: Schema) => !s.version || flags.schema.includes(String(s.version)))
    }
    for (const schema of schemas) {
      const {singleSequence, sequences: seq} = this.seperateSequences(schema.assert)
      sequences.push(...seq)
      sequences.push(singleSequence)
    }

    // console.log(JSON.stringify(sequences, null, 2)); return
    await this.applySequences({
      sequences,
      owner: leif.org ? leif.org : leif.user,
      repos: leif.repos,
      configDir: leif.configDir,
      dryRun: flags['dry-run'],
    })
  }

  private seperateSequences(assertions: (Assertion|Sequence)[]) {
    const singleSequence = assertions.filter((a: Assertion|Sequence) => a.type !== 'sequence') as Assertion[]
    const sequences = assertions.filter((a: Assertion | Sequence) => a.type === 'sequence') as Sequence[]
    return {singleSequence: {type: 'sequence', assert: singleSequence} as Sequence, sequences}
  }
}
