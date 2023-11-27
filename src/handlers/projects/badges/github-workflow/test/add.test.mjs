/* global describe expect test */
import { existsSync } from 'node:fs'
import * as fsPath from 'node:path'

import * as addHandler from '../add'

const testPkgPath = fsPath.join(__dirname, 'data', 'pkgA')

const appMock = {
  ext : {
    devPaths : []
  }
}

const reporterMock = {
  isolate : () => {},
  log     : () => {},
  error   : () => {}
}

const reqMock = {
  accepts : () => 'application/json',
  get     : (header) => header === 'X-CWD' ? testPkgPath : undefined,
  vars    : {}
}

describe('PUT:badges/github-workflow/add', () => {
  test('defaults to unit-tests status when no options given', async() => {
    const handler = addHandler.func({ app : appMock, reporter : reporterMock })
    let result = ''
    const mockRes = { write : (chunk) => { result += chunk }, end : () => {}, type : () => {} }
    await handler(reqMock, mockRes)

    expect(existsSync(fsPath.join(testPkgPath, '.sdlc-data.yaml'))).toBe(true)
    const resultJSON = JSON.parse(result)
    expect(resultJSON.artifacts).toHaveLength(1)
  })
})
