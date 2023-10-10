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
import * as task from "N/task"


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

        file_form.folder = 4275
        const idFile = file_form.save()
        log.debug("fileID", idFile )
        
        const fileCsv = file.load({id: idFile})

        const content = fileCsv.getContents()

        const recAdInventory = record.create({
            type: record.Type.INVENTORY_ADJUSTMENT,
            isDynamic: true
        })

        
        
        recAdInventory.setValue({fieldId: CTS.ADJ_INVENTORY.SUBSIDIARY, value: subsidary})
        recAdInventory.setValue({fieldId: CTS.ADJ_INVENTORY.LOCALIDADE, value: localidade})
        recAdInventory.setValue({fieldId: CTS.ADJ_INVENTORY.CONTA, value: account})
        
        recAdInventory.selectNewLine({sublistId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID})

        recAdInventory.setCurrentSublistValue({
            sublistId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID,
            fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ITEM,
            value: 442
        })
        recAdInventory.setCurrentSublistValue({
            sublistId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID,
            fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.QTDE_ADJ,
            value: 1
        })
        recAdInventory.setCurrentSublistValue({
            sublistId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID,
            fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.LOCALIDADE,
            value: localidade
        })
        recAdInventory.setCurrentSublistValue({
            sublistId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID,
            fieldId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.PRECO_UNIT,
            value: 1.02
        })
        const inventorydetail = recAdInventory.getCurrentSublistSubrecord({
            fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.ID,
            sublistId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID
        })
        const inv = inventorydetail.selectNewLine({
            sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID
        })
        inventorydetail.setCurrentSublistValue({
            fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.NUM_SERIAL,
            sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
            value: 'teste'          
        })
        inventorydetail.setCurrentSublistValue({
            fieldId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.QUATITY,
            sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID,
            value: 1           
        })
        inventorydetail.commitLine({sublistId: CTS.ADJ_INVENTORY.SUBRECORD_INVENTORY_DETAIL.SUBLIST_INV_DETAIL.ID})
        recAdInventory.commitLine({sublistId: CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID})


        const sublistId = CTS.ADJ_INVENTORY.SUBLIST_INVENTORY.ID

        const idInvRec = recAdInventory.save({ignoreMandatoryFields: true})

        // if (values.length > 0) {
            
        log.audit('idInvRec',idInvRec)

        const mapReduceTask = task.create({
            taskType: task.TaskType.MAP_REDUCE,
            scriptId: 1511,
            params: {
                custscript_jtc_ajuste_estoque_id: idInvRec ,
                custscript_jtc_id_file_csv: idFile
            }
          
        });
        const idTask = mapReduceTask.submit();
        
        
        redirect.toRecord({
            type: record.Type.INVENTORY_ADJUSTMENT,
            id: idInvRec
        })
        // }
                

        

        ctx.response.write(content)



    } catch (error) {
        log.error("jtc_load_file_csv_st_MSR.postForm", error)
    }
}





