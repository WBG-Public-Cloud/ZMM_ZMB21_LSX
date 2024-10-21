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
        ///------------T2---------- Change Long Text -----------------------------------
        onChangeNote: function (that, sText) {
            //Handling String HTML 
            //function getInnerTextFromHTMLString(htmlString) {
            //    var parser = new DOMParser();
            //    var doc = parser.parseFromString(htmlString, 'text/html');
            //    return doc.body.textContent || "";
            //  }

            // Ví dụ sử dụng
            //  var innerText = getInnerTextFromHTMLString(sText);


            // let that = this
            //let header = that.reviewFormReservation.getModel("selectedItem").oData.header
            //let arrItem = that.reviewFormReservation.getModel("selectedItem").oData.items
            // let index = localStorage.getItem("itemLongText")
            // arrItem[index].LongText = sText
            //header.Note = innerText

            // update Model For Fragment reviewFormReservation
            //var oModel = new sap.ui.model.json.JSONModel();
            //oModel.setData({ header: header, items: arrItem });
            //that.reviewFormReservation.setModel(oModel, "selectedItem")

            //that.TextEditorDialog.close()
        },

        ///------------T2---------- Change Storage Location -----------------------------------
        onChangeIssueSloc: function (index, issueSloc, that) { // Dòng item change issue sloc\
            // let that = this
            let header = that.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = that.reviewFormReservation.getModel("selectedItem").oData.items
            // let index = oEvent.getSource().getParent().getIndex()
            // let issueSloc = oEvent.getSource().getValue()
            let model = that.getView().getModel()  ///MCV
            let path = `/ZMM_I_SUM_MATERIAL_STOCK1(Plant='${arrItem[index].Plant}',Material='${arrItem[index].Component}',StorageLocation='${issueSloc}')`

            that.openBusyDialog()
            model.read(path, {
                success: function (oData, oResopnse) {
                    arrItem[index].UUStock = oData.UUStock
                    arrItem[index].QIStock = oData.QIStock

                    // update Model For Fragment reviewFormReservation
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData({ header: header, items: arrItem });
                    that.reviewFormReservation.setModel(oModel, "selectedItem")

                    that.busyDialog.close()
                },
                error: function (error) {
                    arrItem[index].UUStock = '0'
                    arrItem[index].QIStock = '0'

                    // update Model For Fragment reviewFormReservation
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData({ header: header, items: arrItem });
                    that.reviewFormReservation.setModel(oModel, "selectedItem")

                    that.busyDialog.close()
                }
            })
        },

        ///------------T2---------- Change ReceivingSloc-----------------------------------
        onChangeReceivingSloc: function (that) {
            // let that = this
            let dataRequest = that.reviewFormReservation.getModel("selectedItem").getData()
            let header = that.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = that.reviewFormReservation.getModel("selectedItem").oData.items

            let dataJSON = JSON.stringify(dataRequest)

            var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/ZMM_HTTP_RECEIVINGSLOC?=";
            that.openBusyDialog()
            $.ajax({
                url: url_render,
                type: "POST",
                contentType: "application/json",
                data: dataJSON,
                success: function (response, textStatus, jqXHR) {
                    let dataResponse = JSON.parse(response)
                    // sử dụng map để read array
                    const map = new Map()

                    Object.keys(dataResponse.items).forEach(index => {
                        let key = `${dataResponse.items[index].Plant}-${dataResponse.items[index].Order}-${dataResponse.items[index].Item}`
                        // let key = `${dataResponse.items[index].Plant}-${dataResponse.items[index].Order}`
                        // let value = dataResponse.items[index].AvailableUUStock;
                        let value = {
                            AvailableUUStock: dataResponse.items[index].AvailableUUStock,
                            GAPReservationQty: dataResponse.items[index].GAPReservationQty,
                            OpenQuantity: dataResponse.items[index].OpenQuantity,
                            QuantityMaSloc: dataResponse.items[index].QuantityMaSloc,
                        }

                        map.set(key, value);
                    });

                    arrItem.forEach(element => {
                        let key = `${element.Plant}-${element.Order}-${element.Item} `
                        // let key = `${element.Plant}-${element.Order}`

                        let found = map.get(key)
                        element.AvailableUUStock = found.AvailableUUStock
                        element.GAPReservationQty = found.GAPReservationQty
                        if (element.countReser > 0) {
                            element.RequestQuantity = found.OpenQuantity
                        } else {
                            element.RequestQuantity = found.GAPReservationQty
                        }
                        element.OpenQuantity = found.OpenQuantity
                        element.QuantityMaSloc = found.QuantityMaSloc
                    })


                    if (dataResponse.status == 'Success') {
                        // update Model For Fragment reviewFormReservation
                        var oModel = new sap.ui.model.json.JSONModel();
                        oModel.setData({ header: header, items: arrItem });
                        // oModel.setData(dataResponse);
                        that.reviewFormReservation.setModel(oModel, "selectedItem")
                    }
                    that.busyDialog.close()
                },
                error: function (error) { // that.busyDialog.close();
                    console.log("error", JSON.stringify(error))
                    console.log("error", error)
                    that.busyDialog.close()
                }
            });
        },

        onChangeSH: function () {

        }

    }
})