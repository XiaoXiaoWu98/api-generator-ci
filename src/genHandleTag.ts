import { APIDataType, Definitions } from './apiType'
import { compile, JSONSchema } from 'json-schema-to-typescript'

import { toSafeString } from 'json-schema-to-typescript/dist/src/utils'
import { genInterfaceName } from './apiLib'
import {} from './genHandleTag'
/**
 * 默认的 query 类型处理
 * @param name
 * @param api
 * @returns
 */
function defFormatQueryType(name: string, api: APIDataType) {
    name = String(name).toLocaleLowerCase()
    if (
        name.includes('id') ||
        ['top', 'page', 'page_size', 'pagesize', 'size'].includes(name)
    ) {
        return ['string', 'number']
    }
}

/**
 * 生成 query / parameter 类型
 * @param api
 */
export async function genApiQuery(api: APIDataType) {
    if (api.parameters) {
        // @ts-ignore
        const query = api.parameters.filter((v) => v.in === 'query')
        // @ts-ignore
        const path = api.parameters.filter((v) => v.in === 'path')
        if (query.length) {
            const schema: JSONSchema = {
                type: 'object',
                properties: {},
            }
            query.forEach((q) => {
                // @ts-ignore
                schema.properties[q.name] = {
                    // @ts-ignore
                    description: q.description,
                    // @ts-ignore
                    ...q.schema,
                    // @ts-ignore
                    type: q.schema.type,
                }
            })

            // @ts-ignore
            schema.required = query.filter((v) => v.required).map((v) => v.name)

            const name = toSafeString('Query' + genInterfaceName(api))

            let inter = await compile(schema, name, {
                bannerComment: '',
                style: {
                    singleQuote: true,
                    semi: false,
                    tabWidth: 4,
                },
            })

            inter = inter.replace(/\[k\: string\]\: unknown/g, '')
            api.query = {
                inter: {
                    name,
                    code: inter,
                    schema,
                },
            }
        }
        if (path.length) {
            const schema: JSONSchema = {
                type: 'object',
                properties: {},
            }
            const replaeKeys: string[] = []
            path.forEach((q) => {
                // @ts-ignore
                replaeKeys.push(q.name)
                // @ts-ignore
                schema.properties[q.name] = {
                    // @ts-ignore
                    description: q.description,
                    // @ts-ignore
                    ...q.schema,
                    // @ts-ignore
                    type: q.schema.type,
                }
            })

            // @ts-ignore
            schema.required = path.map((v) => v.name)

            const name = toSafeString('Param' + genInterfaceName(api))

            let inter = await compile(schema, name, {
                bannerComment: '',
                style: {
                    singleQuote: true,
                    semi: false,
                    tabWidth: 4,
                },
            })
            inter = inter.replace(/\[k\: string\]\: unknown/g, '')
            api.param = {
                replaeKeys,
                inter: {
                    name,
                    code: inter,
                    schema,
                },
            }
        }
    }
}

/**
 * 返回引用的对象名
 * @param schema
 * @returns
 */
function getApiRefName(schema: JSONSchema) {
    if (typeof schema !== 'object' || !schema.$ref) {
        // @ts-ignore
        return schema as string
    }

    let refName = schema.$ref
        .replace('#/components/schemas/', '')
        .replace('#/definitions/', '')
    if (schema.$ref === '#' && schema.id) {
        refName = schema.id
    }
    return refName
}

/**
 * 返回引用的对象
 * @param schema
 * @param definitions
 * @returns
 */
function resolveRefObject(schema: JSONSchema, definitions: Definitions) {
    if (!schema || !schema.$ref) {
        return schema
    }

    let refName = getApiRefName(schema)

    if (definitions[refName]) {
        const res = definitions[refName]
        delete res.title
        return res
    }

    console.error(`[swaggerBuild] Data Error! Notfoud: ${schema.$ref}`)
    throw new Error(`[swaggerBuild] Data Error! Notfoud: ${schema.$ref}`)
}

/**
 * 解释 interface 失败时，解释 schema 生成 type
 * @param schema
 * @param definitions
 * @returns
 */
