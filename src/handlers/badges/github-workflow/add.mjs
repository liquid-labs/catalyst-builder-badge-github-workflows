import { processBadgeBuilders, updateReadme } from '@liquid-labs/catalyst-lib-badges'
import { gatherBasicBuilderData, processBuilderResults } from '@liquid-labs/catalyst-lib-build'
import { httpSmartResponse } from '@liquid-labs/http-smart-response'

import { setupPassing } from './lib/setup-passing'

const defaultWorklowMatchers = ['unit-tests/1']

const help = {
  name        : 'Add github workflow badges',
  summary     : 'Adds github workflow status badges to the target package README.md.',
  description : ''
}

const method = 'put'
const path = ['badges', 'github-workflow', 'add']
const parameters = [
  {
    name         : 'workflowMatchers',
    isMultivalue : true,
    summary      : `A set of string of the form '&lt;match string&gt;/&lt;priority&gt;'. 'Match string' is used to match against workflow file names. Matched names will generate badges ordered by 'priority'. Unmatched names are ignored by default. Defaults to ['${defaultWorklowMatchers.join("', '")}' ]. If \`requireWorkflows\` is true, then this will instead result in an error if no matching workflow found.`
  },
  {
    name      : 'requireWorkflows',
    isBoolean : true,
    summary   : 'If a any workflow `workflowID` not found, then an exception is raised.'
  }
]

const func = ({ app, reporter }) => async(req, res) => {
  reporter.isolate()

  const {
    priority = 1,
    workflowMatchers = defaultWorklowMatchers,
    requireWorkflows = false
  } = req.vars

  const { builderName: myName, builderVersion: myVersion, workingPkgRoot } =
    await gatherBasicBuilderData({ builderPkgDir : __dirname, req })

  const builders = await setupPassing({
    config  : req.vars,
    myName,
    myVersion,
    priority,
    require : requireWorkflows,
    workflowMatchers,
    workingPkgRoot
  })

  const results = await processBadgeBuilders({ builders })

  await processBuilderResults({ app, path, pkgRoot : workingPkgRoot, reporter, results, ...req.vars })

  await updateReadme({ pkgRoot : workingPkgRoot })

  const msg = `Added ${builders.length} coverage badge(s).`

  httpSmartResponse({ msg, data : results, req, res })
}

export { help, func, method, parameters, path }
