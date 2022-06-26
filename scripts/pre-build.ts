const path = require('path');
const { preBuild } = require('project-build-ci');

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
    },
    {
      name: 'dev',
      identifier: '',
      releaseBranch: 'dev',
    },
  ],
  prdAppEnv: 'prd',
});
