/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */



import { EntryPoints } from "N/types"
import * as runtime from 'N/runtime'
import * as log from 'N/log'
import { constates as CTS} from "../module/jtc_import_ids"
import * as file from 'N/file'
import * as search from 'N/search'
import * as record from "N/record"
import * as format from 'N/format'


export const getInputData = () => {
    try {
        const currScipt = runtime.getCurrentScript()
        const idFile: string | number | any = currScipt.getParameter({name: CTS.SCRIPT_MAP_REDUCE.ID_FILE_CSV})
        const idIbd = currScipt.getParameter({name: CTS.SCRIPT_MAP_REDUCE.ID_REC_AJUSTE})

        const recAdInventory = record.load({
            id: idIbd,
            type: record.Type.INVENTORY_ADJUSTMENT,
            isDynamic: true
        })



        log.debug("id file", idFile)
        const fileCsv = file.load({id: idFile})
        const content = fileCsv.getContents()
        const response = formatCSVToNetsuite(content)
        log.debug("reposnse", response)

        const localtion = recAdInventory.getValue(CTS.ADJ_INVENTORY.LOCALIDADE)

        const sublistId = CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID


        const firstline = recAdInventory.getSublistValue({
            sublistId:sublistId, 
            fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ITEM,
            line: 0
        })
        
        if (firstline == 442) {
            recAdInventory.removeLine({sublistId: sublistId, line: 0})
        }
        
        for (var i =0; i < response.length; i++) {
            try {
                const value = response[i].split(";")

                recAdInventory.selectNewLine({sublistId: sublistId})
    
                recAdInventory.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ITEM,
                    sublistId: sublistId,
                    value: Number(value[0])
                })
                recAdInventory.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.QTDE_ADJ,
                    sublistId: sublistId,
                    value: Number(value[1])
                })
                recAdInventory.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.LOCALIDADE,
                    sublistId: sublistId,
                    value: localtion
                })
    
                const valor_string = String(value[4]).split('"')[1]
                const valor = Number(valor_string.replace(",", "."))
    
                recAdInventory.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.PRECO_UNIT,
                    sublistId: sublistId,
                    value: valor
                })
                
                const inventorydetail = recAdInventory.getCurrentSublistSubrecord({
                    fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.ID,
                    sublistId: sublistId
                })
    
                const inv = inventorydetail.selectNewLine({
                    sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID
                })
                log.debug('inv', inv)
    
                if(Number(value[1]) >= 0 ) {
                    inventorydetail.setCurrentSublistValue({
                        fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.NUM_SERIAL,
                        sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
                        value: value[3]             
                    })
                } else {
                    log.debug("lote", value[3])
            
                    const createSearchInventory = search.create({
                        type: 'inventorynumber',
                        filters: [
                            ['inventorynumber', search.Operator.CONTAINS, String(value[3]).replace(" ", "")],
                            "AND", 
                            ["item.internalid", search.Operator.ANYOF, value[0]], 
                            "AND", 
                            ["location", search.Operator.ANYOF, localtion]
                            
                        ],
                        columns: [
                            search.createColumn({name: 'inventorynumber'})
                        ]
                    }).run().getRange({start: 0, end:1})
                    
                    log.debug("createSearchInventory",createSearchInventory)
            
                    inventorydetail.setCurrentSublistValue({
                        fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.NEGATIVE_SET_SERIAL,
                        sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
                        value: createSearchInventory[0].id       
                    })
                }
                inventorydetail.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.QUATITY,
                    sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
                    value: value[1]             
                })
                // const date = format.format({type: format.Type.DATE, timezone: format.Timezone.AMERICA_SAO_PAULO, value: value[2]})
                // log.debug('date', date)
                inventorydetail.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.DATA_VALIDADE,
                    sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
                    value: new Date(value[2])
                })
                const line = inventorydetail.commitLine({sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID})
                const lin_inv = recAdInventory.commitLine({sublistId: sublistId})
            } catch (error) {
                log.error(`linha ${i}`, error)
            }
            
                
        }

        const idInventoryRec = recAdInventory.save({ignoreMandatoryFields: true})

        log.audit("idIventory", idInventoryRec)

        // return response



    } catch (e) {
        log.error("jtc_make_ajuste_estoque_mr_MSR.getInputData", e)
    }
}

