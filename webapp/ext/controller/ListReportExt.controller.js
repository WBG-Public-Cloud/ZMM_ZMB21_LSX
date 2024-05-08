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
], function (MessageToast, MessageBox, Fragment, Controller, JSONModel, Element, SearchField, Filter, UIColumn, MColumn, Label, Text, FilterOperator) {
    'use strict';

    return {
        reviewFormReservation: null,
        busyDialog: null,

        onInit: function () { },

        //-----------T0------------------- Fragment Busy Dialog ------------------------------------------
        openBusyDialog: function () {
            if (!this.busyDialog) {
                Fragment.load({ id: "busyFragment", name: "zmb21lsx.ext.fragment.busy", type: "XML", controller: this }).then((oDialog) => {
                    this.busyDialog = oDialog;
                    this.busyDialog.open()
                }).catch(error => {
                    MessageBox.error('Vui lòng tải lại trang')
                });
            } else {
                this.busyDialog.open()
            }
        },

        //-------------T0----------------- Button Create Reservation In Main Screen ------------------------------------------
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
                oModel.setData({ header: header, items: value });

                if (!this.reviewFormReservation) {
                    Fragment.load({ id: 'reviewReservation', name: "zmb21lsx.ext.fragment.formReservation", type: "XML", controller: this }).then((oDialog) => {
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
                            MaterialGroup: oData.MaterialGroup,
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

        //--------------T1---------------- Button Create Reservation In Fragment Create Reservation Details ------------------------------------------
        _onPostReservation: function (oEvent) {
            let that = this
            let isRequire = false
            let messageRequire
            let oModel = oEvent.getSource()
            // let dataRequest = this.reviewFormReservation.getModel("selectedItem").getJSON()
            let dataRequest = this.reviewFormReservation.getModel("selectedItem").getData()
            if (!dataRequest.header.MovementType) {
                isRequire = true
                messageRequire = 'Vui lòng điền Movement Type'
            } else if (!dataRequest.header.ReceivingSloc) {
                isRequire = true
                messageRequire = 'Vui lòng điền Receiving Sloc'
                // } else if (! dataJSON.header.CostCenter) {
                //     isRequire = true
                //     messageRequire = 'Vui lòng điền Cost Center'
            } else if (!dataRequest.header.BaseDate) {
                isRequire = true
                messageRequire = 'Vui lòng điền Base Date'
            }

            //BaseDate
            // let ArrayBaseDate = dataJSON.header.BaseDate.split("/")
            if (typeof dataRequest.header.BaseDate == 'string') {
                dataRequest.header.BaseDate = dataRequest.header.BaseDate
            } else {
                dataRequest.header.BaseDate = (dataRequest.header.BaseDate.getFullYear()) + ("0" + (dataRequest.header.BaseDate.getMonth() + 1)).slice(-2) + ("0" + dataRequest.header.BaseDate.getDate()).slice(-2)
            }
            let dataJSON = JSON.stringify(dataRequest)

            if (isRequire == false) {
                var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/ZMM_API_CREATE_RESERVATION_LSX?=";
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

        ///------------T2---------- Change Long Text -----------------------------------
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
            oModel.setData({ header: this.reviewFormReservation.getModel("selectedItem").oData.header, items: arrItem });
            this.reviewFormReservation.setModel(oModel, "selectedItem")

        },

       ///------------T2---------- Change Storage Location -----------------------------------
        onChangeIssueSloc: function (oEvent) { // Dòng item change issue sloc\
            let that = this
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            let index = oEvent.getSource().getParent().getIndex()
            let issueSloc = oEvent.getSource().getValue()
            let model = this.getView().getModel()
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
        onChangeReceivingSloc: function() {
            let that = this
            let dataRequest = this.reviewFormReservation.getModel("selectedItem").getData()
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items

            let dataJSON = JSON.stringify(dataRequest) 

           var url_render = "https://" + window.location.hostname + "/sap/bc/http/sap/ZMM_HTTP_RECEIVINGSLOC?=";
            $.ajax({
                url: url_render,
                type: "POST",
                contentType: "application/json",
                data: dataJSON,
                success: function (response, textStatus, jqXHR) {
                    let dataResponse = JSON.parse(response)
                    console.log(dataResponse)
                    
                    if (dataResponse.status == 'Success') {
                        // header = dataResponse.header
                        // arrItem = dataResponse.items
                        console.log("header", header)
                        console.log("arrItem", arrItem)

                        console.log("dataResponse.header", dataResponse.header)
                        console.log("dataResponse.items",  dataResponse.items)
                    }
                    // update Model For Fragment reviewFormReservation
                    var oModel = new sap.ui.model.json.JSONModel();
                    oModel.setData({ header: header, items: arrItem });
                    that.reviewFormReservation.setData(oModel, "selectedItem")
                },
                error: function (error) { // this.busyDialog.close();
                    console.log("error", JSON.stringify(error))
                    console.log("error", error)
                }
            }); 
        },

        ///---------T2------------- Search Help Sloc -----------------------------------
        onReceivingSlocValueHelp: function (oEvent) {
            let that = this

            let vhProperty = {
                entity: "I_StorageLocationStdVH",
                fragmentName: 'slocSearchHelp',
                elements: [
                    { element: "Plant", elementName: "Plant" },
                    { element: "StorageLocation", elementName: "StorageLocation" },
                    { element: "StorageLocationName", elementName: "StorageLocation Name" }
                ]
            }

            // this._currentNodeVH = oEvent.getSource().getParent().getParent().getRowBindingContext().getObject()
            this._oBasicSearchField = new SearchField();

            this.loadFragment({
                name: `zmb21lsx.ext.fragment.${vhProperty.fragmentName}`,
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar()
                this._oVHD = oDialog

                this.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);
                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
                    // aFilters.push( new Filter("Language", "EQ",'EN') )
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    oTable.setModel(that.getView().getModel())
                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: `/${vhProperty.entity}`,
                            filters: aFilters,
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        vhProperty.elements.forEach(value => {
                            let uiCol = new UIColumn({
                                label: new Label({ text: value.elementName }),
                                template: new Text({ wrapping: false, text: `{${value.element}}` })
                            })
                            // uiCol.data({
                            //     fieldName: value.element
                            // })
                            oTable.addColumn(uiCol)
                        })
                    }
                    oDialog.update();
                }.bind(this));
                oDialog.open();
            }.bind(this));
        },

        _filterTableStorageLocation: function (oFilter) {
            var oVHD = this._oVHD;

            oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oVHD.update();
            });
        },

        onFilterBarSearchStorageLocation: function (oEvent) {
            var aSelectionSet = oEvent.getParameter("selectionSet");
            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }
                return aResult;
            }, []);

            this._filterTableStorageLocation(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPressStorageLocation: function (oEvent) {
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            var aTokens = oEvent.getParameter("tokens");
            aTokens.forEach(token => {
                header.ReceivingSloc = token.getKey()
            })
            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            this._oVHD.close()
            this.reviewFormReservation.setModel(oModel, "selectedItem")
        },

        onValueHelpCancelPressStorageLocation: function () {
            this._oVHD.close();
        },
        onValueHelpAfterCloseStorageLocation: function () {
            this._oVHD.destroy();
        },

        onValueMMMMMMM: function () {
            this._oVHD.destroy();
        },
        ///---------------------- Search Help Sloc -----------------------------------


        ///-------T2--------------- Search Help Movement Type -----------------------------------
        onMovementTypeValueHelp: function () {
            let that = this

            let vhProperty = {
                entity: "I_GoodsMovementTypeT",
                fragmentName: 'movementSearchHelp',
                elements: [
                    { element: "GoodsMovementType", elementName: "Movement Type" },
                    { element: "Language", elementName: "Language" },
                    { element: "GoodsMovementTypeName", elementName: "Movement Type Description" }
                ]
            }

            this._oBasicSearchField = new SearchField();

            this.loadFragment({
                name: `zmb21lsx.ext.fragment.${vhProperty.fragmentName}`,
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar()
                this._oVHDMovementType = oDialog

                this.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);
                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
                    aFilters.push( new Filter("Language", "EQ",'EN') )
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    oTable.setModel(that.getView().getModel())
                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: `/${vhProperty.entity}`,
                            filters: aFilters,
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        vhProperty.elements.forEach(value => {
                            let uiCol = new UIColumn({
                                label: new Label({ text: value.elementName }),
                                template: new Text({ wrapping: false, text: `{${value.element}}` })
                            })
                            // uiCol.data({
                            //     fieldName: value.element
                            // })
                            oTable.addColumn(uiCol)
                        })
                    }
                    oDialog.update();
                }.bind(this));
                oDialog.open();
            }.bind(this));

        },

        _filterTableMovementType: function (oFilter) {
            var oVHDMovementType = this._oVHDMovementType;
            if (!oFilter.aFilters || oFilter.aFilters.length == 0) {
                oFilter 
             } else {
            }

            this._oVHDMovementType.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                     oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                     oTable.getBinding("items").filter(oFilter);
                }

                oVHDMovementType.update();
            });
        },

        onFilterBarSearchMovementType: function (oEvent) {
            var aSelectionSet = oEvent.getParameter("selectionSet");
            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }
                return aResult;
            }, []);

            this._filterTableMovementType(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPressMovementType: function (oEvent) {
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            var aTokens = oEvent.getParameter("tokens");
            aTokens.forEach(token => {
                header.ReceivingSloc = token.getKey()
            })
            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            this._oVHDMovementType.close()
            this.reviewFormReservation.setModel(oModel, "selectedItem")
        },

        onValueHelpCancelPressMovementType: function () {
            this._oVHDMovementType.close();
        },
        onValueHelpAfterCloseMovementType: function () {
            this._oVHDMovementType.destroy();
        },
        ///---------------------- Search Help Movement Type -----------------------------------


        _closeDialog: function () {
            this.reviewFormReservation.close();
            this.busyDialog.close()
        }

    };
});
