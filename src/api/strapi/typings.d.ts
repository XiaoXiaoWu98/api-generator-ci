/**
 * ------------------------------------
 * !!! 不要修改,这是生成的代码 !!!
 * ------------------------------------
 */
// tslint:disable
declare namespace ApiStrapi {
    export interface ResUserUserInfoid {
        /**
         * 状态码
         */
        code: number
        /**
         * 提示信息
         */
        msg: string
        data: ResUserUserInfoidData
    }
    /**
     * 数据
     */
    export interface ResUserUserInfoidData {
        /**
         * 用户名
         */
        user_name: string
        /**
         * 唯一标识
         */
        id: string
        /**
         * 电话号码
         */
        phone: string
        info: ResUserUserInfoidDataInfo
    }
    /**
     * 具体信息
     */
    export interface ResUserUserInfoidDataInfo {
        /**
         * 地址
         */
        address: string
    }

    export interface ParamUserUserInfoid {
        id: string
    }

    export interface ReqUserUserInfoid {}
}
