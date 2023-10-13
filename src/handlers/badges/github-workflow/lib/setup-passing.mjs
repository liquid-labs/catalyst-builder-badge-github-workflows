import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import createError from 'http-errors'
import yaml from 'js-yaml'

import { getGitHubOrgAndProject } from '@liquid-labs/github-toolkit'
import { getPackageJSON } from '@liquid-labs/npm-toolkit'

const setupPassing = async({ config, myName, myVersion, require, workflowMatchers, workingPkgRoot }) => {
  const matchers = workflowMatchers.map((wm) => {
    const [matcher, priority] = wm.split('/')
    return {
      matcher : new RegExp(matcher, 'i'),
      priority
    }
  })

  const workflowsPath = fsPath.join(workingPkgRoot, '.github', 'workflows')
  if (!existsSync(workflowsPath)) {
    return []
  }

  const packageJSON = await getPackageJSON({ pkgDir : workingPkgRoot })
  const { org, project } = getGitHubOrgAndProject({ packageJSON })

  try {
    const workflows = await fs.readdir(workflowsPath)
    // we return an array of promises
    return await matchers.reduce(async(acc, { matcher, priority }) => {
      acc = await acc
      const workflow = workflows.find((wf) => wf.match(matcher) !== null)
      if (require === true && workflow === undefined) {
        throw new Error(`Did not find matching workflow for '${matcher.toString()}'.`)
      }
      else if (workflow !== undefined) {
        const workflowPath = fsPath.join(workflowsPath, workflow)
        const workflowContents = await fs.readFile(workflowPath, { encoding : 'utf8' })
        const workflowData = yaml.load(workflowContents)
        const { name } = workflowData

        const badgeLine = `[![${name}](https://github.com/${org}/${project}/actions/workflows/${workflow}/badge.svg)](https://github.com/${org}/${project}/actions/workflows/${workflow})`

        acc.push({
          artifacts : [
            {
              builder : myName,
              version : myVersion,
              priority,
              content: badgeLine,
              purpose : `Display status of '${name}' GitHub Workflow.`,
              config
            }
          ]
        })
      }
      return acc
    }, [])
  }
  catch (e) { // from 'fs.readdir'
    if (e.code !== 'ENOENT') {
      throw e
    }
    else if (require === true) {
      throw createError.BadRequest('Did not find workflows to create passing badges at: ' + workflowsPath, { cause : e })
    }
    // else, taht's fine there's just nothing to do
  }
}

export { setupPassing }
