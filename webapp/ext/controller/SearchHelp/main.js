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
], function (MessageToast, MessageBox, Fragment, Controller, JSONModel, Element, SearchField, Filter, UIColumn, MColumn, Label, Text, FilterOperator, Sorter) {
    'use strict';

    return {

        onFragmentValueHelp: function (oEvent, that, vhProperty) {
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

            dataSearchHelp = JSON.stringify(dataSearchHelp)
            // localStorage.removeItem("searchHelp")
            localStorage.setItem("searchHelp", dataSearchHelp);

            that._oBasicSearchField = new SearchField();

            that.loadFragment({
                name: `zmb21lsx.ext.fragment.${vhProperty.fragmentName}`,
            }).then(function (oDialog) {
                ////------------nghien cuu----------------

                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({header: vhProperty.fieldSearch});
                that._oVHD = oDialog
                that._oVHD.setModel(oModel, "fieldSearch")

                // var oModel1 = new sap.ui.model.json.JSONModel();
                // oModel1.setData({header: vhProperty.keySearch});
                // that._oVHD = oDialog
                // that._oVHD.setModel(oModel1, "keySearch")


                ////


                var oFilterBar = oDialog.getFilterBar()
                // that._oVHD = oDialog

                that.getView().addDependent(oDialog);
                oFilterBar.setFilterBarExpanded(true);


                oDialog.getTableAsync().then(function (oTable) {
                    let aFilters = []
                    if(vhProperty.filter){
                        aFilters.push( new Filter(`${vhProperty.filter.path}`,
                                                  `${vhProperty.filter.operator}`,
                                                  `${vhProperty.filter.value}`) )
                    }
                    // aFilters.push( new Filter("Language", "EQ",'EN') )
                    let aSort = new Sorter("Plant", true)
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    oTable.setModel(that.getView().getModel())

                    // let FilterGroupItem = new sap.ui.comp.filterbar.FilterGroupItem()

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
                }.bind(that));
                oDialog.open();
            }.bind(that));
        },

        // _filterTable: function (oFilter, that) {
        //     var oVHD = that._oVHD;

        //     oVHD.getTableAsync().then(function (oTable) {
        //         if (oTable.bindRows) {
        //             oTable.getBinding("rows").filter(oFilter);
        //         }
        //         if (oTable.bindItems) {
        //             oTable.getBinding("items").filter(oFilter);
        //         }

        //         oVHD.update();
        //     });
        // },

        onFilterBarSearch: function (oEvent, that) {
            var aSelectionSet = oEvent.getParameter("selectionSet");
            console.log(aSelectionSet)
            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                console.log(oControl)
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }
                return aResult;
            }, []);

            that._filterTable(new Filter({
                filters: aFilters,
                and: true
            }));
        },

        onValueHelpOkPress: function (oEvent, that) {
            let dataSearchHelp = JSON.parse(localStorage.getItem("searchHelp"))
            let header = that.reviewFormReservation.getModel("selectedItem").oData.header
            let arrItem = that.reviewFormReservation.getModel("selectedItem").oData.items
            var aTokens = oEvent.getParameter("tokens");
            aTokens.forEach(token => {
                if (dataSearchHelp.itemTable) {
                    //change line table
                } else {
                    if (dataSearchHelp.nameField == 'ReceivingSloc') {
                        // header.ReceivingSloc = token.getKey()
                        header[`${dataSearchHelp.nameField}`] = token.getKey()
                        that.onChangeReceivingSloc()
                    } else {
                        header[`${dataSearchHelp.nameField}`] = token.getKey()
                    }
                }
            })
            // update Model For Fragment reviewFormReservation
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData({ header: header, items: arrItem });
            that._oVHD.close()
            that.reviewFormReservation.setModel(oModel, "selectedItem")
        }
    }
})