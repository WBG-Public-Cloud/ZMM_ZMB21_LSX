sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
	"sap/ui/core/mvc/Controller",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	"sap/ui/core/Messaging",
	'sap/ui/core/message/Message',
	'sap/ui/core/library',
	'sap/ui/model/json/JSONModel',
	'sap/ui/core/Element'
], function(MessageToast, Fragment, Controller, JSONModel, Element) {
    'use strict';

    return {
        formDialog: null,

        onInit: function () {
			Fragment.load({
				id: "mainDialog",
				name: "zmb21lsx.ext.fragment.formReservation",
				type: "XML",
				controller: this
			}).then((oDialog) => {
				this.formDialog = oDialog
			}).catch(error => {
				MessageToast.show('Vui lòng tải lại trang')
			});
		},


        Create: function(oEvent) {
            console.log('log', this.formDialog.open())
            this.formDialog.open();
        },
        

        _closeDialog: function () {
			this.formDialog.close();
		},

    };
});