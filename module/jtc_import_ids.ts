/**
 * @NAPIVersion 2.x
 * @NModuleScope public
 */



export const constates = {
    FORM: {
        TITLE: 'Importação de Ajuste de Estoque',
        FIELDS: {
            CSV_FIELD: {
                ID: 'custpage_csv_file',
                LABEL: 'Arquivo'
            },
            SUBSIDIARY : {
                ID: "custpage_sub",
                LABEL: 'Subsidiária'
            },
            ACCOUNT: {
                ID: 'custpage_account',
                LABEL: 'Conta'
            },
            LOCALIDADE: {
                ID: 'custpage_localidade',
                LABEL: 'Localidade'
            }
        }
    },
    
    ADJ_INVENTORY: {
        CONTA:'account',
        SUBSIDIARY: 'subsidiary',
        LOCALIDADE: 'adjlocation',
        SUBLIST_INVENTORY: {
            ID:'inventory',
            ITEM: 'item',
            PRECO_UNIT: 'unitcost',
            QTDE_ADJ: 'adjustqtyby',
            LOCALIDADE:"location"
        },
        SUBRECORD_INVENTORY_DETAIL: {
            ID: 'inventorydetail',
            SUBLIST_INV_DETAIL: {
                ID: 'inventoryassignment',
                NUM_SERIAL: 'receiptinventorynumber',
                NEGATIVE_SET_SERIAL: 'issueinventorynumber',
                QUATITY: 'quantity',
                DATA_VALIDADE: 'expirationdate'
            }
        }
    },

    SCRIPT_MAP_REDUCE: {
        ID: 1514,
        ID_REC_AJUSTE: 'custscript_jtc_ajuste_estoque_id',
        ID_FILE_CSV: 'custscript_jtc_id_file_csv'
    }
}