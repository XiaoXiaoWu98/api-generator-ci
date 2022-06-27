import { APIDataType, Definitions } from './apiType'
import { firstUpperCase, genInterfaceName } from './apiLib'
import { JSONSchema } from 'json-schema-to-typescript'

/**
 * 定义接口方法名称
 */
export default function (api: APIDataType) {
    //如果有方法名就直接返回
    if (api.functionName && api.operationId) {
        return api
    }
    //接口方法定义
    const functionNames = String(api.path)
        .split('/')
        .map((v) => {
            return v.split('-').map(firstUpperCase).join('')
        })
        .filter((v) => v)

    const functionName =
        functionNames.length > 1
            ? `${firstUpperCase(
                  functionNames[functionNames.length - 2]
              )}${firstUpperCase(functionNames[functionNames.length - 1])}`
            : firstUpperCase(functionNames[functionNames.length - 1])

    api.functionName = functionName
    if (!api.operationId || api.operationId?.startsWith('undefined')) {
        api.operationId = functionNames.join('')
    }

    return api
}

//根据接口方法名定义类型名称
export function destructionTag(
    api: APIDataType,
    source: Definitions,
    refPre = '#/definitions/'
) {
    if (api.responses) {
        const res = api.responses['default'] || api.responses['200']
        const content = res.content
            ? res.content['application/json'] || res.content['*/*']
            : res
        let schema = content.schema as JSONSchema

        if (schema && !schema.$ref) {
            if (
                schema.type === 'object' &&
                schema.properties &&
                schema.properties.response
            ) {
                schema = schema.properties.response
                api.responses = {
                    default: {
                        content: {
                            ['application/json']: {
                                // @ts-ignore
                                schema,
                            },
                        },
                    },
                }
            }

            const namePre = 'Res' + genInterfaceName(api)
            destructionSchema(schema, namePre, source, refPre)
        }
    }
    if (api.requestBody) {
        // @ts-ignore
        const content = api.requestBody.content as {
            [formType: string]: {
                schema: JSONSchema
            }
        }

        const formTypes = Object.keys(content || {})
        if (formTypes.length === 1) {
            const schema = content[formTypes[0]].schema

            const namePre = 'Req' + genInterfaceName(api)
            destructionSchema(schema, namePre, source, refPre)
        }
    }
}

//遍历给替换$ref
export function destructionSchema(
    schema: JSONSchema,
    namePre: string,
    source: Definitions,
    refPre = '#/definitions/'
) {
    if (
        schema.properties &&
        ['object', 'array'].includes(String(schema.type))
    ) {
        //遍历数据属性
        for (const name of Object.keys(schema.properties)) {
            const props = schema.properties[name]
            if (['object', 'array'].includes(String(props.type))) {
                schema.properties[name] = destruction(
                    props,
                    namePre + firstUpperCase(name),
                    source,
                    refPre
                )
            }
        }
    }
}

//遍历给替换$ref，方便toTs另外神明
export function destruction(
    prop: JSONSchema,
    name: string,
    source: Definitions,
    refPre = '#/definitions/'
) {
    if (
        prop.type === 'array' &&
        prop.items &&
        // @ts-ignore
        !Array.isArray(prop.items.type)
    ) {
        // @ts-ignore
        const type = String(prop.items.type)
        if (['array', 'object'].includes(type)) {
            prop.items = destruction(prop.items, name + 'Item', source, refPre)
            return prop
        }
    }

    destructionSchema(prop, name, source, refPre)

    if (!source[name]) {
        source[name] = prop
    } else {
        // console.warn('repeat', name, source)
        console.warn('repeat', name)
    }

    return {
        $ref: `${refPre}${name}`,
    }
}
