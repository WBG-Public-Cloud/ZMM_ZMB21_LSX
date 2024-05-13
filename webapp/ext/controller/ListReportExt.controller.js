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
    'sap/ui/model/Sorter',
    './CostCenter/costCenter'

], function (MessageToast, MessageBox, Fragment, Controller, JSONModel, Element, SearchField, Filter, UIColumn, MColumn, Label, Text, FilterOperato, Sorter, CostCenter) {
    'use strict';

    return {
        reviewFormReservation: null,
        busyDialog: null,

        onInit: function () {

        },

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

            oSelectedContext.forEach((element, index) => {
                selectItem.push(this.readDocumentData(element, index))
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

        readDocumentData: function (element, index) {
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
                            LongText: oData.LongText,
                            OpenQuantity: oData.OpenQuantity,
                            GAPReservationQty: oData.GAPReservationQty,
                            RequirementDate: oData.RequirementDate,
                            No: index
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
            console.log(document.getElementById("reviewReservation--tableItem-table").querySelectorAll("tr[aria-selected='true']"))
            // console.log(document.getElementById("reviewReservation--tableItem-table").querySelectorAll("tr[aria-selected='true']"))

            console.log(Fragment.byId("reviewReservation", "tableItem"))
            console.log(Fragment.byId("reviewReservation", "tableItem").getSelectedIndex())
            console.log(Fragment.byId("reviewReservation", "tableItem").getSelectedIndices())
            console.log(Fragment.byId("reviewReservation", "tableItem").getSelectedIndices())
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
        onChangeReceivingSloc: function () {
            let that = this
            let dataRequest = this.reviewFormReservation.getModel("selectedItem").getData()
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items

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
                    console.log(dataResponse)
                    // sử dụng map để read array
                    const map = new Map()

                    Object.keys(dataResponse.items).forEach(index => {
                        let key = `${dataResponse.items[index].Plant}-${dataResponse.items[index].Order}-${dataResponse.items[index].Item}`
                        // let key = `${dataResponse.items[index].Plant}-${dataResponse.items[index].Order}`
                        // let value = dataResponse.items[index].AvailableUUStock;
                        let value = {
                            AvailableUUStock: dataResponse.items[index].AvailableUUStock,
                            GAPReservationQty: dataResponse.items[index].GAPReservationQty,
                        }

                        map.set(key, value);
                    });

                    arrItem.forEach(element => {
                        let key = `${element.Plant}-${element.Order}-${element.Item} `
                        // let key = `${element.Plant}-${element.Order}`

                        let found = map.get(key)
                        element.AvailableUUStock = found.AvailableUUStock
                        element.GAPReservationQty = found.GAPReservationQty
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
                error: function (error) { // this.busyDialog.close();
                    console.log("error", JSON.stringify(error))
                    console.log("error", error)
                    that.busyDialog.close()
                }
            });
        },

        ///---------T2------------- Search Help Sloc -----------------------------------
        onReceivingSlocValueHelp: function (oEvent) {

            let Plant = this.reviewFormReservation.getModel("selectedItem").oData.items[0].Plant

            let that = this

            let vhProperty = {
                entity: "I_StorageLocationStdVH",
                fragmentName: 'SearchHelp/slocSearchHelp',
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
                    aFilters.push( new Filter("Plant", "EQ",`${Plant}`) )
                    let aSort = new Sorter("Plant", true)
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    oTable.setModel(that.getView().getModel())

                    let FilterGroupItem = new sap.ui.comp.filterbar.FilterGroupItem()

                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: `/${vhProperty.entity}`,
                            filters: aFilters,
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            },
                            // sorter: aSort
                        });
                        vhProperty.elements.forEach(value => {
                            let uiCol = new UIColumn({
                                label: new Label({ text: value.elementName }),
                                template: new Text({
                                    wrapping: false,
                                    text: `{${value.element}}`
                                }),
                                // sorted: true,
                                // sortOrder: "Descending"
                            })
                            // uiCol.data({
                            //     fieldName: value.element
                            // })

                            oTable.addColumn(uiCol)
                        })
                    }
                    // oTable.getBindingInfo("AggregationBindingInfo").sorted('/Plant', true)
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
            this.onChangeReceivingSloc()
        },

        onValueHelpCancelPressStorageLocation: function () {
            this._oVHD.close();
        },
        onValueHelpAfterCloseStorageLocation: function () {
            this._oVHD.destroy();
        },

        ///---------------------- Search Help Sloc -----------------------------------


        ///-------T2--------------- Search Help Movement Type -----------------------------------
        onMovementTypeValueHelp: function () {
            let that = this

            let vhProperty = {
                entity: "I_GoodsMovementTypeT",
                fragmentName: 'SearchHelp/movementSearchHelp',
                elements: [
                    { element: "GoodsMovementType", elementName: "Movement Type" },
                    { element: "Language", elementName: "Language" },
                    { element: "GoodsMovementTypeName", elementName: "Movement Type Description" }
                ]
            }

            this._oBasicSearchField1 = new SearchField();

            this.loadFragment({
                name: `zmb21lsx.ext.fragment.${vhProperty.fragmentName}`,
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar()
                this._oVHDMovementType = oDialog

                this.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);
                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
                    aFilters.push(new Filter("Language", "EQ", 'EN'))
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
                oFilter = []
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
                header.MovementType = token.getKey()
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

        ///-------T2--------------- Search Help GL Account -----------------------------------
        onGLAccountValueHelp: function () {
            let that = this

            let vhProperty = {
                entity: "I_GLAcctInChtOfAcctsStdVH",
                fragmentName: 'SearchHelp/glaccountSearchHelp',
                elements: [
                    { element: "GLAccountExternal", elementName: "G/L Account External" },
                    { element: "GLAccount", elementName: "G/L Account" },
                    { element: "ChartOfAccounts", elementName: "Chart Of Accounts" },
                ]
            }

            this._oBasicSearchField1 = new SearchField();

            this.loadFragment({
                name: `zmb21lsx.ext.fragment.${vhProperty.fragmentName}`,
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar()
                this._oVHDGLAccount = oDialog

                this.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);
                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
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

        _filterTableGLAccount: function (oFilter) {
            var oVHDGLAccount = this._oVHDGLAccount;

            this._oVHDGLAccount.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oVHDGLAccount.update();
            });
        },

        onFilterBarSearchGLAccount: function (oEvent) {
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

            this._filterTableGLAccount(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPressGLAccount: function (oEvent) {
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            var aTokens = oEvent.getParameter("tokens");
            aTokens.forEach(token => {
                header.GLAccount = token.getKey()
            })
            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            this._oVHDGLAccount.close()
            this.reviewFormReservation.setModel(oModel, "selectedItem")
        },

        onValueHelpCancelPressGLAccount: function () {
            this._oVHDGLAccount.close();
        },
        onValueHelpAfterCloseGLAccount: function () {
            this._oVHDGLAccount.destroy();
        },
        ///---------------------- Search Help GL Account -----------------------------------


        ///-------T2--------------- Search Help Cost Center -----------------------------------
        onCostCenterValueHelp: async function () {
            let that = this

            let vhProperty = {
                entity: "I_CostCenterText",
                fragmentName: 'SearchHelp/costcenterSearchHelp',
                elements: [
                    { element: "CostCenter", elementName: "Cost Center" },
                    { element: "ValidityStartDate", elementName: "Valid To" },
                    { element: "ValidityEndDate", elementName: "Valid From" },
                    { element: "CostCenterName", elementName: "Cost Center Name" },
                ]
            }

            this._oBasicSearchField1 = new SearchField();

            this.loadFragment({
                name: `zmb21lsx.ext.fragment.${vhProperty.fragmentName}`,
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar()
                this._oVHDCostCenter = oDialog

                this.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);
                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
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

            // await CostCenter.onFilterBarSearchCostCenter(that)
            // await CostCenter.onValueHelpOkPressCostCenter(that)
            // await CostCenter.onValueHelpCancelPressCostCenter(that)
            // await CostCenter.onValueHelpAfterCloseCostCenter(that)
        },

        _filterTableCostCenter: function (oFilter) {
            var oVHDCostCenter = this._oVHDCostCenter;

            this._oVHDCostCenter.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oVHDCostCenter.update();
            });
        },

        onFilterBarSearchCostCenter: function (oEvent) {
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

            this._filterTableCostCenter(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPressCostCenter: function (oEvent) {
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            var aTokens = oEvent.getParameter("tokens");
            aTokens.forEach(token => {
                header.CostCenter = token.getKey()
            })
            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            this._oVHDCostCenter.close()
            this.reviewFormReservation.setModel(oModel, "selectedItem")
        },

        onValueHelpCancelPressCostCenter: function () {
            this._oVHDCostCenter.close();
        },
        onValueHelpAfterCloseCostCenter: function () {
            this._oVHDCostCenter.destroy();
        },
        ///---------------------- Search Help Cost Center -----------------------------------


        ///-------T2--------------- Search Help Asset -----------------------------------
        onAssetValueHelp: function () {
            let that = this

            let vhProperty = {
                entity: "ZSH_I_FIXEDASSET",
                fragmentName: 'SearchHelp/assetSearchHelp',
                elements: [
                    { element: "CompanyCode", elementName: "Company Code" },
                    { element: "MasterFixedAsset", elementName: "Master Fixed Asset" },
                    { element: "FixedAssetExternalID", elementName: "Fixed Asset External ID" },
                ]
            }

            this._oBasicSearchField1 = new SearchField();

            this.loadFragment({
                name: `zmb21lsx.ext.fragment.${vhProperty.fragmentName}`,
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar()
                this._oVHDAsset = oDialog

                this.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);
                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
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

        _filterTableAsset: function (oFilter) {
            var oVHDAsset = this._oVHDAsset;

            this._oVHDAsset.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oVHDAsset.update();
            });
        },

        onFilterBarSearchAsset: function (oEvent) {
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

            this._filterTableAsset(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPressAsset: function (oEvent) {
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            var aTokens = oEvent.getParameter("tokens");
            aTokens.forEach(token => {
                header.Asset = token.getKey()
            })
            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            this._oVHDAsset.close()
            this.reviewFormReservation.setModel(oModel, "selectedItem")
        },

        onValueHelpCancelPressAsset: function () {
            this._oVHDAsset.close();
        },
        onValueHelpAfterCloseAsset: function () {
            this._oVHDAsset.destroy();
        },
        ///---------------------- Search Help Asset -----------------------------------

        ///-------T2--------------- Search Help Person -----------------------------------
        onPersonValueHelp: function () {
            let that = this

            let vhProperty = {
                entity: "I_BusinessPartnerVH",
                fragmentName: 'SearchHelp/personSearchHelp',
                elements: [
                    { element: "BusinessPartner", elementName: "Business Partner" },
                    { element: "BusinessPartnerName", elementName: "Business Partner Name" },
                ]
            }

            this._oBasicSearchField1 = new SearchField();

            this.loadFragment({
                name: `zmb21lsx.ext.fragment.${vhProperty.fragmentName}`,
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar()
                this._oVHDPerson = oDialog

                this.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);
                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
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

        _filterTablePerson: function (oFilter) {
            var oVHDPerson = this._oVHDPerson;

            this._oVHDPerson.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oVHDPerson.update();
            });
        },

        onFilterBarSearchPerson: function (oEvent) {
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

            this._filterTablePerson(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPressPerson: function (oEvent) {
            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            var aTokens = oEvent.getParameter("tokens");
            aTokens.forEach(token => {
                header.Person = token.getKey()
            })
            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            this._oVHDPerson.close()
            this.reviewFormReservation.setModel(oModel, "selectedItem")
        },

        onValueHelpCancelPressPerson: function () {
            this._oVHDPerson.close();
        },
        onValueHelpAfterClosePerson: function () {
            this._oVHDPerson.destroy();
        },
        ///---------------------- Search Help Person -----------------------------------


        ///---------T2------------- Search Help Sloc -----------------------------------
        onIssueSlocValueHelp: function (oEvent) {
            let arr = oEvent.getSource().getId().split("--")
            let arrChild = arr[1].split("-")
            let index
            if(arrChild.length >= 2) {
                index = oEvent.getSource().getParent().getIndex()
            }
            let dataSearchHelp = {
                nameField: arrChild[0],
                itemTable: index
            }
            // localStorage.setItem("lineIssueSlocSH", dataSearchHelp);
            localStorage.setItem("searchHelp", dataSearchHelp);
            localStorage.removeItem("lineIssueSlocSH")

            let that = this

            let vhProperty = {
                entity: "I_StorageLocationStdVH",
                fragmentName: 'SearchHelp/issueSlocSearchHelp',
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
                this._oVHDIssueSloc = oDialog

                this.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);
                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
                    // aFilters.push( new Filter("Language", "EQ",'EN') )
                    let aSort = new Sorter("Plant", true)
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    oTable.setModel(that.getView().getModel())

                    let FilterGroupItem = new sap.ui.comp.filterbar.FilterGroupItem()

                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: `/${vhProperty.entity}`,
                            filters: aFilters,
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            },
                            // sorter: aSort
                        });
                        vhProperty.elements.forEach(value => {
                            let uiCol = new UIColumn({
                                label: new Label({ text: value.elementName }),
                                template: new Text({
                                    wrapping: false,
                                    text: `{${value.element}}`
                                }),
                                // sorted: true,
                                // sortOrder: "Descending"
                            })
                            // uiCol.data({
                            //     fieldName: value.element
                            // })

                            oTable.addColumn(uiCol)
                        })
                    }
                    // oTable.getBindingInfo("AggregationBindingInfo").sorted('/Plant', true)
                    oDialog.update();
                }.bind(this));
                oDialog.open();
            }.bind(this));
        },

        _filterTableIssueSloc: function (oFilter) {
            var oVHDIssueSloc = this._oVHDIssueSloc;

            oVHDIssueSloc.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                if (oTable.bindItems) {
                    oTable.getBinding("items").filter(oFilter);
                }

                oVHDIssueSloc.update();
            });
        },

        onFilterBarSearchIssueSloc: function (oEvent) {
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

            this._filterTableIssueSloc(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPressIssueSloc: function (oEvent) {

            // this.onChangeIssueSloc()

            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            var aTokens = oEvent.getParameter("tokens");
            aTokens.forEach(token => {
                header.ReceivingSloc = token.getKey()
            })
            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            this._oVHDIssueSloc.close()
            this.reviewFormReservation.setModel(oModel, "selectedItem")
            this.onChangeReceivingSloc()
        },

        onValueHelpCancelPressIssueSloc: function () {
            this._oVHDIssueSloc.close();
        },
        onValueHelpAfterCloseIssueSloc: function () {
            this._oVHDIssueSloc.destroy();
        },

        ///---------------------- Search Help Sloc -----------------------------------



        _closeDialog: function () {
            this.reviewFormReservation.close();
            this.busyDialog.close()
        }

    };
});
