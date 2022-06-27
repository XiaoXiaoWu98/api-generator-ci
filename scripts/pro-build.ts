import { projectBuild, configOptions } from "project-build-ci";

const path = require('path');


const config: configOptions = {
  dingTalk: {
    url: 'https://oapi.dingtalk.com/robot/send?access_token=7b9ea47f361fac9efd844b40944d677890cf32ef8a77cee07a02c5714957624d',
    asign:
      'SEC0a8309d797702dcb52783676d080b9d7961eeed3c876ea80438fcc0bd535d982',
  },
  apps: {
    label: 'project-build-ci',
    name: 'project-build-ci',
    projectPath: path.join(__dirname, '../'),
  },

  envs: [
    {
      name: 'prd',
      identifier: '',
      releaseBranch: 'release',
    },
    {
      name: 'sit',
      identifier: 'sit',
      releaseBranch: 'sit',
    },
  ],
  //prd环境
  prdAppEnv: 'prd',
};

projectBuild(config);
