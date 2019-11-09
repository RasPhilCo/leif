import { Command } from '@oclif/command'
import { IConfig } from '@oclif/config'
import axios, { AxiosInstance } from 'axios'

const fs = require('fs-extra')
const yaml = require('js-yaml')

const githubHeaders = { 'Accept': 'application/vnd.github.v3+json' }

export default abstract class extends Command {
  github: AxiosInstance

  constructor(argv: string[], config: IConfig) {
    super(argv, config)

    this.github = axios.create({
      baseURL: 'https://api.github.com/',
      headers: githubHeaders
    })
  }

  readConfig(file: string) {
    try {
      let fileContents = fs.readFileSync(file, 'utf8');
      let data = yaml.safeLoad(fileContents)
      return data
    } catch (e) {
      console.log(e)
    }
  }
}