sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/mvc/Controller",
    'sap/m/MessagePopover',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Element',
], function (MessageToast, MessageBox, Fragment, Controller, JSONModel, Element) {
    'use strict';

    return {
        reviewFormReservation: null,
        busyDialog: null,

        onInit: function () {},

        openBusyDialog: function () {
            if (!this.busyDialog) {
                Fragment.load({id: "busyFragment", name: "zmb21lsx.ext.fragment.busy", type: "XML", controller: this}).then((oDialog) => {
                    this.busyDialog = oDialog;
                    this.busyDialog.open()
                }).catch(error => {
                    MessageBox.error('Vui lòng tải lại trang')
                });
            } else {
                this.busyDialog.open()
            }
        },


        btnCreate: function (oEvent) { // MODEL - VIEW - CONTROLLER
            let oSelectedContext = this.extensionAPI.getSelectedContexts()
            let selectItem = []

            oSelectedContext.forEach(element => {
                selectItem.push(this.readDocumentData(element))
            });

            this.openBusyDialog()
            Promise.all(selectItem).then((value) => {
                var oModel = new sap.ui.model.json.JSONModel();
                let header = {
                    ReceivingSloc: '',
                    MovementType: '311',
                    CostCenter: '',
                    BaseDate: '',
                    Asset: '',
                    GLAccount: '',
                    RequistionDepartment: '',
                    Person: '',
                    Note: ''
                }
                oModel.setData({header: header, items: value});

                if (!this.reviewFormReservation) {
                    Fragment.load({id: 'reviewReservation', name: "zmb21lsx.ext.fragment.formReservation", type: "XML", controller: this}).then((oDialog) => {
                        this.reviewFormReservation = oDialog
                        this.reviewFormReservation.setModel(oModel, "selectedItem")
                        this.reviewFormReservation.open()
                        this.busyDialog.close()
                    }).catch(error => {
                        MessageToast.show('Vui lòng tải lại trang')
                        this.busyDialog.close()
                        console.log("error", error)
                    })

                } else {
                    this.reviewFormReservation.setModel(oModel, "selectedItem")
                    this.reviewFormReservation.open()
                    this.busyDialog.close()
                }
            })

        },

        readDocumentData: function (element) {
            return new Promise((resolve, reject) => {
                let oModel = element.getModel()
                oModel.read(element.getPath(), {
                    success: function (oData, oResponse) {
                        let data = {
                            Plant: oData.Plant,
                            Order: oData.OrderLSX,
                            Item: oData.Item,
                            Component: oData.Component,
                            ComponentDescription: oData.ComponentDes,
                            RequirementQuantity: oData.RequirementQuantity,
                            BaseUnit: oData.BaseUnit,
                            IssueSloc: oData.IssueSloc,
                            RequestQuantity: oData.RequestQuantity,
                            UUStock: oData.UUStock,
                            QIStock: oData.QIStock,
                            AvailableUUStock: oData.AvailableUUStock,
                            MaterialGoup: oData.MaterialGoup,
                            MaterialType: oData.MaterialType,
                            LongText: oData.LongText
                        }
                        resolve(data)
                    },
                    error: function (error) {
                        reject(error)
                    }
                })
            })
        },

        _onPostReservation: function (oEvent) {
            let isRequire = false
            let messageRequire
            let oModel = oEvent.getSource()
            let dataRequest = this.reviewFormReservation.getModel("selectedItem").getJSON()
            console.log("dataRequest", dataRequest)
            console.log("getModel", this.reviewFormReservation.getModel("selectedItem"))
            let dataJSON = JSON.parse(dataRequest)
            // console.log("oModel", oModel)

            if (! dataJSON.header.MovementType) {
                isRequire = true
                messageRequire = 'Vui lòng điền Movement Type'
            } else if (! dataJSON.header.ReceivingSloc) {
                isRequire = true
                messageRequire = 'Vui lòng điền Receiving Sloc'
            } else if (! dataJSON.header.CostCenter) {
                isRequire = true
                messageRequire = 'Vui lòng điền Cost Center'
            } else if (! dataJSON.header.BaseDate) {
                isRequire = true
                messageRequire = 'Vui lòng điền Base Date'
            }


            if (isRequire == false) {
                var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/ZMM_API_CREATE_RESERVATION_LSX?=";
                $.ajax({
                    url: url_render,
                    type: "POST",
                    contentType: "application/json",
                    data: dataRequest,
                    success: function (response, textStatus, jqXHR) {
                        console.log("res", response)
                        let dataResponse = JSON.parse(response)
                        // if (dataResponse.pdf) {
                        // var decodedPdfContent = atob(dataResponse.pdf)//base65 to string ?? to pdf
                        // var byteArray = new Uint8Array(decodedPdfContent.length);
                        // for (var i = 0; i < decodedPdfContent.length; i++) {
                        // byteArray[i] = decodedPdfContent.charCodeAt(i);
                        // }
                        // var blob = new Blob([byteArray.buffer], {
                        // type: 'application/pdf'
                        // });
                        // var _pdfurl = URL.createObjectURL(blob);
                        // if (!this._PDFViewer) {
                        // this._PDFViewer = new sap.m.PDFViewer({
                        // width: "auto",
                        // source: _pdfurl,
                        // });
                        // jQuery.sap.addUrlWhitelist("blob");
                        // }
                        // this._PDFViewer.downloadPDF();
                        // }
                        // thatController.busyDialog.close();
                        // thatController.reviewDialog.close();
                        // thatController.getView().getModel().refresh();
                    },
                    error: function (error) { // this.busyDialog.close();
                        console.log("error", JSON.stringify(error))
                        console.log("error", error)
                    }
                });
            } else {
                MessageBox.error(messageRequire)
            }
        },

        onChangeLongText: function (oEvent) {
            // console.log("value", oEvent.getSource().getValue())
            // // console.log(oEvent.getSource().getParent().getMetadata().getElementName())
            // console.log("Index", oEvent.getSource().getParent().getIndex())
            // console.log(oEvent)
            // console.log(this.reviewFormReservation.getModel("selectedItem").oData.items)

            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            let itemChange = arrItem[oEvent.getSource().getParent().getIndex()]

            arrItem.forEach(item => {
                if ((item.Order === itemChange.Order) && (item.IssueSloc === itemChange.IssueSloc)) { // "&& (item.IssueSloc === itemChange.IssueSloc) && (item.Component === itemChange.Component) ) {
                    item.LongText = itemChange.LongText
                }
            })

            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({header: this.reviewFormReservation.getModel("selectedItem").oData.header, items: arrItem});
            this.reviewFormReservation.setModel(oModel, "selectedItem")

        },

        onChangeIssueSloc: function (oEvent) { // Dòng item change issue sloc\
            let that = this
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            let index = oEvent.getSource().getParent().getIndex()
			let issueSloc  = oEvent.getSource().getValue()
			let model = this.getView().getModel()
			let path = `/ZMM_I_SUM_MATERIAL_STOCK1(Plant='${arrItem[index].Plant}',Material='${arrItem[index].Component}',StorageLocation='${issueSloc}')`
			model.read(path, {
				success: function(oData, oResopnse){
                    arrItem[index].UUStock = oData.UUStock
                    arrItem[index].QIStock = oData.QIStock
                    // update Model For Fragment reviewFormReservation
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData({header: header, items: arrItem});
                    that.reviewFormReservation.setModel(oModel, "selectedItem")
				},
				error: function(error){

				}
			 })
/*             var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/ZMM_HTTP_ISSUESLOC?=";
            $.ajax({
                url: url_render,
                type: "POST",
                contentType: "application/json",
                data: datareq,
                success: function (response, textStatus, jqXHR) {
                    let dataResponse = JSON.parse(response)
                    arrItem[index].UUStock = dataResponse.uustock
                    arrItem[index].QIStock = dataResponse.qistock

                    // update Model For Fragment reviewFormReservation
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData({header: header, items: arrItem});
                    that.reviewFormReservation.setModel(oModel, "selectedItem")
                },
                error: function (error) { // this.busyDialog.close();
                    console.log("error", JSON.stringify(error))
                    console.log("error", error)
                }
            }); */
        },

        _closeDialog: function () {
            this.reviewFormReservation.close();
        }

    };
});
