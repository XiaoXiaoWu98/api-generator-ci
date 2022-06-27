#!/usr/bin/env node

const { program } = require('commander')
const version = require('../package.json').version
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const apiBuildCi = require('../dist/index.js').default
const { prompt } = require('enquirer')
const figures = require('figures')
program
    .version(version)
    .option('-c, --config <config>', 'configfile path')
    .option('-i, --interactive', '交互式')
    .action(async (opt) => {
        const c = opt.config
        const interactive = opt.interactive

        let configDir = ''
        if (c) {
            configDir = path.join(process.cwd(), c)
        } else {
            // 默认取项目根目录下的genapiconfig.js
            configDir = path.join(process.cwd(), './apiBuildConfig.js')
        }

        if (!fs.existsSync(configDir)) {
            console.log(chalk.red('错误的配置地址：' + configDir))
            return
        }

        const customConfigs = require(configDir)

        if (!interactive) {
            // 非交互式，直接生成全部
            customConfigs.map(apiBuildCi)
            return
        }

        // 交互式可以选择生成
        let configNames = []
        try {
            const answer = await prompt([
                {
                    name: 'configs',
                    message: '请选择需要生成的 api',
                    type: 'multiselect',
                    initial: [],
                    required: true,
                    validate: (value) => {
                        return value.length > 0 ? true : '请至少选择一个'
                    },
                    choices: customConfigs.map((config) => {
                        return {
                            name: config.namespace,
                            message: config.namespace,
                            indicator: (state, choice) => {
                                return choice.enabled
                                    ? figures.radioOn
                                    : figures.radioOff
                            },
                        }
                    }),
                },
            ])
            configNames = answer.configs
        } catch (err) {
            // no
        }

        const finalConfigs = configNames.map((v) => {
            return customConfigs.find((c) => c.namespace === v)
        })
        finalConfigs.forEach(apiBuildCi)
    })

program.parse()
