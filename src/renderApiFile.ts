import * as Sqrl from 'squirrelly'
import * as path from 'path'
import * as fs from 'fs'
import * as prettier from 'prettier'
import { APIDataType } from './apiType'
import { firstLowerCase } from './apiLib'
import { toSafeString } from 'json-schema-to-typescript/dist/src/utils'

const tplRoot = path.join(__dirname, '../template')

const codeFormatRule = {
    singleQuote: true,
    semi: false,
    tabWidth: 4,
    parser: 'typescript',
}

function getTpl(url: string) {
    return fs.readFileSync(path.join(tplRoot, url), 'utf8')
}

function getActions(apis: APIDataType[]) {
    return apis.map((api) => {
        const headers = (api.body && api.body.inter.headers) || {}
        const functionName = firstLowerCase(toSafeString(api.functionName))

        const paths = api.param && api.param.inter.name
        let injectCode = `const url = '${api.path}'`

        if (paths) {
            const replaeKeys = api.param.replaeKeys as string[]
            injectCode += replaeKeys.map(
                (k) => `.replace('{${k}}', String(paths['${k}']))`
            ).join('')
        }

        return {
            ...api,
            summary: api.summary || '',
            description: api.description || '',
            method: api.method.toLocaleUpperCase(),
            functionName,
            injectCode,
            paths,
            params: api.query && api.query.inter.name,
            body: api.body && api.body.inter.name,
            headers: JSON.stringify(headers),
            res: api.responses.inter ? api.responses.inter.name : 'any',
        }
    })
}

/**
 * 渲染具体 action
 * @param options
 * @returns
 */
export function renderAction(options: {
    namespace: string
    apis: APIDataType[]
}) {
    const actions = getActions(options.apis)

    const tpl = getTpl('apiAction.tpl')

    const code = Sqrl.render(tpl, {
        actions,
        namespace: options.namespace,
    })

    return prettier.format(code, codeFormatRule)
}

/**
 * 渲染入口
 * @param options
 * @returns
 */
export function renderIndex(options: {
    namespace: string
    apis: APIDataType[]
    fileList: string[]
}) {
    const actions = getActions(options.apis)
    const tpl = getTpl('index.tpl')

    return prettier.format(
        Sqrl.render(tpl, {
            ...options,
            actions,
        }),
        codeFormatRule
    )
}

/**
 * 渲染类型
 * @param options
 * @returns
 */
export function renderType(options: {
    namespace: string
    interList: string[]
}) {
    const tpl = getTpl('apiType.tpl')

    const code = Sqrl.render(tpl, options)

    return prettier.format(code, codeFormatRule)
}
