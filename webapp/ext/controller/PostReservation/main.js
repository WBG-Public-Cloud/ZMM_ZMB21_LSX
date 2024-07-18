sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Element',
    'sap/m/SearchField',
    'sap/ui/model/Filter',
    'sap/ui/table/Column',
    'sap/m/Column',
    'sap/m/Label',
    'sap/m/Text',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Sorter'
], function (MessageToast, MessageBox, Fragment, Controller, JSONModel, Element, SearchField, Filter, UIColumn, MColumn, Label, Text, FilterOperato, Sorter) {
    'use strict';

    return {
        _onPostReservation: function (oEvent, that, hostname) {
            // let that = that
            let isRequire = false
            let messageRequire
            // let oModel = oEvent.getSource()
            // let dataRequest = that.reviewFormReservation.getModel("selectedItem").getData()

            let header = that.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = that.reviewFormReservation.getModel("selectedItem").oData.items
            let arrItemRemove = Fragment.byId("reviewReservation", "tableItem").getSelectedIndices()

            // Tạo một tập hợp (Set) các index được tick
            let indexesSet = new Set(arrItemRemove);
            // Sử dụng filter để tạo ra mảng mới
            let newArray = arrItem.filter((_, i) => indexesSet.has(i));
            if (newArray.length == 0) {
                isRequire = true
                messageRequire = `Please select at least one row in the table.`
            }
            let dataRequest = {
                header: header,
                items: newArray,
            }

            //Check Matching Sloc
            dataRequest.items.forEach(e => {

                if (e.IssueSloc.localeCompare(dataRequest.header.ReceivingSloc, undefined, { sensitivity: 'base' }) === 0) {
                    isRequire = true
                    messageRequire = `Row ${e.No} has the Issue Sloc field matching the Receiving Sloc field,`
                }
                if (e.RequestQuantity == 0) {
                    isRequire = true
                    messageRequire = `Row ${e.No} has request quantity = 0`
                }
                if (e.IssueSloc == '') {
                    isRequire = true
                    messageRequire = `Row ${e.No} Issue Sloc is not empty`
                }


            })

            // check Require Header
            if (!dataRequest.header.MovementType) {
                isRequire = true
                messageRequire = 'Movement Type is required'
            } else if (!dataRequest.header.ReceivingSloc) {
                isRequire = true
                messageRequire = 'Receiving Sloc is required'
            } else if (!dataRequest.header.BaseDate) {
                isRequire = true
                messageRequire = 'Base Date is required'
            }

            //BaseDate
            // let ArrayBaseDate = dataJSON.header.BaseDate.split("/")
            if (dataRequest.header.BaseDate) {
                if (typeof dataRequest.header.BaseDate == 'string') {
                    dataRequest.header.BaseDate = dataRequest.header.BaseDate
                } else {
                    dataRequest.header.BaseDate = (dataRequest.header.BaseDate.getFullYear()) + ("0" + (dataRequest.header.BaseDate.getMonth() + 1)).slice(-2) + ("0" + dataRequest.header.BaseDate.getDate()).slice(-2)
                }
            }

            // dataRequest.forEach((element, index) => {  
            //     dataRequest[index] = element + 10;  
            // });

            let dataJSON = JSON.stringify(dataRequest)

            if (isRequire == false) {
                var url_render = "https://" + hostname + "/sap/bc/http/sap/ZMM_API_CREATE_RESERVATION_LSX?=";
                $.ajax({
                    url: url_render,
                    type: "POST",
                    contentType: "application/json",
                    data: dataJSON,
                    success: function (response, textStatus, jqXHR) {
                        let dataResponse = JSON.parse(response)
                        let message = ''
                        if (dataResponse.status == 'Success') {
                            dataResponse.result.forEach(element => {
                                message = element.message + ' '
                            })
                            MessageBox.success(message)
                        } else if (dataResponse.status == 'Warning') {
                            dataResponse.result.forEach(element => {
                                message = element.message + ' '
                            })
                            MessageBox.warning(message)
                        } else {
                            dataResponse.result.forEach(element => {
                                message = element.message + ' '
                            })
                            MessageBox.error(message)
                        }
                        that.busyDialog.close()
                    },
                    error: function (error) { // that.busyDialog.close();
                        console.log("error", JSON.stringify(error))
                        console.log("error", error)
                        that.busyDialog.close()
                    }
                });
            } else {
                MessageBox.error(messageRequire)
                that.busyDialog.close()
            }
        },
    }
})