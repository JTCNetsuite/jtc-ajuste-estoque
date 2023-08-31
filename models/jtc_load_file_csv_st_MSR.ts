/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */

import { EntryPoints } from 'N/types'
import * as log from 'N/log'
import * as record from 'N/record'
import * as UI from "N/ui/serverWidget"
import { constates as CTS } from '../module/jtc_import_ids'
import * as file from "N/file"
import * as redirect from 'N/redirect'
import * as search from 'N/search'


export const onRequest = (ctx: EntryPoints.Suitelet.onRequestContext) => {
    try {

        const form = UI.createForm({title: CTS.FORM.TITLE })

        if (ctx.request.method == "GET") {
            getForm(ctx, form)
        } else {
            postForm(ctx, form)
        }


        
    } catch (error) {
        log.error('jtc_load_file_csv_st_mst.onRequst', error)
    }
}


const getForm = (ctx: EntryPoints.Suitelet.onRequestContext, form:  UI.Form) => {
    try {
        
        const file = form.addField({
            id: CTS.FORM.FIELDS.CSV_FIELD.ID,
            label: CTS.FORM.FIELDS.CSV_FIELD.LABEL,
            type: UI.FieldType.FILE
        })

        const subsidary = form.addField({
            id: CTS.FORM.FIELDS.SUBSIDIARY.ID,
            label: CTS.FORM.FIELDS.SUBSIDIARY.LABEL,
            type: UI.FieldType.SELECT,
            source: String(record.Type.SUBSIDIARY)
        })
        const conta = form.addField({
            id: CTS.FORM.FIELDS.ACCOUNT.ID,
            label: CTS.FORM.FIELDS.ACCOUNT.LABEL,
            type: UI.FieldType.SELECT,
            source: String(record.Type.ACCOUNT)
        })
        const localidade = form.addField({
            id: CTS.FORM.FIELDS.LOCALIDADE.ID,
            label: CTS.FORM.FIELDS.LOCALIDADE.LABEL,
            type: UI.FieldType.SELECT,
            source: String(record.Type.LOCATION)
        })


        form.addSubmitButton({label: "Importar CSV"})

        ctx.response.writePage(form)

    } catch (error) {
        
    }
}


const postForm = (ctx: EntryPoints.Suitelet.onRequestContext, form:  UI.Form) => {
    try {
        const file_form = ctx.request.files.custpage_csv_file

        const body = ctx.request.parameters
        const subsidary = body.custpage_sub
        const localidade = body.custpage_localidade
        const account = body.custpage_account

        file_form.folder = 974
        const idFile = file_form.save()
        log.debug("fileID", idFile )
        
        const fileCsv = file.load({id: idFile})

        const content = fileCsv.getContents()
        const values  = formatCSVToNetsuite(content)

        const recAdInventory = record.create({
            type: record.Type.INVENTORY_ADJUSTMENT,
            isDynamic: true
        })


        
        recAdInventory.setValue({fieldId: CTS.ADJ_INVENTORY.SUBSIDIARY, value: subsidary})
        recAdInventory.setValue({fieldId: CTS.ADJ_INVENTORY.LOCALIDADE, value: localidade})
        recAdInventory.setValue({fieldId: CTS.ADJ_INVENTORY.CONTA, value: account})
        
        const sublistId = CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID

        if (values.length > 0) {
            
            for (var i=0; i < values.length; i++) {
                const value = values[i].split(";")

                recAdInventory.selectNewLine({sublistId: sublistId})

                recAdInventory.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ITEM,
                    sublistId: sublistId,
                    value: Number(value[0])
                })
                recAdInventory.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.QTDE_ADJ,
                    sublistId: sublistId,
                    value: value[1]
                })
                recAdInventory.setCurrentSublistValue({
                    fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.LOCALIDADE,
                    sublistId: sublistId,
                    value: String(value[4]).split(" ")[0]
                })
                
                const inventorydetail = recAdInventory.getCurrentSublistSubrecord({
                    fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.ID,
                    sublistId: sublistId
                })

                const inv = inventorydetail.selectNewLine({
                    sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID
                })
                log.debug('inv', inv)

                

                if(value[1] >= 0 ) {
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
                            ["location", search.Operator.ANYOF, "2"]
                            
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
                // const date = String(value[5]).split("/")
                // inventorydetail.setCurrentSublistValue({
                //     fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.DATA_VALIDADE,
                //     sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
                //     value: new Date(`${date[1]}/${date[0]}/${}`)
                // })
                const line = inventorydetail.commitLine({sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID})

                log.debug('line', line)

                const idInv = recAdInventory.commitLine({sublistId: sublistId})

                log.audit("idInv", idInv)
                
            }

            const idInvRec = recAdInventory.save()
            log.audit('idInvRec',idInvRec)
            
            redirect.toRecord({
                type: record.Type.INVENTORY_ADJUSTMENT,
                id: idInvRec
            })
        }
                

        

        ctx.response.write(content)



    } catch (error) {
        log.error("jtc_load_file_csv_st_MSR.postForm", error)
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