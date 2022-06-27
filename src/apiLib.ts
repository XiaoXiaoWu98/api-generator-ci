import { JSONSchema } from 'json-schema-to-typescript'
import { APIDataType } from './apiType'
import { toSafeString } from 'json-schema-to-typescript/dist/src/utils'
export function firstUpperCase(str: string) {
    return str.replace(/^[a-z]/, (math) => {
        return math.toUpperCase()
    })
}

export function firstLowerCase(str: string) {
    return str.replace(/^[A-Z]/g, (math) => {
        return math.toLowerCase()
    })
}

export function genInterfaceName(api: APIDataType) {
    let name = api.operationId || ''
    if (api.operationId && api.operationId.includes('/')) {
        if (api.operationId.includes('::')) {
            const tags = api.tags || []
            let tag = ''
            if (tags.length) {
                tag = tags[0].replace(/Controller/i, '').replace(/api/i, '')
            }
            name =
                firstUpperCase(api.method) +
                firstUpperCase(tag) +
                firstUpperCase(api.operationId.split('::').pop() || '')
        } else {
            name = firstUpperCase(api.method) + firstUpperCase(api.functionName)
        }
    }

    return toSafeString(name.replace(/\{|\}/g, ''))
}

export function getFunctionName(api: APIDataType) {
    let name = String(api.functionName || api.operationId || '')
    if (name.includes('_')) {
        let arr = name
            .split(/_|{/)
            .map((v) => {
                return firstUpperCase(v.replace(/\{|\}/g, ''))
            })
            .filter((v) => v)

        name = toSafeString(api.method + arr.join(''))
        api.operationId = name
    }
    return toSafeString(name)
}

export function clearDefinitions(schema: JSONSchema) {
    if (!schema.definitions) {
        return schema
    }
    const clone = JSON.parse(JSON.stringify(schema))
    const definitions = clone.definitions
    delete clone.definitions
    const json = JSON.stringify(clone, null, 2)
    const keys = Object.keys(definitions)
    for (const key of keys) {
        if (!json.includes('/definitions/' + key)) {
            delete definitions[key]
        }
    }

    return {
        ...schema,
        definitions:
            Object.keys(definitions).length > 0 ? definitions : undefined,
    }
}

/** 避免方法名称重复
 * [本来可以直接使用 method + functionName 的方式，但是为了兼容旧生成的 api，只有重复的 functionName 才加上 method]
 */
export function uniqueFunctionName(apis: APIDataType[]) {
    const dealApis: Record<string, APIDataType[]> = {}
    apis.forEach((api) => {
        const has = !!dealApis[api.functionName]
        if (has) {
            dealApis[api.functionName].push(api)
        } else {
            dealApis[api.functionName] = [api]
        }
    })

    Object.values(dealApis).forEach((api) => {
        if (api.length <= 1) return

        api.forEach((item) => {
            item.functionName = item.method + firstUpperCase(item.functionName)
        })
    })
}
