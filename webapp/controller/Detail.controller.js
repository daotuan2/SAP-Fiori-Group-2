sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("freestyleui5fiori.freestyleui5fiori.controller.Detail", {
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sCode = oEvent.getParameter("arguments").JT_CODE;
            var oModel = this.getOwnerComponent().getModel("JobTitleModel");
            var sPath = "/Job_Title_EntitySet('" + sCode + "')";
            this.getView().bindElement({
                path: sPath,
                model: "JobTitleModel"
            });
        },
        formatter: {
            formatDateTime: function (sDateTime) {
                if (!sDateTime) return "";
                var oDate = new Date(sDateTime);
                var iDay = oDate.getDate().toString().padStart(2, '0');
                var iMonth = (oDate.getMonth() + 1).toString().padStart(2, '0');
                var iYear = oDate.getFullYear();
                var iHours = oDate.getHours().toString().padStart(2, '0');
                var iMinutes = oDate.getMinutes().toString().padStart(2, '0');
                var iSeconds = oDate.getSeconds().toString().padStart(2, '0');
                return `${iDay}/${iMonth}/${iYear} ${iHours}:${iMinutes}:${iSeconds}`;
            }
        }

    });
});
