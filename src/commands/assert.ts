import {flags} from '@oclif/command'
import * as fs from 'fs-extra'
import ux from 'cli-ux'
import Base, {Assertion, Sequence} from '../base'
import * as util from 'util'
import * as path from 'path'

const exec = util.promisify(require('child_process').exec)

class Syncronizer {
  static async run(config: {org?: string; user?: string; repos: string[]}) {
    const accountName = config.org || config.user
    const localDir = `${process.env.HOME}/.leif/github/${accountName}`
    await fs.ensureDir(localDir)
    // console.log(repos); return

    await Promise.all(config.repos.map(async (repoName: string) => {
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

interface Schema {
  version: string;
  assert: (Assertion | Sequence)[];
}

export default class Assert extends Base {
  static description = 'apply leif config to repositories'

  static flags = {
    schema: flags.string({
      char: 'c',
      description: 'path to a leif schema file',
      required: true,
    }),
    // version: flags.string({
    //   char: 'v',
    //   description: 'assert given schema version only',
    //   multiple: true,
    // }),
    'dry-run': flags.boolean({
      char: 'd',
      description: 'see output without implementing state',
    }),
  }

  async run() {
    const {flags} = this.parse(Assert)
    const leif = this.readLeifYaml(flags.schema)
    if (leif.config) this.assignConfig(leif, flags.schema)
    await Syncronizer.run(leif)

    const sequences = this.constructSequences(leif)
    // console.log(JSON.stringify(sequences, null, 2)); return

    await this.applySequences({
      sequences,
      owner: leif.org ? leif.org : leif.user,
      configDir: leif.configDir,
      dryRun: flags['dry-run'],
    })
  }

  private seperateSequences(assertions: (Assertion|Sequence)[]) {
    const singleSequence = assertions.filter((a: Assertion|Sequence) => a.type !== 'sequence') as Assertion[]
    const sequences = assertions.filter((a: Assertion | Sequence) => a.type === 'sequence') as Sequence[]
    return {singleSequence: {type: 'sequence', assert: singleSequence} as Sequence, sequences}
  }

  private constructSequences(leif: any) {
    const sequences: Sequence[] = []
    const schemas: (Schema | Sequence | Assertion)[] = leif.schema || []
    for (const schema of schemas) {
      if (!(schema as Schema).version) {
        if ((schema as Assertion).type === 'sequence') {
          sequences.push(schema as Sequence)
          continue
        }
        sequences.push({assert: [schema as Assertion], type: 'sequence'})
        continue
      }
      const {singleSequence, sequences: seqs} = this.seperateSequences((schema as Schema).assert)
      const addSchemaProps = (schema: Schema, sequence: Sequence) => (Object.assign({...schema}, sequence))
      sequences.push(addSchemaProps(schema as Schema, singleSequence))
      sequences.push(...seqs.map(s => addSchemaProps(schema as Schema, s)))
    }

    sequences.forEach((s: Sequence) => {
      s.assert.forEach((a: Assertion) => {
        a.repos_to_apply = leif.repos
      })
    })

    return sequences
  }

  private assignConfig(leif: any, schema: string) {
    const bits = schema.split('/')
    const bobs = bits.length > 1 ? bits.slice(0, bits.length - 1) : []
    const configPath = path.join(...bobs, leif.config)
    const config = this.readLeifYaml(configPath)
    return Object.assign(leif, config)
  }
}
