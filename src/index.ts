import axios from 'axios'
import chalk from 'chalk'
import { APIDataType, Definitions, Options, TagAPIDataType } from './apiType'
import fs from 'fs-extra'
import { toSafeString } from 'json-schema-to-typescript/dist/src/utils'
import { compile } from 'json-schema-to-typescript'
import { OpenAPIObject, OperationObject, PathItemObject } from 'openapi3-ts'
import {
    convertSwagger2OpenAPI,
    fixOpenAPI,
    fixRefName,
} from './convertSwagger2OpenAPI'
import handleApiDataType, { destructionTag } from './handleApiDataType'
import { renderAction, renderIndex, renderType } from './renderApiFile'
import path from 'path'
import { getFunctionName, uniqueFunctionName } from './apiLib'
import { genApiBody, genApiQuery, genResponses } from './genHandleTag'

export default async function apiBuildCi(options: Options) {
    const apiUrl = options.api
    const { namespace, sdkDir } = options

    console.log(chalk.green(`拉取 ${namespace} 的 swagger json`))

    //请求JSONSchema
    let json: string = ''

    //格式化json数据
    let jsonData = {} as OpenAPIObject & {
        swagger?: string
    }

    try {
        if (apiUrl.indexOf('http://') > -1) {
            json = await axios
                .request<string>({
                    url: apiUrl,
                    method: 'get',
                    timeout: options.timeout || 30000,
                    transformResponse(res) {
                        return res
                    },
                })
                .then((res) => {
                    return res.data
                })
        } else {
            json = JSON.stringify(fs.readJSONSync(apiUrl))
        }
        if (!json)
            return console.log(
                chalk.bgRed(
                    `请求json数据格式问题: 请确定该链接${apiUrl}是正确的json链接或者文件`
                )
            )
        json = json.replace(/"#\/components\/schemas\//g, '"#/definitions/')

        jsonData = JSON.parse(json)

        if (!Array.isArray(jsonData.tags)) return
        //转小写文件名
        jsonData.tags = jsonData.tags.map((v) => {
            return {
                ...v,
                name: toSafeString(v.name),
            }
        })

        if (jsonData.swagger) {
            jsonData = await convertSwagger2OpenAPI(jsonData)
        } else {
            await fixRefName(jsonData)
            await fixOpenAPI(jsonData)
        }

        if (!jsonData.openapi || !jsonData.openapi.startsWith('3.')) {
            throw new Error('数据格式不正确，仅支持 OpenAPI 3.0/Swagger 2.0')
        }

        //创造$ref指向，转ts时对象和数组分别另外神明
        let apiData: TagAPIDataType = {}

        // 解构 schema
        let definitions: Definitions = {}

        if (jsonData?.components?.schemas) {
            // @ts-ignore
            definitions = {
                ...jsonData.components.schemas,
            }
        }

        Object.keys(jsonData.paths || {}).forEach((path) => {
            //取出每个街口路径
            const pathItem: PathItemObject = jsonData.paths[path]

            ;['get', 'put', 'post', 'delete', 'path', 'patch'].forEach(
                (method) => {
                    const operationObject: OperationObject = pathItem[method]
                    if (operationObject && operationObject.tags) {
                        operationObject.tags.forEach((tag) => {
                            if (!apiData[tag]) {
                                apiData[tag] = []
                            }
                            apiData[tag].push({
                                path,
                                method,
                                ...operationObject,
                            })
                        })
                    }
                }
            )
        })

        // 过滤数据
        if (options.filter) {
            Object.keys(apiData).forEach((tag) => {
                // @ts-ignore
                apiData[tag] = apiData[tag]
                    .map((v) => {
                        if (options.filter) {
                            for (const filter of options.filter) {
                                if (!filter(v, tag)) {
                                    return null
                                }
                                return v
                            }
                        } else {
                            return v
                        }
                    })
                    .filter((v) => v)
            })

            Object.keys(apiData).forEach((tag) => {
                if (!apiData[tag].length) {
                    delete apiData[tag]
                }
            })
        }

        //给 object/array 替换到 $ref指向components schema里面
        Object.keys(apiData).forEach((tag) => {
            const apis = apiData[tag]
            for (const api of apis) {
                handleApiDataType(api)
                destructionTag(api, definitions)
            }
        })
        //清除已有的目录
        // console.log('sdkDir')
        if (fs.existsSync(sdkDir)) {
            // console.log('existsSync')

            fs.removeSync(sdkDir)
        }
        //创建目录
        // console.log('existsSync')
        fs.ensureDirSync(sdkDir)
        console.log(chalk.green(`初始化 ${sdkDir} 目录`))

        const fileList: string[] = []
        const interList: string[] = []
        const allApis: APIDataType[] = []

        //渲染action
        for (const tag of Object.keys(apiData)) {
            // 文件名全部小写，别改了
            let fileName = tag.toLowerCase()
            fileList.push(fileName)
            const apis = apiData[tag]
            allApis.push(...apis)
            for (const api of apis) {
                if (api.operationId?.includes('::')) {
                    let name = api.operationId.split('::').pop()
                    if (name) {
                        api.functionName = name
                    }
                }
                api.functionName = getFunctionName(api)
                // console.log(api.functionName, api.operationId)
                await genApiQuery(api)
                await genApiBody(api, definitions)
                await genResponses(api, definitions)
            }

            uniqueFunctionName(apis)

            for (const api of apis) {
                if (api.responses.inter && api.responses.inter.code) {
                    interList.push(api.responses.inter.code)
                }
                if (api.query && api.query.inter.code) {
                    interList.push(api.query.inter.code)
                }
                if (api.param && api.param.inter.code) {
                    interList.push(api.param.inter.code)
                }
                if (api.body && api.body.inter.code) {
                    interList.push(api.body.inter.code)
                }
            }
            const code = renderAction({ namespace, apis })
            fs.writeFileSync(path.join(sdkDir, fileName + '.ts'), code, 'utf8')
            console.log(chalk.green(`${namespace}: ${fileName}.ts 生成成功`))
        }

        //渲染统一导出
        const indexTs = renderIndex({ namespace, apis: allApis, fileList })

        fs.writeFileSync(path.join(sdkDir, 'index.ts'), indexTs, 'utf8')

        console.log(chalk.green(`${namespace}: index.ts 生成成功`))

        //渲染ts类型文件
        const typeTs = renderType({
            namespace,
            interList,
        })
        fs.writeFileSync(path.join(sdkDir, 'typings.d.ts'), typeTs, 'utf8')
        console.log(chalk.green(`${namespace} 生成成功`))

        if (options.done) {
            options.done()
        }
    } catch (error) {
        console.log(chalk.red(error))
    }
}
