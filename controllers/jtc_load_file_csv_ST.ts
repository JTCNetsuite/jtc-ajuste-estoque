/**
 * @NAPIVersion 2.x
 * @NScriptType Suitelet
 */

import { EntryPoints } from 'N/types'
import * as log from 'N/log'
import * as MSR from "../models/jtc_load_file_csv_st_MSR"



export const onRequest: EntryPoints.Suitelet.onRequest = (ctx: EntryPoints.Suitelet.onRequestContext) => {
    try {
        MSR.onRequest(ctx)
    } catch (error) {
        log.error("jtc_load_file_csv_ST.onRequest", error)
    }
}