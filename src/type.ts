import { OperationObject } from 'openapi3-ts'
import { JSONSchema } from 'json-schema-to-typescript'
export interface APIDataType extends OperationObject {
    path: string
    method: string
}

export interface TagAPIDataType {
    [tag: string]: APIDataType[]
}

export interface Definitions {
    [name: string]: JSONSchema
}

export type FormatQueryType = (name: string, api: APIDataType) => string | string[] | null


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
     * 格式化 query 类型
     * 如， id 要返回 'number | strng'
     */
    formatQueryType?: FormatQueryType
    /*!
     * 完成后执行
     */
    done?: Function

    /*! 请求超时时间, 默认 30 秒 */
    timeout?: number
}