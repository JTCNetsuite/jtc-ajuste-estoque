/**
 * @NAPIVersion 2.x
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */

import { EntryPoints } from "N/types"
import * as MSR from '../models/jtc_make_ajuste_estoque_mr_MSR'
import * as log from 'N/log'

export const getInputData: EntryPoints.MapReduce.getInputData = () => {
    try {
        return MSR.getInputData()
    } catch (e) {
        log.error("jtc_make_ajuste_estoque_MR.getInputData", e)
    }
}

export const map: EntryPoints.MapReduce.map = (ctx: EntryPoints.MapReduce.mapContext) => {
    try {
        MSR.map(ctx)
    } catch (e) {
        log.error("jtc_make_ajuste_estoque_MR.map", e)
    }
}

