/* global describe expect test */
import * as fsPath from 'node:path'

import { setupPassing } from '../setup-passing'

const pkgADir = fsPath.join(__dirname, 'data', 'pkgA')

const testOptions = {
  config           : { foo : true },
  myName           : '@acme/foo',
  myVersion        : '1.0.1',
  require          : false,
  workflowMatchers : ['unit-tests/1'],
  workingPkgRoot   : pkgADir
}

describe('setupPassing', () => {
  test("workflowMatchers ['unit-tests'] creates a single artifact result", async() => {
    const result = await setupPassing(testOptions)

    expect(result).toHaveLength(1)
    expect(result[0].scripts).toHaveLength(1)
    expect(result[0].scripts[0].badgeLine).toMatch('Unit tests') // from the workflow yaml 'name' field
  })

  test("workflowMatchers ['unit-tests/1','fubar/2'] (no 'fubar') creates a single artifact result", async() => {
    const result = await setupPassing(Object.assign({}, testOptions, { workflowMatchers : ['unit-tests/1', 'fubar/2'] }))

    expect(result).toHaveLength(1)
    expect(result[0].scripts).toHaveLength(1)
    expect(result[0].scripts[0].badgeLine).toMatch('Unit tests') // from the workflow yaml 'name' field
  })

  test("workflowMatchers ['unit-tests/1','fubar/2'] (no 'fubar') throws when 'require' is true", async() => {
    try {
      await setupPassing(Object.assign(
        {},
        testOptions,
        { require : true, workflowMatchers : ['unit-tests/1', 'fubar/2'] })
      )
      throw new Error('setupPassing failed to throw when requried worflows missing')
    }
    catch (e) {
      expect(e.message).toMatch(/fubar/)
    }
  })
})
