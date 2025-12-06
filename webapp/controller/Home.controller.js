sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    function (Controller, MessageToast, Fragment, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("freestyleui5fiori.freestyleui5fiori.controller.Home", {
            onInit: function () {
                // Lấy tabbar
                var oTabBar = this.byId("mainTabBar");

                // Nếu chưa set selectedKey trong XML, mặc định sẽ là tab đầu tiên
                var sKey = oTabBar.getSelectedKey() || "titles";

                // Gọi hàm xử lý giống như khi select
                this._updateToolbarVisibility(sKey);
            },

            onTabSelect: function (oEvent) {
                var sKey = oEvent.getParameter("key");
                this._updateToolbarVisibility(sKey);
            },

            _updateToolbarVisibility: function (sKey) {
                var oCreateBtn = this.byId("createButton");
                var oDeleteBtn = this.byId("deleteButton");
                var oUpdateBtn = this.byId("updateButton");
                var oSendMailBtn = this.byId("idbutton5");

                if (sKey === "titles") {
                    oCreateBtn.setVisible(true);
                    oDeleteBtn.setVisible(true);
                    oUpdateBtn.setVisible(true);
                    oSendMailBtn.setVisible(false);
                } else if (sKey === "emails") {
                    oCreateBtn.setVisible(false);
                    oDeleteBtn.setVisible(false);
                    oUpdateBtn.setVisible(false);
                    oSendMailBtn.setVisible(true);
                }
            },
            onDeleteSelected: function () {
                var oTable = this.byId("jobTable");
                var oSelected = oTable.getSelectedItem();

                if (!oSelected) {
                    MessageToast.show("Vui lòng chọn một dòng để xóa");
                    return;
                }

                // Lấy đường dẫn binding của dòng được chọn
                var sPath = oSelected.getBindingContext().getPath();
                var oModel = this.getView().getModel();

                // Gọi OData remove
                oModel.remove(sPath, {
                    success: function () {
                        MessageToast.show("Xóa thành công");
                    },
                    error: function () {
                        MessageToast.show("Xóa thất bại");
                    }
                });
            },

            onOpenUpdateDialog: function () {
                var oTable = this.byId("jobTable");
                var oSelected = oTable.getSelectedItem();

                if (!oSelected) {
                    MessageToast.show("Vui lòng chọn một dòng để cập nhật");
                    return;
                }

                var oView = this.getView();
                var oContext = oSelected.getBindingContext();
                var sCode = oContext.getProperty("JT_CODE");
                var sName = oContext.getProperty("JT_NAME");

                if (!this._oDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "freestyleui5fiori.freestyleui5fiori.view.fragment.UpdateDialog",
                        controller: this
                    }).then(function (oDialog) {
                        this._oDialog = oDialog;
                        oView.addDependent(this._oDialog);
                        // Gán dữ liệu vào input
                        this.byId("inputCode").setValue(sCode);
                        this.byId("inputName").setValue(sName);
                        this._oDialog.open();
                    }.bind(this));
                } else {
                    // Gán dữ liệu mỗi lần mở
                    this.byId("inputCode").setValue(sCode);
                    this.byId("inputName").setValue(sName);
                    this._oDialog.open();
                }

                // Lưu lại binding context để dùng khi update
                this._oSelectedContext = oSelected.getBindingContext();
            },

            onConfirmUpdate: function () {
                var oModel = this.getView().getModel();
                var sPath = this._oSelectedContext.getPath();

                var sNewName = this.byId("inputName").getValue();
                var sNewCode = this.byId("inputCode").getValue();

                var oUpdatedData = {
                    JT_NAME: sNewName,
                    JT_CODE: sNewCode
                };

                oModel.update(sPath, oUpdatedData, {
                    success: function () {
                        MessageToast.show("Cập nhật thành công");
                    },
                    error: function () {
                        MessageToast.show("Cập nhật thất bại");
                    }
                });

                this._oDialog.close();
            },

            onCancelUpdate: function () {
                this._oDialog.close();
            },
            onOpenCreateDialog: function () {
                var oView = this.getView();

                if (!this._oCreateDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "freestyleui5fiori.freestyleui5fiori.view.fragment.CreateDialog",
                        controller: this
                    }).then(function (oDialog) {
                        this._oCreateDialog = oDialog;
                        oView.addDependent(this._oCreateDialog);
                        this._oCreateDialog.open();
                    }.bind(this));
                } else {
                    this._oCreateDialog.open();
                }
            },

            onConfirmCreate: function () {
                var oModel = this.getView().getModel();

                var sName = this.byId("createName").getValue();
                var sCode = this.byId("createCode").getValue();

                var oNewData = {
                    JT_NAME: sName,
                    JT_CODE: sCode
                };

                oModel.create("/Job_Title_EntitySet", oNewData, {
                    success: function () {
                        MessageToast.show("Tạo mới thành công");
                    },
                    error: function () {
                        MessageToast.show("Tạo mới thất bại");
                    }
                });

                this._oCreateDialog.close();
            },

            onCancelCreate: function () {
                this._oCreateDialog.close();
            },

            onSearch: function () {
                //Chỉ filter trên front end
                var sCode = this.byId("searchCode").getValue().toLowerCase();
                var sName = this.byId("searchName").getValue().toLowerCase();
                var oTable = this.byId("jobTable");

                // Lấy tất cả items hiện có trong bảng
                var aItems = oTable.getItems();

                aItems.forEach(function (oItem) {
                    var oCells = oItem.getCells();
                    var sItemCode = oCells[0].getText().toLowerCase(); // cột JT_CODE
                    var sItemName = oCells[1].getText().toLowerCase(); // cột JT_NAME

                    var bMatch = true;

                    if (sCode) {
                        bMatch = bMatch && sItemCode.includes(sCode);
                    }
                    if (sName) {
                        bMatch = bMatch && sItemName.includes(sName);
                    }

                    // Ẩn/hiện item theo kết quả lọc
                    oItem.setVisible(bMatch);
                });
            },

            onSendEmail: function () {
                MessageToast.show("Gửi email đã được gọi");
            },
            onValueHelpCode: function () {
                //lấy data từ front end thì nhanh hơn nhiều
                var oView = this.getView();
                var oJobTable = this.byId("jobTable");
                var aItems = oJobTable.getItems(); // lấy list hiện có trên frontend

                if (!this._oValueHelpDialogCode) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "freestyleui5fiori.freestyleui5fiori.view.fragment.ValueHelpDialogCode",
                        controller: this
                    }).then(function (oDialog) {
                        this._oValueHelpDialogCode = oDialog;
                        oView.addDependent(this._oValueHelpDialogCode);

                        // đổ dữ liệu từ jobTable vào valueHelpTableCode
                        var oValueHelpTable = this.byId("valueHelpTableCode");
                        oValueHelpTable.removeAllItems();

                        aItems.forEach(function (oItem) {
                            var oCells = oItem.getCells();
                            var sCode = oCells[0].getText();
                            var sName = oCells[1].getText();

                            oValueHelpTable.addItem(new sap.m.ColumnListItem({
                                cells: [
                                    new sap.m.Text({ text: sCode }),
                                    new sap.m.Text({ text: sName })
                                ]
                            }));
                        });

                        this._oValueHelpDialogCode.open();
                    }.bind(this));
                } else {
                    var oValueHelpTable = this.byId("valueHelpTableCode");
                    oValueHelpTable.removeAllItems();

                    aItems.forEach(function (oItem) {
                        var oCells = oItem.getCells();
                        var sCode = oCells[0].getText();
                        var sName = oCells[1].getText();

                        oValueHelpTable.addItem(new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: sCode }),
                                new sap.m.Text({ text: sName })
                            ]
                        }));
                    });

                    this._oValueHelpDialogCode.open();
                }
            },

            onSelectValueHelpCode: function (oEvent) {
                var oSelected = oEvent.getParameter("listItem");
                if (oSelected) {
                    var sCode = oSelected.getCells()[0].getText(); // lấy JT_CODE
                    this.byId("searchCode").setValue(sCode);       // gán vào Input
                    this._oValueHelpDialogCode.close();            // đóng dialog
                }
            },

            onValueHelpName: function () {
                //lấy data từ front end thì nhanh hơn nhiều
                 var oView = this.getView();
                var oJobTable = this.byId("jobTable");
                var aItems = oJobTable.getItems(); // lấy list hiện có trên frontend

                if (!this._oValueHelpDialogName) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "freestyleui5fiori.freestyleui5fiori.view.fragment.ValueHelpDialogName",
                        controller: this
                    }).then(function (oDialog) {
                        this._oValueHelpDialogName = oDialog;
                        oView.addDependent(this._oValueHelpDialogName);

                        // đổ dữ liệu từ jobTable vào valueHelpTableName
                        var oValueHelpTable = this.byId("valueHelpTableName");
                        oValueHelpTable.removeAllItems();

                        aItems.forEach(function (oItem) {
                            var oCells = oItem.getCells();
                            var sCode = oCells[0].getText();
                            var sName = oCells[1].getText();

                            oValueHelpTable.addItem(new sap.m.ColumnListItem({
                                cells: [
                                    new sap.m.Text({ text: sCode }),
                                    new sap.m.Text({ text: sName })
                                ]
                            }));
                        });

                        this._oValueHelpDialogName.open();
                    }.bind(this));
                } else {
                    var oValueHelpTable = this.byId("valueHelpTableName");
                    oValueHelpTable.removeAllItems();

                    aItems.forEach(function (oItem) {
                        var oCells = oItem.getCells();
                        var sCode = oCells[0].getText();
                        var sName = oCells[1].getText();

                        oValueHelpTable.addItem(new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: sCode }),
                                new sap.m.Text({ text: sName })
                            ]
                        }));
                    });

                    this._oValueHelpDialogName.open();
                }
            },

            onSelectValueHelpName: function (oEvent) {
                var oSelected = oEvent.getParameter("listItem");
                if (oSelected) {
                    var sName = oSelected.getCells()[1].getText(); // lấy JT_NAME
                    this.byId("searchName").setValue(sName);       // gán vào Input
                    this._oValueHelpDialogName.close();            // đóng dialog
                }
            },

            onCloseValueHelp: function (oEvent) {
                oEvent.getSource().getParent().close();
            },  
        });
    });
