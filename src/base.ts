import {Command} from '@oclif/command'
import {IConfig} from '@oclif/config'
import axios, {AxiosInstance} from 'axios'

const fs = require('fs-extra')
const yaml = require('js-yaml')

const githubHeaders = {Accept: 'application/vnd.github.v3+json'}

export default abstract class extends Command {
  github: AxiosInstance

  constructor(argv: string[], config: IConfig) {
    super(argv, config)

    this.github = axios.create({
      baseURL: 'https://api.github.com/',
      headers: githubHeaders,
    })
  }

  readConfig(file: string) {
    try {
      const fileContents = fs.readFileSync(file, 'utf8')
      const data = yaml.safeLoad(fileContents)
      return data
    } catch (error) {
      console.log(error)
    }
  }
}

export type Repo = {
  name: string;
}
