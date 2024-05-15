sap.ui.define([
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/ui/richtexteditor/RichTextEditor",
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
    './Change/main',
    './PostReservation/main'

], function (Dialog, Button, RichTextEditor, MessageToast, MessageBox, Fragment, Controller, JSONModel, Element, SearchField, Filter, UIColumn, MColumn, Label, Text, FilterOperator, Sorter, SearchHelp, Change, PostReservation) {
    'use strict';

    return {
        reviewFormReservation: null,
        busyDialog: null,
        TextEditorDialog: null,

        onInit: async function () {
        },

        //-----------T0------------------- Fragment Busy Dialog ------------------------------------------
        openBusyDialog: function () {
            if (!this.busyDialog) {
                Fragment.load({ id: "busyFragment", name: "zmb21lsx.ext.fragment.Notify.busy", type: "XML", controller: this }).then((oDialog) => {
                    console.log("oDialog", oDialog)
                    this.busyDialog = oDialog;
                    this.busyDialog.open()
                }).catch(error => {
                    MessageBox.error('Please reload the page')
                });
            } else {
                this.busyDialog.open()
            }
        },

        //-----------T0------------------- Fragment Busy Dialog ------------------------------------------

        //-----------T0------------------- Fragment Text Editor Dialog ------------------------------------------
        openTextEditorDialog: function (value) {
            // Create the dialog lazily
            if (!this.TextEditorDialog) {
            this.TextEditorDialog = new Dialog({
                title: "Text Editor",
                contentWidth: "600px",
                contentHeight: "400px",
                draggable: true,
                resizable: true,
                content: [
                    new RichTextEditor({
                        id: this.createId("richTextEditor"),
                        width: "100%",
                        height: "100%",
                        customToolbar: true,
                        editorType: "TinyMCE5",
                        value: `${value}`,
                    })
                ],
                beginButton: new Button({
                    text: "Save",
                    press: this.onSaveTextEditor.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: this.onCancelTextEditor.bind(this)
                }),
                afterClose: this.onCloseTextEditor.bind(this)
            });

            // Add the dialog as a dependent to the view
            // this.getView().addDependent(this.TextEditorDialog);
            }
            this.TextEditorDialog.open()
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
                        MessageToast.show('Please reload the page')
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
        _onPostReservation: async function (oEvent) {
            this.openBusyDialog()
            let hostname = window.location.hostname
            await PostReservation._onPostReservation(oEvent, this, hostname)
        },

        //--------------Remove Item Table----------------------
        onRemoveItem: function (oEvent) {
            //auto set True for button
            oEvent.getSource().setPressed(true)

            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            let arrItemRemove = Fragment.byId("reviewReservation", "tableItem").getSelectedIndices()

            this.openBusyDialog()

            // Tạo một tập hợp (Set) các chỉ số để xóa
            let indexesSet = new Set(arrItemRemove);

            // Sử dụng filter để tạo ra mảng mới
            let newArray = arrItem.filter((_, i) => !indexesSet.has(i));


            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: newArray });
            this.reviewFormReservation.setModel(oModel, "selectedItem")
            this.busyDialog.close()

        },


        //--------------Add Item Table-------------------------
        onAddItem: function (oEvent) {
            //auto set True for button
            oEvent.getSource().setPressed(true)

            let header = this.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = this.reviewFormReservation.getModel("selectedItem").oData.items
            let arrItemRemove = Fragment.byId("reviewReservation", "tableItem").getSelectedIndices()

            this.openBusyDialog()

            // To copy the added items without sharing the same memory 
            let arrItemAdd = arrItemRemove.map(i => JSON.parse(JSON.stringify(arrItem[i])));

            // To add all elements of arrItemAdd into arrItem
            arrItem.push(...arrItemAdd)

            // Sort arrItem
            arrItem.sort((a, b) => a.No - b.No);

            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            this.reviewFormReservation.setModel(oModel, "selectedItem")
            this.busyDialog.close()

        },

        ///------------T2---------- Change Long Text -----------------------------------
        onNoteValueHelp: async function (oEvent) {
            let index = oEvent.getSource().getParent().getIndex()
            let value = oEvent.getSource().getValue()
            localStorage.setItem("itemLongText", index)
            this.openTextEditorDialog(value)
        },

        onSaveTextEditor: async function () {
            // Handle save action
            var oRichTextEditor = this.byId("richTextEditor");
            var sText = oRichTextEditor.getValue();

            // Process the text as needed
            await Change.onChangeNote(this, sText)
        },

        onCancelTextEditor: function () {
            this.TextEditorDialog.close();
        },

        onCloseTextEditor: function () {
            // Perform any cleanup if necessary
            // Optionally, reset the content of the RichTextEditor if needed
            var oRichTextEditor = this.byId("richTextEditor");
            oRichTextEditor.setValue("");

            // Destroy the RichTextEditor to clean up resources
            if (oRichTextEditor) {
                oRichTextEditor.destroy();
            }

            // Destroy the dialog to clean up resources
            if (this.TextEditorDialog) {
                this.TextEditorDialog.destroy();
                this.TextEditorDialog = null;
            }

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
            let Plant = this.reviewFormReservation.getModel("selectedItem").oData.items[0].Plant

            let vhProperty = {
                entity: "I_StorageLocationStdVH",
                fragmentName: 'SearchHelp/slocSearchHelp',
                elements: [
                    { element: "Plant", elementName: "Plant" },
                    { element: "StorageLocation", elementName: "StorageLocation" },
                    { element: "StorageLocationName", elementName: "StorageLocation Name" }
                ],
                filter: {
                    path: "Plant",
                    operator: "EQ",
                    value: `${Plant}`
                },
                fieldSearch: {
                    key: "StorageLocation",
                    items: [
                        { name: "StorageLocation", label: "Storage Location", arrnameInput: "StorageLocation" },
                        { name: "Plant", label: "Plant", arrnameInput: [{ nameInput: "Plant" }, { nameInput: "Plant" }] },
                    ]
                }

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

        //------ Search Help Cost Center --------
        onCostCenterValueHelp: async function (oEvent) {
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

            await SearchHelp.onFragmentValueHelp(oEvent, this, vhProperty)
        },

        //------ Search Help Asset --------
        onAssetValueHelp: async function (oEvent) {
            let vhProperty = {
                entity: "ZSH_I_FIXEDASSET",
                fragmentName: 'SearchHelp/assetSearchHelp',
                elements: [
                    { element: "CompanyCode", elementName: "Company Code" },
                    { element: "MasterFixedAsset", elementName: "Master Fixed Asset" },
                    { element: "FixedAssetExternalID", elementName: "Fixed Asset External ID" },
                ]
            }

            await SearchHelp.onFragmentValueHelp(oEvent, this, vhProperty)
        },

        //------ Search Help Person --------
        onPersonValueHelp: async function (oEvent) {
            let vhProperty = {
                entity: "I_BusinessPartnerVH",
                fragmentName: 'SearchHelp/personSearchHelp',
                elements: [
                    { element: "BusinessPartner", elementName: "Business Partner" },
                    { element: "BusinessPartnerName", elementName: "Business Partner Name" },
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
        ///---------T2------------- Search Help Sloc -----------------------------------


        _closeDialog: function () {
            this.reviewFormReservation.close();
            this.busyDialog.close()
        }

    };
});
