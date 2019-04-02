import { readFileSync, createReadStream, writeFileSync } from 'fs-extra'
import Context from './context'
import Config from './config'
import timestamp from 'time-stamp'
import recursive from 'recursive-readdir'
import hidefile from 'hidefile'
import { relative } from 'path'
import { sync } from 'md5-file'

export default class Md5 {
  md5: string
  path: string

  static async calculate(): Promise<any> {
    const context = new Context()
    const files = await recursive(context.wwwFolderPath, context.ignoredList)
    const results = new Array()
    files.forEach(file => {
      if (!hidefile.isHiddenSync(file)) {
        results.push(this.hashFile(file, context))
      }
    })
    const json = JSON.stringify(results, null, 2)
    writeFileSync(context.configFilePath, json)
    return new Promise<boolean>(resolve => {
      resolve()
    })
  }

  static prepareConfig(context: Context): Config {
    let config = new Config()
    try {
      config = JSON.parse(readFileSync(context.defaultConfigFilePath, 'utf8'))
      config.release = process.env.VERSION || this.calculateTimestamp()
    } catch (e) {
      config.autogenerated = true
      config.release = this.calculateTimestamp()
    }
    return config
  }

  static calculateTimestamp(): string {
    return timestamp('YYYY.MM.DD.HH.mm.ss')
  }

  static hashFile(file: string, context: Context): Md5 {
    const md5 = sync(file)
    const path = relative(context.wwwFolderPath, file).replace(new RegExp('\\\\', 'g'), '/')
    const m5 = new Md5()
    m5.md5 = md5
    m5.path = path
    return m5
  }
}