function getApiType(schema: JSONSchema, definitions: Definitions): string {
    if (!schema && schema !== 0) {
        return 'any'
    }
    if (typeof schema !== 'object') {
        return schema
    }
    if (schema.$ref) {
        return getApiRefName(schema)
    }

    let type = schema.type

    switch (schema.format) {
        case 'float':
        case 'double':
        case 'int32':
        case 'int64':
            type = 'number'
            break
    }

    if (schema.enum) {
        // @ts-ignore
        type = 'enum'
    }

    switch (type) {
        case 'number':
        case 'int':
        case 'integer':
        case 'long':
        case 'float':
        case 'double':
            return 'number'

        case 'Date':
        case 'date':
        case 'dateTime':
        case 'date-time':
        case 'datetime':
            return 'Date'

        case 'string':
        case 'email':
        case 'password':
        case 'url':
        case 'byte':
        case 'binary':
            return 'string'

        case 'boolean':
            return 'boolean'

        case 'array':
            return `${getApiType(schema.items!, definitions)}[]`

        /** 以下非标准 */
        case 'enum':
            return Array.isArray(schema.enum)
                ? Array.from(
                      new Set(
                          schema.enum.map((v) =>
                              typeof v === 'string'
                                  ? `"${v.replace(/"/g, '"')}"`
                                  : getApiType(v as JSONSchema, definitions)
                          )
                      )
                  ).join(' | ')
                : 'string'

        default:
            try {
                if (schema.oneOf && schema.oneOf.length) {
                    return schema.oneOf
                        .map((item) => getApiType(item, definitions))
                        .join(' | ')
                }
                const props: string[] = []
                if (schema.properties) {
                    const keys = Object.keys(schema.properties)
                    if (keys.length > 1000) {
                        return 'any'
                    }
                    keys.forEach((prop) => {
                        // @ts-ignore
                        if (schema.properties[prop].description) {
                            props.push(`
/**
 * ${schema.properties![prop].description}
 **/`)
                        }
                        props.push(
                            `${
                                prop.includes('-') ? `"${prop}"` : prop
                            }: ${getApiType(
                                // @ts-ignore
                                schema.properties[prop],
                                definitions
                            )}`
                        )
                    })
                }
                if (schema.additionalProperties) {
                    const indexType = schema.additionalProperties
                        ? schema.additionalProperties === true
                            ? `any`
                            : getApiType(
                                  schema.additionalProperties,
                                  definitions
                              )
                        : undefined
                    if (indexType) {
                        props.push(`[key: string]: ${indexType}`)
                    }
                }
                return props.length
                    ? `{ 
                    ${props.join('\n')} 
                }`
                    : 'any'
            } catch (error) {
                return 'any'
            }
    }
}

/**
 * 生成请求 body
 * @param api
 * @param definitions
 */
export async function genApiBody(api: APIDataType, definitions: Definitions) {
    if (!api.requestBody) {
        return
    }
    const name = toSafeString('Req' + genInterfaceName(api))

    // @ts-ignore
    const content = api.requestBody.content as {
        [formType: string]: {
            schema: JSONSchema
        }
    }

    if (!content) {
        api.body = {
            inter: {
                headers: {},
                name,
                code: `type ${name} = any`,
            },
        }
        return
    }

    const formTypes = Object.keys(content)
    if (formTypes.length !== 1) {
        return
    }
    const schema = resolveRefObject(content[formTypes[0]].schema, definitions)

    const headers = {
        'content-type': formTypes[0],
    }

    let inter = ''
    try {
        inter = await compile(
            {
                ...schema,
                definitions,
            },
            name,
            {
                bannerComment: '',
                style: {
                    singleQuote: true,
                    semi: false,
                    tabWidth: 4,
                },
            }
        )

        inter = inter.replace(/\[k\: string\]\: unknown/g, '')
    } catch (error) {
        inter = `type ${name} = ${getApiType(schema, definitions)}`
    }

    api.body = {
        inter: {
            headers,
            name,
            code: inter,
            schema: {
                ...schema,
                definitions,
            },
        },
    }
}

/**
 * 生成返回类型
 * @param api
 * @param definitions
 */
export async function genResponses(api: APIDataType, definitions: Definitions) {
    if (api.responses) {
        const res = api.responses['200'] || api.responses['default']
        const content = res.content
            ? res.content['application/json'] || res.content['*/*']
            : res
        const schema = resolveRefObject(content.schema, definitions)

        let name = toSafeString('Res' + genInterfaceName(api))
        // console.log('definitions:', definitions)
        let inter = ''
        try {
            inter = await compile(
                {
                    definitions,
                    ...schema,
                    title: undefined,
                },
                name,
                {
                    bannerComment: '',
                    style: {
                        singleQuote: true,
                        semi: false,
                        tabWidth: 4,
                    },
                }
            )

            inter = inter.replace(/\[k\: string\]\: unknown/g, '')
        } catch (error) {
            inter = `type ${name} = ${getApiType(schema, definitions)}`
        }

        if (inter.includes('EmptyObject')) {
            name = 'EmptyObject'
        }

        api.responses.inter = {
            name,
            code: inter,
            schema: {
                definitions,
                ...schema,
            },
        }
    }
}
