import { JSONSchema } from 'json-schema-to-typescript'
import { OperationObject } from 'openapi3-ts'
export interface APIDataType extends OperationObject {
    path: string
    method: string
    // responses?: any
    summary?: string
    description?: string
    param?: any
    query?: any
    body?: any
}

export interface TagAPIDataType {
    [tag: string]: APIDataType[]
}

export interface Definitions {
    [name: string]: JSONSchema
}

export type FormatQueryType = (
    name: string,
) => string | string[] | null

export interface Options {
    /*!
     * swagger / openapi json
     */
    api: string

    /*!
     * 名字空间
     */
    namespace: string

    /*!
     * 输出目录，绝对地址
     */
    sdkDir: string

    /*!
     * 过滤数据
     */
    filter?: Array<(api: APIDataType, tag?: string) => boolean>

    /*!
     * 完成后执行
     */
    done?: Function

    /*! 请求超时时间, 默认 30 秒 */
    timeout?: number
}
