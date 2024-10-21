sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageItem',
    'sap/m/MessageView',
    'sap/m/Dialog',
    'sap/m/Button',
    'sap/m/Bar',
    'sap/m/Title',
    'sap/ui/core/IconPool',
    'sap/ui/core/library',
], function (MessageToast, MessageBox, Fragment, Controller, JSONModel, MessageItem, MessageView, Dialog, Button, Bar, Title, IconPool, coreLibrary) {
    'use strict';
    var TitleLevel = coreLibrary.TitleLevel;
    return {
        _onPostReservation: async function (oEvent, that, hostname) {
            let thatPostReservation = this
            let lstMessage = []

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
            const map = new Map()

            dataRequest.items.forEach(e => {

                if (e.IssueSloc.localeCompare(dataRequest.header.ReceivingSloc, undefined, { sensitivity: 'base' }) === 0) {
                    isRequire = true
                    messageRequire = `Row ${e.No} has the Issue Sloc field matching the Receiving Sloc field,`
                }
                if (e.RequestQuantity <= 0) {
                    isRequire = true
                    messageRequire = `Row ${e.No} has request quantity <= 0`
                }
                if (e.IssueSloc == '') {
                    isRequire = true
                    messageRequire = `Row ${e.No} Issue Sloc is not empty`
                }

                // if (e.countReser <= 0 && (Math.round(parseFloat(e.RequestQuantity)) !== Math.round(parseFloat(e.RequirementQuantity)))) {
                //     isRequire = true
                //     messageRequire = `Row ${e.No} has not created a reservation yet, so Requestquantity must be equal to RequirementQuantity `
                // }

                const key = e.Component;
                const quantity = e.RequestQuantity == '' ? 0 : parseFloat(e.RequestQuantity);
              
                if (map.has(key)) {
                  map.set(key, map.get(key) + quantity);
                } else {
                  map.set(key, quantity);
                }
                
                let sumRequestQuantity =  map.get(e.Component)

                let QuantityMaSloc      = e.QuantityMaSloc == '' ? 0 : parseFloat(e.QuantityMaSloc)
                let RequestQuantity     = sumRequestQuantity
                let RequirementQuantity = e.RequirementQuantity == '' ? 0 : parseFloat(e.RequirementQuantity)

                if ( RequestQuantity + QuantityMaSloc > RequirementQuantity ){
                    lstMessage.push({
                        type: 'Warning',
                        title: `${e.Component}`,
                        subtitle: `Số lượng đã vượt quá Requirement, có đồng ý tiếp tục không`,
                        counter: 1
                    })
                }

            })

            //TH có lỗi Quantity
            let Message 
            if (lstMessage.length > 0) {
                Message = await thatPostReservation.showMessage(lstMessage)
            }


            //Nếu chọn Button Close thì ngừng Post ngược lại thì vẫn tiếp tục
            if (Message == 'close') {
                that.busyDialog.close()
                return
            }

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

        showMessage: function (lstMessage) {
            return new Promise((resolve, reject) => {
                var oMessageTemplate = new MessageItem({
                    type: '{type}',
                    title: '{title}',
                    subtitle: '{subtitle}',
                    counter: '{counter}'
                });
                var oModel = new JSONModel();
                this.oMessageView = new MessageView({
                    showDetailsPageHeader: false,
                    itemSelect: function () {
                        oBackButton.setVisible(true);
                    },
                    items: {
                        path: "/",
                        template: oMessageTemplate
                    }
                });

                var oBackButton = new Button({
                    icon: IconPool.getIconURI("nav-back"),
                    visible: false,
                    press: function () {
                        this.oMessageView.navigateBack();
                        this.setVisible(false);
                    }
                });
                oModel.setData(lstMessage);
                this.oMessageView.setModel(oModel);
                this.oDialog = new Dialog({
                    resizable: true,
                    content: this.oMessageView,
                    state: 'Information',
                    beginButton: new Button({
                        press: function () {
                            this.getParent().close();
                            resolve("ok")
                        },
                        text: "Ok"
                    }),
                    endButton: new Button({
                        press: function () {
                            this.getParent().close();
                            resolve("close")
                        },
                        text: "Close"
                    }),
                    customHeader: new Bar({
                        contentLeft: [oBackButton],
                        contentMiddle: [
                            new Title({
                                text: "Infomation",
                                level: TitleLevel.H1
                            })
                        ]
                    }),
                    contentHeight: "50%",
                    contentWidth: "50%",
                    verticalScrolling: false
                });

                this.oMessageView.navigateBack();
                this.oDialog.open();
            })
        }
    }
})