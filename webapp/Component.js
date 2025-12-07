/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "freestyleui5fiori/freestyleui5fiori/model/models"
],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("freestyleui5fiori.freestyleui5fiori.Component", {
            metadata: {
                manifest: "json"
            },
            // file này Khởi tạo UIComponent, đọc manifest, khởi tạo router, gắn model.
            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                //đây là nơi khởi tạo ODataModel để thực hiện get create update delete data
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);