import { preBuild, configOptions } from 'project-build-ci'

const path = require('path')

preBuild({
    apps: {
        label: 'swagger-build',
        name: 'swagger-build',
        projectPath: path.join(__dirname, '../'),
    },

    envs: [
        {
            name: 'prd',
            identifier: '',
            releaseBranch: 'release',
            isNpm: true
        },
        {
            name: 'dev',
            identifier: '',
            releaseBranch: 'dev',
        },
    ],
    prdAppEnv: 'prd',
})
