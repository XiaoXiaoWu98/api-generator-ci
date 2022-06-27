import { OpenAPIObject } from 'openapi3-ts'
const Swagger2OAS = require('swagger2openapi')

const swaggerDefPrefix = '#/definitions/'
const renameTypePrefix = 'DTO_'

export async function convertSwagger2OpenAPI(data: OpenAPIObject) {
    await fixRefName(data)
    data = (await s2o(data)) as OpenAPIObject
    fixOpenAPI(data)
    return data
}

//检查$$ref，去掉不规则字符
 export async function fixRefName(data: OpenAPIObject) {
    const refMap: any = {}
    let definitions = data.definitions || {}
    Object.keys(definitions).forEach((key) => {
        refMap[key] = []
    })

    findRef(data).forEach((refItem: { $ref: any; type: string }) => {
        const $ref = refItem.$ref
        if (
            !$ref.startsWith(swaggerDefPrefix) 
        ) {
            throw new CommonError(`未实现解析: ${$ref}`)
        }
        const key = $ref
            .replace(swaggerDefPrefix, '')
        if (!refMap[key]) {
            console.warn(`未找到类型定义: ${$ref}`)
            delete refItem.$ref
            refItem.type = 'any'
            return
        }
        refMap[key].push(refItem)
    })
    let count = 0
    Object.keys(refMap).forEach((key) => {
        if (!testTypeNameValid(key)) {
            let newName = key.replace(/[^a-zA-Z0-9_]/g, '_')
            newName = data.definitions[newName]
                ? `${renameTypePrefix}${count}`
                : newName
            data.definitions[newName] = data.definitions[key]
            delete data.definitions[key]
            refMap[key].forEach((refItem: { $ref: string }) => {
                refItem.$ref = `${swaggerDefPrefix}${newName}`
            })
            count++
        }
    })
}


//swagger转openapi
async function s2o(data: OpenAPIObject) {
    return new Promise((resolve, reject) => {
        data =
            Swagger2OAS.convertObj(
                data,
                {
                    warnOnly: true,
                    patch: true,
                    resolve: true,
                },
                (err: any, result: { openapi: unknown }) => {
                    if (err) {
                        return reject(err)
                    }
                    return resolve(result.openapi)
                }
            ) || {}
    })
}

//找出$$ref属性指向components的属性
function findRef(object: OpenAPIObject) {
    // 考虑到 example
    if (!object || {}.toString.call(object) !== '[object Object]') {
        return []
    }
    if (object.$ref) {
        return [object]
    }
    const list: any = []
    Object.keys(object).forEach((key) => {
        if (typeof object === 'object') {
            list.push(...findRef(object[key]))
        }
    })
    return list
}

//文件命名格式验证
function testTypeNameValid(name: string) {
    return /^[a-zA-Z0-9_]*$/.test(name)
}

//修复没有分组接口以及优化组名格式不规则命名
export function fixOpenAPI(data: OpenAPIObject) {
    const { tags = [], paths } = data
    const finalNameMap = {} as { [key: string]: string }
    Object.keys(paths).forEach((path) => {
        const pathItemObject = paths[path]
        Object.keys(pathItemObject).forEach((method) => {
            const operation = pathItemObject[method]
            if (!Array.isArray(operation.tags) || !operation.tags.length) {
                operation.tags = ['Default']
            }
            operation.tags = operation.tags.map((tagName: string) => {
                if (finalNameMap[tagName]) {
                    return finalNameMap[tagName]
                }
                let tagObject = tags.find((t) => t.name === tagName)
                if (!tagObject) {
                    tagObject = {
                        name: tagName,
                        description: tagName,
                    }
                    tags.push(tagObject)
                }
                if (!testTypeNameValid(tagObject.name)) {
                    const description = (
                        tagObject.description || tagObject.name
                    )
                        .replace(/ /g, '')
                        .replace(/[\-\,\.\/]/g, '_')
                    const newName = testTypeNameValid(description)
                        ? description
                        : 'UNKNOWN'
                    tagObject.description = tagObject.name
                    return (tagObject.name = finalNameMap[tagObject.name] =
                        newName)
                } else {
                    return (finalNameMap[tagObject.name] = tagObject.name)
                }
            })
        })
    })
}

class CommonError extends Error {
    constructor(message: string) {
        super(`[API-Generator-Ci] ${message}`)
    }
}
