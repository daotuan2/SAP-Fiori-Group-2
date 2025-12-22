sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
],
    function (Controller, MessageToast, Fragment, MessageBox, JSONModel) {
        "use strict";

        return Controller.extend("freestyleui5fiori.freestyleui5fiori.controller.Home", {
            onInit: function () {
                // Lấy tabbar
                var oTabBar = this.byId("mainTabBar");

                // Nếu chưa set selectedKey trong XML, mặc định sẽ là tab đầu tiên
                var sKey = oTabBar.getSelectedKey() || "titles";

                // Gọi hàm xử lý giống như khi select
                this._updateToolbarVisibility(sKey);

                var that = this;

                //Stores products data and indexes data
                var oProductsModel = new JSONModel({
                    productsData: [],
                    isProductsDataLoading: true,
                    tableData: [],
                    startIndex: 0,
                    endIndex: 0,
                    noOfTableRows: 5,
                    page: 0,
                    totalPages: 0,
                });
                that.getView().setModel(oProductsModel, "ProductsModel");

                //Stores Nav buttons enable properties
                var oNavModel = new JSONModel({
                    firstPageBtnEnable: false,
                    nextPageBtnEnable: false
                });
                that.getView().setModel(oNavModel, "NavModel");

                var oModel = that.getOwnerComponent().getModel("JobTitleModel");
                oModel.read("/Job_Title_EntitySet", {
                    success: function (oData) {
                        var oPM = that.getView().getModel("ProductsModel");
                        oPM.setProperty("/productsData", oData.results);
                        oPM.setProperty("/currentData", oData.results); // thêm dòng này

                        oPM.setProperty("/isProductsDataLoading", false);
                        var noOfTableRows = parseInt(oPM.getProperty("/noOfTableRows"));
                        oPM.setProperty("/totalPages", Math.ceil(oData.results.length / noOfTableRows));
                        that.onFirstPress();

                    },
                    error: function (oError) {
                        that.getView().getModel("ProductsModel").setProperty("/isProductsDataLoading", false);
                    }
                });
                this._setDataTreeTable();
            },

            onFirstPress: function () {
                var oPM = this.getView().getModel("ProductsModel");
                var data = oPM.getProperty("/currentData"); // dùng currentData
                var pageSize = parseInt(oPM.getProperty("/noOfTableRows"));
                var newData = data.slice(0, pageSize);
                this.fnSetTableData(newData, 0, newData.length - 1, 1); // endIndex theo độ dài thực tế
            },

            onPreviousPress: function () {
                var oPM = this.getView().getModel("ProductsModel");
                var data = oPM.getProperty("/currentData");
                var pageSize = parseInt(oPM.getProperty("/noOfTableRows"));
                var startIndex = oPM.getProperty("/startIndex");
                var newStart = Math.max(0, startIndex - pageSize);
                var newEnd = newStart + pageSize; // không vượt quá độ dài
                var newData = data.slice(newStart, newEnd);
                this.fnSetTableData(newData, newStart, newStart + newData.length - 1, oPM.getProperty("/page") - 1);
            },

            onNextPress: function () {
                var oPM = this.getView().getModel("ProductsModel");
                var data = oPM.getProperty("/currentData");
                var pageSize = parseInt(oPM.getProperty("/noOfTableRows"));
                var endIndex = oPM.getProperty("/endIndex");
                var newStart = endIndex + 1;
                var newEnd = newStart + pageSize;
                var newData = data.slice(newStart, newEnd);
                if (newData.length === 0) { return; } // không có trang tiếp
                this.fnSetTableData(newData, newStart, newStart + newData.length - 1, oPM.getProperty("/page") + 1);
            },

            onLastPress: function () {
                var oPM = this.getView().getModel("ProductsModel");
                var data = oPM.getProperty("/currentData");
                var pageSize = parseInt(oPM.getProperty("/noOfTableRows"));
                var remainder = data.length % pageSize;
                var startIndex = remainder === 0 ? data.length - pageSize : data.length - remainder;
                var newData = data.slice(startIndex);
                this.fnSetTableData(newData, startIndex, startIndex + newData.length - 1, Math.ceil(data.length / pageSize));
            },


            //Sets the table data
            fnSetTableData: function (newData, startIndex, endIndex, page) {
                var that = this;
                that.getView().getModel("ProductsModel").setProperty("/tableData", newData);
                that.getView().getModel("ProductsModel").setProperty("/startIndex", startIndex);
                that.getView().getModel("ProductsModel").setProperty("/endIndex", endIndex);
                //Sets Current page count
                that.getView().getModel("ProductsModel").setProperty("/page", page);
                //To Enable the nav bottons
                that.fnNavButtonsEnable();
            },

            fnNavButtonsEnable: function () {
                var oPM = this.getView().getModel("ProductsModel");
                var iPage = oPM.getProperty("/page");
                var iTotalPages = oPM.getProperty("/totalPages");

                var oNav = this.getView().getModel("NavModel");
                oNav.setProperty("/nextPageBtnEnable", iPage < iTotalPages);
                oNav.setProperty("/firstPageBtnEnable", iPage > 1);
            },

            formatter: {
                statusText: function (sStatus) {
                    return sStatus === "ACTIVE" ? "Kích hoạt" : "Không kích hoạt";
                },
                statusState: function (sStatus) {
                    return sStatus === "ACTIVE" ? "Success" : "Error";
                },
                formatDateTime: function (sDateTime) {
                    if (!sDateTime) return "";
                    var oDate = new Date(sDateTime);
                    var iDay = oDate.getDate().toString().padStart(2, '0');
                    var iMonth = (oDate.getMonth() + 1).toString().padStart(2, '0');
                    var iYear = oDate.getFullYear();
                    var iHours = oDate.getHours().toString().padStart(2, '0');
                    var iMinutes = oDate.getMinutes().toString().padStart(2, '0');
                    var iSeconds = oDate.getSeconds().toString().padStart(2, '0');
                    return iDay + "/" + iMonth + "/" + iYear + " " + iHours + ":" + iMinutes + ":" + iSeconds;
                }
            },
            onRowSelect: function (oEvent) {
                var oItem = oEvent.getParameter("listItem");
                this.byId("jobTable").setSelectedItem(oItem);
            },

            onRowButton: function (oEvent) {
                var oItem = oEvent.getSource().getParent(); // ColumnListItem
                // Lấy context từ ProductsModel vì bảng đang binding vào ProductsModel>/tableData
                var oCtx = oItem.getBindingContext("ProductsModel");
                var sCode = oCtx.getProperty("JT_CODE");

                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("RouteDetail", {
                    JT_CODE: sCode
                });
            },

            onTabSelect: function (oEvent) {
                var sKey = oEvent.getParameter("key");
                this._updateToolbarVisibility(sKey);

                var oVBox = this.byId("idVbox3");      // VBox chứa bộ lọc tìm kiếm

                if (sKey === "emails") {
                    // Ẩn bộ lọc khi chọn tab email
                    oVBox.setVisible(false);
                } else {
                    // Hiện lại bộ lọc khi chọn tab khác
                    oVBox.setVisible(true);
                }
            },

            _updateToolbarVisibility: function (sKey) {
                var oCreateBtn = this.byId("createButton");
                var oDeleteBtn = this.byId("deleteButton");
                var oUpdateBtn = this.byId("updateButton");
                var oSendMailBtn = this.byId("idbutton5");
                var oTemplateBtn = this.byId("idbutton9");

                if (sKey === "titles") {
                    oCreateBtn.setVisible(true);
                    oDeleteBtn.setVisible(true);
                    oUpdateBtn.setVisible(true);
                    oSendMailBtn.setVisible(false);
                    oTemplateBtn.setVisible(false);
                } else if (sKey === "emails") {
                    oCreateBtn.setVisible(false);
                    oDeleteBtn.setVisible(false);
                    oUpdateBtn.setVisible(false);
                    oSendMailBtn.setVisible(true);
                    oTemplateBtn.setVisible(true);

                }
            },

            _setDataTreeTable: function () {
                var oModel = this.getOwnerComponent().getModel("UserEmailModel");
                var that = this;

                oModel.metadataLoaded().then(function () {
                    oModel.read("/USER_EMAILSet", {
                        success: function (oData) {
                            var groupedCompany = {};

                            oData.results.forEach(function (item) {
                                var company = item.COMPANY_CODE;
                                var jtCode = item.JT_CODE;
                                var jtName = item.JT_NAME;

                                // Bỏ qua nếu không có thông tin cán bộ
                                if (!item.EMAIL && !item.USERNAME) {
                                    return;
                                }

                                // Tạo node công ty
                                if (!groupedCompany[company]) {
                                    groupedCompany[company] = {
                                        COMPANY_CODE: company,
                                        children: {}
                                    };
                                }

                                // Tạo node nhóm chức danh
                                if (!groupedCompany[company].children[jtCode]) {
                                    groupedCompany[company].children[jtCode] = {
                                        JT_CODE: jtCode,
                                        JT_NAME: jtName,
                                        children: [] // sẽ chứa leaf nodes
                                    };
                                }

                                // Thêm leaf node (không có children nữa)
                                groupedCompany[company].children[jtCode].children.push({
                                    EMAIL: item.EMAIL,
                                    USERNAME: item.USERNAME,
                                    USERNAME_CODE: item.USERNAME_CODE
                                    // Không thêm children => leaf node
                                });
                            });

                            // Chuyển thành mảng nodes
                            var treeData = {
                                nodes: Object.values(groupedCompany).map(function (companyNode) {
                                    return {
                                        COMPANY_CODE: companyNode.COMPANY_CODE,
                                        children: Object.values(companyNode.children)
                                    };
                                })
                            };

                            var oTreeModel = new sap.ui.model.json.JSONModel(treeData);
                            that.getOwnerComponent().setModel(oTreeModel, "tree");
                        }.bind(this)
                    });
                });
            },

            onDeleteSelected: function () {
                var oTable = this.byId("jobTable");
                var oSelected = oTable.getSelectedItem();

                if (!oSelected) {
                    MessageToast.show("Vui lòng chọn một dòng để xóa");
                    return;
                }

                // 1. Hiển thị busy indicator (dấu 3 chấm) cho bảng
                oTable.setBusy(true);
                var oItemData = oSelected.getBindingContext("ProductsModel").getObject();
                var sCode = oItemData.JT_CODE;

                var oODataModel = this.getOwnerComponent().getModel("JobTitleModel");
                var sPath = "/Job_Title_EntitySet('" + sCode + "')";

                MessageBox.confirm("Bạn có chắc chắn muốn xóa chức danh này không?", {
                    title: "Xác nhận xóa",
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {

                            // 2. Gửi request xóa lên backend
                            oODataModel.remove(sPath, {
                                success: function () {
                                    // 3. Cập nhật lại dữ liệu ProductsModel
                                    var oProductsModel = this.getView().getModel("ProductsModel");
                                    var aAllData = oProductsModel.getProperty("/productsData");
                                    var aNewAllData = aAllData.filter(function (item) {
                                        return item.JT_CODE !== sCode;
                                    });
                                    oProductsModel.setProperty("/productsData", aNewAllData);

                                    // Cập nhật lại trang hiện tại
                                    var iPage = oProductsModel.getProperty("/page");
                                    var iPageSize = oProductsModel.getProperty("/noOfTableRows");
                                    var iStart = (iPage - 1) * iPageSize;
                                    var iEnd = iStart + iPageSize;
                                    var aPageData = aNewAllData.slice(iStart, iEnd);

                                    oProductsModel.setProperty("/tableData", aPageData);
                                    oProductsModel.setProperty("/startIndex", iStart);
                                    oProductsModel.setProperty("/endIndex", iEnd - 1);
                                    oProductsModel.setProperty("/totalPages", Math.ceil(aNewAllData.length / iPageSize));
                                    MessageToast.show("Xóa thành công");
                                    oTable.setBusy(false);
                                }.bind(this),
                                error: function () {
                                    MessageToast.show("Xóa thất bại");
                                    oTable.setBusy(false);
                                }.bind(this)
                            });
                        }
                    }.bind(this)
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
                var oContext = oSelected.getBindingContext("ProductsModel"); // lấy từ ProductsModel
                var sCode = oContext.getProperty("JT_CODE");
                var sName = oContext.getProperty("JT_NAME");
                var sStatus = oContext.getProperty("STATUS");
                var sNote = oContext.getProperty("NOTE");

                if (!this._oDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "freestyleui5fiori.freestyleui5fiori.view.fragment.UpdateDialog",
                        controller: this
                    }).then(function (oDialog) {
                        this._oDialog = oDialog;
                        oView.addDependent(this._oDialog);
                        this.byId("inputCode").setValue(sCode);
                        this.byId("inputName").setValue(sName);
                        this.byId("inputStatus").setSelectedKey(sStatus);
                        this.byId("inputNote").setValue(sNote);
                        this._oDialog.open();
                    }.bind(this));
                } else {
                    this.byId("inputCode").setValue(sCode);
                    this.byId("inputName").setValue(sName);
                    this.byId("inputStatus").setSelectedKey(sStatus);
                    this.byId("inputNote").setValue(sNote);
                    this._oDialog.open();
                }

                // Lưu lại JT_CODE để dùng khi update
                this._sSelectedCode = sCode;
            },

            onConfirmUpdate: function () {
                var oTable = this.byId("jobTable");
                // 1. Hiển thị busy indicator (dấu 3 chấm) cho bảng
                oTable.setBusy(true);
                var oODataModel = this.getOwnerComponent().getModel("JobTitleModel"); // ODataModel

                var sNewName = this.byId("inputName").getValue();
                var sNewCode = this.byId("inputCode").getValue();
                var sNewStatus = this.byId("inputStatus").getSelectedKey();
                var sNewNote = this.byId("inputNote").getValue();

                var oUpdatedData = {
                    JT_NAME: sNewName,
                    JT_CODE: sNewCode,
                    STATUS: sNewStatus,
                    NOTE: sNewNote
                };

                var sPath = "/Job_Title_EntitySet('" + this._sSelectedCode + "')"; // build path từ JT_CODE

                oODataModel.update(sPath, oUpdatedData, {
                    success: function () {
                        // Sau khi update, reload lại dữ liệu OData
                        oODataModel.read("/Job_Title_EntitySet", {
                            success: function (oData) {
                                var oProductsModel = this.getView().getModel("ProductsModel");
                                oProductsModel.setProperty("/productsData", oData.results);
                                oProductsModel.setProperty("/totalPages", Math.ceil(oData.results.length / oProductsModel.getProperty("/noOfTableRows")));

                                // Giữ nguyên trang hiện tại
                                var iPage = oProductsModel.getProperty("/page");
                                var iPageSize = oProductsModel.getProperty("/noOfTableRows");
                                var iStart = (iPage - 1) * iPageSize;
                                var iEnd = iStart + iPageSize;
                                var aPageData = oData.results.slice(iStart, iEnd);

                                oProductsModel.setProperty("/tableData", aPageData);
                                oProductsModel.setProperty("/startIndex", iStart);
                                oProductsModel.setProperty("/endIndex", iEnd - 1);
                                MessageToast.show("Cập nhật thành công");
                                oTable.setBusy(false);
                            }.bind(this)
                        });
                    }.bind(this),
                    error: function () {
                        MessageToast.show("Cập nhật thất bại");
                        oTable.setBusy(false);
                    }
                });

                this._oDialog.close();
            },

            onCancelUpdate: function () {
                this._oDialog.close();
                this._oDialog.destroy();
                this._oDialog = null;
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
                var oTable = this.byId("jobTable");
                var sCode = this.byId("createCode").getValue().trim();
                var sName = this.byId("createName").getValue().trim();
                var sStatus = this.byId("createStatus").getSelectedKey();
                var sNote = this.byId("createNote").getValue().trim();

                if (!sCode || !sName || !sStatus) {
                    MessageToast.show("Vui lòng nhập đầy đủ thông tin bắt buộc.");
                    return;
                }
                if (sStatus !== "ACTIVE" && sStatus !== "INACTIVE") {
                    MessageToast.show("Trạng thái không hợp lệ.");
                    return;
                }

                var aAllData = this.getView().getModel("ProductsModel").getProperty("/productsData") || [];
                var bExists = aAllData.some(function (oItem) {
                    return oItem.JT_CODE.toUpperCase() === sCode.toUpperCase();
                });
                if (bExists) {
                    MessageToast.show("Mã chức danh đã tồn tại.");
                    return;
                }
                // 1. Hiển thị busy indicator (dấu 3 chấm) cho bảng
                oTable.setBusy(true);

                var oODataModel = this.getOwnerComponent().getModel("JobTitleModel"); // ODataModel
                var oNewData = {
                    NOTE: sNote,
                    STATUS: sStatus,
                    JT_NAME: sName,
                    JT_CODE: sCode
                };

                oODataModel.create("/Job_Title_EntitySet", oNewData, {
                    success: function () {
                        // Sau khi tạo mới, đọc lại toàn bộ dữ liệu từ OData
                        oODataModel.read("/Job_Title_EntitySet", {
                            success: function (oData) {
                                var oProductsModel = this.getView().getModel("ProductsModel");
                                oProductsModel.setProperty("/productsData", oData.results);
                                oProductsModel.setProperty("/totalPages", Math.ceil(oData.results.length / oProductsModel.getProperty("/noOfTableRows")));

                                // Reset về trang đầu tiên
                                this.onFirstPress();
                                MessageToast.show("Tạo mới thành công");
                                oTable.setBusy(false);
                            }.bind(this)
                        });
                    }.bind(this),
                    error: function () {
                        MessageToast.show("Tạo mới thất bại");
                        oTable.setBusy(false);
                    }
                });
                this._oCreateDialog.close();
            },


            onCancelCreate: function () {
                this._oCreateDialog.close();
            },

            onSearch: function () {
                var sCode = this.byId("searchCode").getValue().toLowerCase();
                var sName = this.byId("searchName").getValue().toLowerCase();
                var oPM = this.getView().getModel("ProductsModel");

                var aAllData = oPM.getProperty("/productsData"); // dữ liệu gốc
                var aFiltered = aAllData.filter(function (item) {
                    var bMatch = true;
                    if (sCode) { bMatch = bMatch && item.JT_CODE.toLowerCase().includes(sCode); }
                    if (sName) { bMatch = bMatch && item.JT_NAME.toLowerCase().includes(sName); }
                    return bMatch;
                });

                // cập nhật dữ liệu đang dùng
                oPM.setProperty("/currentData", aFiltered);

                // reset paging theo dữ liệu lọc
                var pageSize = parseInt(oPM.getProperty("/noOfTableRows"));
                var aPageData = aFiltered.slice(0, pageSize);

                oPM.setProperty("/tableData", aPageData);
                oPM.setProperty("/startIndex", 0);
                oPM.setProperty("/endIndex", aPageData.length - 1);
                oPM.setProperty("/page", 1);
                oPM.setProperty("/totalPages", Math.ceil(aFiltered.length / pageSize));

                // cập nhật nút mũi tên
                this.fnNavButtonsEnable();
            },


            onSendEmail: function () {
                var oTable = this.byId("emailTreeTable");
                var oSelected = oTable.getSelectedIndex();

                if (oSelected < 0) {
                    sap.m.MessageToast.show("Vui lòng chọn một dòng để gửi email");
                    return;
                }

                var oContext = oTable.getContextByIndex(oSelected);
                var oData = oContext.getObject();

                // Kiểm tra bắt buộc phải có EMAIL, JT_CODE, UserName
                if (!oData.EMAIL || !oData.JT_CODE || !oData.UserName) {
                    sap.m.MessageToast.show("Dòng được chọn phải có Email và Tên Cán Bộ và Tên Chức Danh");
                    return;
                }

                var oModel = this.getView().getModel();
                oModel.create("/User_EmailSet", {
                    EMAIL: oData.EMAIL,
                    JT_CODE: oData.JT_CODE,
                    UserName: oData.UserName,
                    CREATE_TIME: oData.CREATE_TIME
                }, {
                    success: function () {
                        sap.m.MessageToast.show("Email đã được gửi thành công!");
                    },
                    error: function () {
                        sap.m.MessageToast.show("Có lỗi xảy ra khi gửi email.");
                    }
                });
            },

            onValueHelpCode: function () {
                var oView = this.getView();
                var aAllData = oView.getModel("ProductsModel").getProperty("/productsData"); // toàn bộ dữ liệu

                if (!this._oValueHelpDialogCode) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "freestyleui5fiori.freestyleui5fiori.view.fragment.ValueHelpDialogCode",
                        controller: this
                    }).then(function (oDialog) {
                        this._oValueHelpDialogCode = oDialog;
                        oView.addDependent(this._oValueHelpDialogCode);

                        var oValueHelpTable = this.byId("valueHelpTableCode");
                        oValueHelpTable.removeAllItems();

                        aAllData.forEach(function (oEntry) {
                            oValueHelpTable.addItem(new sap.m.ColumnListItem({
                                cells: [
                                    new sap.m.Text({ text: oEntry.JT_CODE }),
                                    new sap.m.Text({ text: oEntry.JT_NAME })
                                ]
                            }));
                        });

                        this._oValueHelpDialogCode.open();
                    }.bind(this));
                } else {
                    var oValueHelpTable = this.byId("valueHelpTableCode");
                    oValueHelpTable.removeAllItems();

                    aAllData.forEach(function (oEntry) {
                        oValueHelpTable.addItem(new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: oEntry.JT_CODE }),
                                new sap.m.Text({ text: oEntry.JT_NAME })
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
                    this.onSearch();
                }
            },

            onValueHelpName: function () {
                var oView = this.getView();
                // lấy toàn bộ dữ liệu từ ProductsModel>/productsData
                var aAllData = oView.getModel("ProductsModel").getProperty("/productsData");

                if (!this._oValueHelpDialogName) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "freestyleui5fiori.freestyleui5fiori.view.fragment.ValueHelpDialogName",
                        controller: this
                    }).then(function (oDialog) {
                        this._oValueHelpDialogName = oDialog;
                        oView.addDependent(this._oValueHelpDialogName);

                        var oValueHelpTable = this.byId("valueHelpTableName");
                        oValueHelpTable.removeAllItems();

                        aAllData.forEach(function (oEntry) {
                            oValueHelpTable.addItem(new sap.m.ColumnListItem({
                                cells: [
                                    new sap.m.Text({ text: oEntry.JT_CODE }),
                                    new sap.m.Text({ text: oEntry.JT_NAME })
                                ]
                            }));
                        });

                        this._oValueHelpDialogName.open();
                    }.bind(this));
                } else {
                    var oValueHelpTable = this.byId("valueHelpTableName");
                    oValueHelpTable.removeAllItems();

                    aAllData.forEach(function (oEntry) {
                        oValueHelpTable.addItem(new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: oEntry.JT_CODE }),
                                new sap.m.Text({ text: oEntry.JT_NAME })
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
                    this.onSearch();
                }
            },

            onCloseValueHelp: function (oEvent) {
                oEvent.getSource().getParent().close();
            },

            onDisplayTemplateEmail: function () {
                var oTreeTable = this.byId("emailTreeTable");
                var oSelected = oTreeTable.getSelectedIndex();

                if (oSelected < 0) {
                    sap.m.MessageToast.show("Vui lòng chọn một dòng.");
                    return;
                }

                var oContext = oTreeTable.getContextByIndex(oSelected);
                var sJTName = oContext.getProperty("JT_NAME");
                var sJTCode = oContext.getProperty("JT_CODE");

                if (!sJTName) {
                    sap.m.MessageToast.show("Dòng được chọn không có nhóm chức danh.");
                    return;
                }

                // gọi hàm hiển thị template
                this._showTemplatePopup(sJTCode);
            },

            _showTemplatePopup: function (sJTCode) {
                var oModel = this.getOwnerComponent().getModel("UserEmailModel");
                // Hiện busy indicator toàn màn hình 
                sap.ui.core.BusyIndicator.show(0);

                oModel.read("/EMAIL_TEMPLATESet", {
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide(); // tắt busy khi xong
                        // tìm template theo JT_CODE
                        var sTemplateId = sJTCode.toUpperCase(); // chuẩn hóa
                        var oTemplate = oData.results.find(function (tpl) {
                            return tpl.TEMPLATE_ID.toUpperCase() === sTemplateId;
                        });

                        if (oTemplate) {
                            var oHtmlContent = new sap.ui.core.HTML({
                                content: oTemplate.HTML_CONTENT // field từ OData
                            });

                            var oDialog = new sap.m.Dialog({
                                title: "Template Email",
                                content: [oHtmlContent],
                                endButton: new sap.m.Button({
                                    text: "Đóng",
                                    press: function () {
                                        oDialog.close();
                                    }
                                })
                            });
                            oDialog.open();
                        } else {
                            sap.m.MessageToast.show("Chưa có template tương ứng cho chức danh " + sJTCode);
                        }
                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide(); // tắt busy khi xong
                        sap.m.MessageToast.show("Không thể tải dữ liệu template từ OData");
                    }
                });
            }
        });
    });
