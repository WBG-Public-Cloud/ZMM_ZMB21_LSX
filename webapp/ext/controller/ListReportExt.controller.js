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
    './SearchHelp/main',
    './Change/main'

], function (MessageToast, MessageBox, Fragment, Controller, JSONModel, Element, SearchField, Filter, UIColumn, MColumn, Label, Text, FilterOperator, Sorter, SearchHelp, Change) {
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
        onChangeLongText: async function (oEvent) {
            await Change.onChangeLongText(oEvent, this)
        },

        ///------------T2---------- Change Storage Location -----------------------------------
        onChangeIssueSloc: async function (oEvent) { // Dòng item change issue sloc\
            await Change.onChangeIssueSloc(oEvent, this)
        },

        ///------------T2---------- Change ReceivingSloc-----------------------------------
        onChangeReceivingSloc: async function () {
            await Change.onChangeReceivingSloc(this)
        },

        ///---------T2------------- Search Help Sloc -----------------------------------

        //------ Search Help Receiving Sloc --------
        onReceivingSlocValueHelp: async function (oEvent) {
            let vhProperty = {
                entity: "I_StorageLocationStdVH",
                fragmentName: 'SearchHelp/slocSearchHelp',
                elements: [
                    { element: "Plant", elementName: "Plant" },
                    { element: "StorageLocation", elementName: "StorageLocation" },
                    { element: "StorageLocationName", elementName: "StorageLocation Name" }
                ]
            }

            await SearchHelp.onFragmentValueHelp(oEvent, this, vhProperty)
        },

        //------ Search Help Movement Type --------
        onMovementTypeValueHelp: async function (oEvent) {
            let vhProperty = {
                entity: "I_GoodsMovementTypeT",
                fragmentName: 'SearchHelp/movementSearchHelp',
                elements: [
                    { element: "GoodsMovementType", elementName: "Movement Type" },
                    { element: "Language", elementName: "Language" },
                    { element: "GoodsMovementTypeName", elementName: "Movement Type Description" }
                ],
                filter: {
                    path: "Language",
                    operator: "EQ",
                    value: "EN"
                }
            }

            await SearchHelp.onFragmentValueHelp(oEvent, this, vhProperty)
        },

        //------ Search Help GL Account --------
        onGLAccountValueHelp: async function (oEvent) {
            let vhProperty = {
                entity: "I_GLAcctInChtOfAcctsStdVH",
                fragmentName: 'SearchHelp/glaccountSearchHelp',
                elements: [
                    { element: "GLAccountExternal", elementName: "G/L Account External" },
                    { element: "GLAccount", elementName: "G/L Account" },
                    { element: "ChartOfAccounts", elementName: "Chart Of Accounts" },
                ]
            }

            await SearchHelp.onFragmentValueHelp(oEvent, this, vhProperty)
        },

        //----- dùng chung ------------
        _filterTable: function (oFilter) {
            var oVHD = this._oVHD;
            if (!oFilter.aFilters || oFilter.aFilters.length == 0) {
                oFilter = []
            }

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

        onFilterBarSearch: async function (oEvent) {
            await SearchHelp.onFilterBarSearch(oEvent, this)
        },

        onValueHelpOkPress: async function (oEvent) {
            await SearchHelp.onValueHelpOkPress(oEvent, this)
        },

        onValueHelpCancelPress: function () {
            this._oVHD.close();
        },
        onValueHelpAfterClose: function () {
            this._oVHD.destroy();
        },
        //----- dùng chung ------------


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
            if (arrChild.length >= 2) {
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