export const map = (ctx: EntryPoints.MapReduce.mapContext) => {
    try {
        // const currScipt = runtime.getCurrentScript()
        // const idInv = currScipt.getParameter({name: CTS.SCRIPT_MAP_REDUCE.ID_REC_AJUSTE})
        
        // const recAdInventory = record.load({
        //     type: record.Type.INVENTORY_ADJUSTMENT,
        //     id: idInv,
        //     isDynamic: true
        // })

        // const sublistId = CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID
        
        // const value = String(ctx.value).split(";")
        // log.debug("ctx", value)

        // const firstline = recAdInventory.getSublistValue({
        //     sublistId:sublistId, 
        //     fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ITEM,
        //     line: 0
        // })
        
        // if (firstline == 442) {

        //     recAdInventory.removeLine({sublistId: sublistId, line: 0})
        // }

        // recAdInventory.selectNewLine({sublistId: sublistId})

        // recAdInventory.setCurrentSublistValue({
        //     fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ITEM,
        //     sublistId: sublistId,
        //     value: Number(value[0])
        // })
        // recAdInventory.setCurrentSublistValue({
        //     fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.QTDE_ADJ,
        //     sublistId: sublistId,
        //     value: Number(value[1])
        // })
        // recAdInventory.setCurrentSublistValue({
        //     fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.LOCALIDADE,
        //     sublistId: sublistId,
        //     value: String(value[4])
        // })

        // const valor_string = String(value[5]).split('"')[1]
        // const valor = Number(valor_string.replace(",", "."))

        // recAdInventory.setCurrentSublistValue({
        //     fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.PRECO_UNIT,
        //     sublistId: sublistId,
        //     value: valor
        // })
        
        // const inventorydetail = recAdInventory.getCurrentSublistSubrecord({
        //     fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.ID,
        //     sublistId: sublistId
        // })

        // const inv = inventorydetail.selectNewLine({
        //     sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID
        // })
        // log.debug('inv', inv)

        // if(Number(value[1]) >= 0 ) {
        //     inventorydetail.setCurrentSublistValue({
        //         fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.NUM_SERIAL,
        //         sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
        //         value: value[3]             
        //     })
        // } else {
        //     log.debug("lote", value[3])
    
        //     const createSearchInventory = search.create({
        //         type: 'inventorynumber',
        //         filters: [
        //             ['inventorynumber', search.Operator.CONTAINS, String(value[3]).replace(" ", "")],
        //             "AND", 
        //             ["item.internalid", search.Operator.ANYOF, value[0]], 
        //             "AND", 
        //             ["location", search.Operator.ANYOF, value[4]]
                    
        //         ],
        //         columns: [
        //             search.createColumn({name: 'inventorynumber'})
        //         ]
        //     }).run().getRange({start: 0, end:1})
            
        //     log.debug("createSearchInventory",createSearchInventory)
    
        //     inventorydetail.setCurrentSublistValue({
        //         fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.NEGATIVE_SET_SERIAL,
        //         sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
        //         value: createSearchInventory[0].id       
        //     })
        // }
        // inventorydetail.setCurrentSublistValue({
        //     fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.QUATITY,
        //     sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
        //     value: value[1]             
        // })
        // const date = String(value[2]).split("/")
        // inventorydetail.setCurrentSublistValue({
        //     fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.DATA_VALIDADE,
        //     sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
        //     value: new Date(value[2])
        // })
        // const line = inventorydetail.commitLine({sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID})
        // const lin_inv = recAdInventory.commitLine({sublistId: sublistId})


        // const idIventory = recAdInventory.save()

        // log.audit('idInventory', idIventory)

        



    } catch (e) {
        log.error("jtc_make_ajuste_estoque_mr_MSR.map", e)
    }
}

const formatCSVToNetsuite = (content: string) => {
    const ret = []
    const x = content.split("\n")

    log.debug("x",x)

    x.shift()
    x.pop()
    for (var i=0; i < x.length; i++) {
        // log.debug(i, x[i])
        ret.push(x[i])
    }

    return ret
    
}

// for (var i=0; i < values.length; i++) {
//     const value = values[i].split(";")

//     recAdInventory.selectNewLine({sublistId: sublistId})

//     recAdInventory.setCurrentSublistValue({
//         fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ITEM,
//         sublistId: sublistId,
//         value: Number(value[0])
//     })
//     recAdInventory.setCurrentSublistValue({
//         fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.QTDE_ADJ,
//         sublistId: sublistId,
//         value: value[1]
//     })
//     recAdInventory.setCurrentSublistValue({
//         fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.LOCALIDADE,
//         sublistId: sublistId,
//         value: String(value[4]).split(" ")[0]
//     })
    
//     const inventorydetail = recAdInventory.getCurrentSublistSubrecord({
//         fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.ID,
//         sublistId: sublistId
//     })

//     const inv = inventorydetail.selectNewLine({
//         sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID
//     })
//     log.debug('inv', inv)

    

    

//     log.debug('line', line)

    

//     log.audit("idInv", idInv)
    
// }
