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

                var oModel = this.getOwnerComponent().getModel("UserEmailModel");
                var that = this;

                oModel.read("/MATERIAL_INFO_SEARCH_HELPSet", {
                    success: function (oData) {
                        var oMaterialModel = new sap.ui.model.json.JSONModel({ results: oData.results });
                        that.getView().setModel(oMaterialModel, "MaterialDocModel");
                    },
                    error: function () {
                        sap.m.MessageToast.show("Không thể tải danh sách Material Document");
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
                // statusText: function (sStatus) {
                //     return sStatus === "ACTIVE" ? "Kích hoạt" : "Không kích hoạt";
                // },
                // statusState: function (sStatus) {
                //     return sStatus === "ACTIVE" ? "Success" : "Error";
                // },
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
                            var flatUsers = []; // 👉 danh sách phẳng

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
                                // 👉 Đồng thời push vào danh sách phẳng 
                                flatUsers.push({
                                    EMAIL: item.EMAIL,
                                    USERNAME: item.USERNAME,
                                    USERNAME_CODE: item.USERNAME_CODE
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

                            // Flat user model 
                            var oAllUsersModel = new sap.ui.model.json.JSONModel({ results: flatUsers });
                            that.getOwnerComponent().setModel(oAllUsersModel, "AllUsersModel");
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
                            oODataModel.remove(sPath, {
                                success: function () {
                                    var oProductsModel = this.getView().getModel("ProductsModel");
                                    var aAllData = oProductsModel.getProperty("/productsData");
                                    var aNewAllData = aAllData.filter(function (item) {
                                        return item.JT_CODE !== sCode;
                                    });

                                    oProductsModel.setProperty("/productsData", aNewAllData);
                                    oProductsModel.setProperty("/currentData", aNewAllData); // cập nhật luôn currentData

                                    var iPageSize = oProductsModel.getProperty("/noOfTableRows");
                                    var newTotalPages = Math.ceil(aNewAllData.length / iPageSize);
                                    oProductsModel.setProperty("/totalPages", newTotalPages);

                                    // Nếu page hiện tại > tổng số trang mới thì lùi về trang cuối
                                    var iPage = oProductsModel.getProperty("/page");
                                    if (iPage > newTotalPages) {
                                        iPage = newTotalPages;
                                    }

                                    // Nếu không còn dữ liệu nào thì reset về trang đầu
                                    if (newTotalPages === 0) {
                                        iPage = 1;
                                    }

                                    var iStart = (iPage - 1) * iPageSize;
                                    var iEnd = iStart + iPageSize;
                                    var aPageData = aNewAllData.slice(iStart, iEnd);

                                    oProductsModel.setProperty("/tableData", aPageData);
                                    oProductsModel.setProperty("/startIndex", iStart);
                                    oProductsModel.setProperty("/endIndex", iEnd - 1);
                                    oProductsModel.setProperty("/page", iPage);

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
                // var sStatus = oContext.getProperty("STATUS");
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
                        // this.byId("inputStatus").setSelectedKey(sStatus);
                        this.byId("inputNote").setValue(sNote);
                        this._oDialog.open();
                    }.bind(this));
                } else {
                    this.byId("inputCode").setValue(sCode);
                    this.byId("inputName").setValue(sName);
                    // this.byId("inputStatus").setSelectedKey(sStatus);
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
                // var sNewStatus = this.byId("inputStatus").getSelectedKey();
                var sNewNote = this.byId("inputNote").getValue();

                var oUpdatedData = {
                    JT_NAME: sNewName,
                    JT_CODE: sNewCode,
                    // STATUS: sNewStatus,
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
                // var sStatus = this.byId("createStatus").getSelectedKey();
                var sNote = this.byId("createNote").getValue().trim();

                if (!sCode || !sName ) {
                    // || !sStatus) {
                    MessageToast.show("Vui lòng nhập đầy đủ thông tin bắt buộc.");
                    return;
                }
                // if (sStatus !== "ACTIVE" && sStatus !== "INACTIVE") {
                //     MessageToast.show("Trạng thái không hợp lệ.");
                //     return;
                // }

                var aAllData = this.getView().getModel("ProductsModel").getProperty("/productsData") || [];
                var bExists = aAllData.some(function (oItem) {
                    return oItem.JT_CODE.toUpperCase() === sCode.toUpperCase();
                });
                if (bExists) {
                    MessageToast.show("Mã chức danh đã tồn tại.");
                    return;
                }

                oTable.setBusy(true);

                var oODataModel = this.getOwnerComponent().getModel("JobTitleModel"); // ODataModel
                var oNewData = {
                    NOTE: sNote,
                    // STATUS: sStatus,
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
                                oProductsModel.setProperty("/currentData", oData.results);

                                var noOfTableRows = oProductsModel.getProperty("/noOfTableRows");
                                var totalPages = Math.ceil(oData.results.length / noOfTableRows);
                                oProductsModel.setProperty("/totalPages", totalPages);

                                // Giữ nguyên trang hiện tại
                                var currentPage = oProductsModel.getProperty("/page") || 1;
                                var startIndex = (currentPage - 1) * noOfTableRows;
                                var endIndex = Math.min(startIndex + noOfTableRows, oData.results.length);
                                var newData = oData.results.slice(startIndex, endIndex);

                                this.fnSetTableData(newData, startIndex, endIndex - 1, currentPage);

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
            },

            onSendEmail: function () {
                var oTable = this.byId("emailTreeTable");
                var iSelected = oTable.getSelectedIndex();
                if (iSelected < 0) {
                    MessageToast.show("Vui lòng chọn một dòng để gửi email");
                    return;
                }

                var oCtx = oTable.getContextByIndex(iSelected);
                var oData = oCtx.getObject();

                if (!oData.EMAIL || !oData.USERNAME) {
                    MessageToast.show("Dòng được chọn phải có Email và Tên Cán Bộ");
                    return;
                }

                var oView = this.getView();

                // 👉 Lấy model tổng hợp đã tạo trong onInit 
                var oAllUserModel = this.getOwnerComponent().getModel("AllUsersModel");
                var aAllUsers = oAllUserModel.getProperty("/results");
                // 👉 Lọc bỏ người nhận chính 
                var aFilteredUsers = aAllUsers.filter(function (user) {
                    return user.EMAIL !== oData.EMAIL;
                });
                // 👉 Tạo model mới cho CC 
                var oUserModel = new sap.ui.model.json.JSONModel({
                    results: aFilteredUsers
                });
                oView.setModel(oUserModel, "UserModel");

                if (!this._oPreviewDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "freestyleui5fiori.freestyleui5fiori.view.fragment.PreviewEmailDialog",
                        controller: this
                    }).then(function (oDialog) {
                        this._oPreviewDialog = oDialog;
                        oView.addDependent(this._oPreviewDialog);
                        // 👉 Set busy ngay khi mở 
                        this._oPreviewDialog.setBusy(true);

                        // Load template list từ OData
                        var oModel = this.getOwnerComponent().getModel("UserEmailModel");
                        oModel.read("/EMAIL_TEMPLATESet", {
                            success: function (oData) {
                                var oTemplateModel = new sap.ui.model.json.JSONModel(oData);
                                oView.setModel(oTemplateModel, "TemplateModel");

                                // 👉 Mặc định chọn dòng đầu tiên
                                if (oData.results && oData.results.length > 0) {
                                    var sFirstId = oData.results[0].TEMPLATE_ID;
                                    this.byId("templateSelect").setSelectedKey(sFirstId);

                                    // Nếu không phải CVMS thì ẩn và clear input
                                    if (sFirstId !== "CVMS") {
                                        this._resetCvmsInputs();
                                        this.byId("cvmsInputs").setVisible(false);
                                    } else {
                                        this.byId("cvmsInputs").setVisible(true);
                                    }
                                    this._oPreviewDialog.setBusy(false);
                                }
                            }.bind(this),
                            error: function () {
                                MessageToast.show("Không load được danh sách template");
                                this._oPreviewDialog.setBusy(false);
                            }.bind(this)
                        });

                        this._selectedEmailData = oData; // lưu lại dòng chọn
                        this.byId("toText").setText(oData.USERNAME + " <" + oData.EMAIL + ">");
                        this._oPreviewDialog.open();
                    }.bind(this));
                } else {
                    // 👉 Set busy ngay khi mở 
                    this._oPreviewDialog.setBusy(true);
                    // Nếu không phải CVMS thì ẩn và clear input
                    if (this.byId("templateSelect").getSelectedKey() !== "CVMS") {
                        this._resetCvmsInputs();
                        this.byId("cvmsInputs").setVisible(false);
                    } else {
                        this.byId("cvmsInputs").setVisible(true);
                    }
                    this._selectedEmailData = oData;
                    this.byId("toText").setText(oData.USERNAME + " <" + oData.EMAIL + ">");
                    this._oPreviewDialog.open();
                    this._oPreviewDialog.setBusy(false);
                }

            },

            onConfirmSendMail: function () {
                var sTemplateId = this.byId("templateSelect").getSelectedKey();
                var aCcItems = this.byId("ccSelect").getSelectedKeys();
                var oModel = this.getOwnerComponent().getModel("UserEmailModel");

                // 👉 Lấy thông tin TO từ biến đã lưu khi mở popup 
                var sEmailTo = this._selectedEmailData.EMAIL; var sNameTo = this._selectedEmailData.USERNAME;
                // 👉 Tạo string JSON đúng format 
                var sToString = `"to": [{ "email": "${sEmailTo}", "name": "${sNameTo}" }],`;

                // 👉 Lấy danh sách CC từ MultiComboBox
                var oCcSelect = this.byId("ccSelect");
                var aSelectedItems = oCcSelect.getSelectedItems();

                var aCcArray = aSelectedItems.map(function (oItem) {
                    return {
                        email: oItem.getKey(),
                        name: oItem.getText()
                    };
                });

                // 👉 Tạo string JSON cho CC
                var sCcString = "";
                if (aCcArray.length > 0) {
                    sCcString = `"cc": [` + aCcArray.map(function (cc) {
                        return `{ "email": "${cc.email}", "name": "${cc.name}" }`;
                    }).join(",") + `],`;
                }

                var params = {
                    TEMPLATE_ID: sTemplateId,
                    EMAIL_TO: sToString,
                    EMAIL_CC: sCcString,
                    MATERIAL_DOC_LOW: "",
                    MATERIAL_DOC_HIGH: "",
                    POSTING_DATE_LOW: "",
                    POSTING_DATE_HIGH: "",
                    MODE: "SEND"
                };

                if (sTemplateId === "CVMS") {
                    var sPostingDateFrom = this.byId("postingDateFrom").getValue();
                    var sPostingDateTo = this.byId("postingDateTo").getValue();
                    var sMaterialDocFrom = this.byId("materialDocFrom").getValue();
                    var sMaterialDocTo = this.byId("materialDocTo").getValue();

                    // 👉 Validate bắt buộc
                    if (!sPostingDateFrom) {
                        MessageToast.show("Vui lòng nhập Posting Date From");
                        return;
                    }
                    if (!sPostingDateTo) {
                        MessageToast.show("Vui lòng nhập Posting Date To");
                        return;
                    }
                    if (!sMaterialDocFrom) {
                        MessageToast.show("Vui lòng nhập Material Document From");
                        return;
                    }
                    if (!sMaterialDocTo) {
                        MessageToast.show("Vui lòng nhập Material Document To");
                        return;
                    }

                    // 👉 Validate định dạng ngày
                    if (!this._isValidDate(sPostingDateFrom) || !this._isValidDate(sPostingDateTo)) {
                        MessageToast.show("Ngày nhập không đúng định dạng");
                        return;
                    }

                    // 👉 Validate material chỉ được nhập số
                    if (!this._isNumeric(sMaterialDocFrom) || !this._isNumeric(sMaterialDocTo)) {
                        MessageToast.show("Material Document chỉ được nhập số");
                        return;
                    }

                    // 👉 Format ngày thành yyyymmdd
                    params.POSTING_DATE_LOW = this._formatDateToYYYYMMDD(sPostingDateFrom);
                    params.POSTING_DATE_HIGH = this._formatDateToYYYYMMDD(sPostingDateTo);

                    params.MATERIAL_DOC_LOW = sMaterialDocFrom;
                    params.MATERIAL_DOC_HIGH = sMaterialDocTo;
                }
                this._oPreviewDialog.setBusy(true);
                oModel.callFunction("/SEND_MAIL_FUNCTION", {
                    method: "POST",
                    urlParameters: params,
                    success: function (oResponse) {
                        if (oResponse.MESSAGE === "FAIL") {
                            MessageToast.show("Gửi thất bại");
                            this._oPreviewDialog.setBusy(false);
                        } else if (oResponse.MESSAGE === "SUCCESS") {
                            MessageToast.show("Gửi thành công");
                            this._oPreviewDialog.setBusy(false);
                        }
                    }.bind(this),
                    error: function () {
                        sap.m.MessageToast.show("Có lỗi khi gửi email");
                        this._oPreviewDialog.setBusy(false);
                    }.bind(this)
                });
            },

            onPreviewMail: function () {
                var sTemplateId = this.byId("templateSelect").getSelectedKey();
                var aCcItems = this.byId("ccSelect").getSelectedKeys();
                var oModel = this.getOwnerComponent().getModel("UserEmailModel");

                var params = {
                    TEMPLATE_ID: sTemplateId,
                    EMAIL_TO: "null",
                    EMAIL_CC: "null",
                    MATERIAL_DOC_LOW: "",
                    MATERIAL_DOC_HIGH: "",
                    POSTING_DATE_LOW: "",
                    POSTING_DATE_HIGH: "",
                    MODE: "SHOW"
                };

                if (sTemplateId === "CVMS") {
                    var sPostingDateFrom = this.byId("postingDateFrom").getValue();
                    var sPostingDateTo = this.byId("postingDateTo").getValue();
                    var sMaterialDocFrom = this.byId("materialDocFrom").getValue();
                    var sMaterialDocTo = this.byId("materialDocTo").getValue();

                    // 👉 Validate bắt buộc
                    if (!sPostingDateFrom) {
                        MessageToast.show("Vui lòng nhập Posting Date From");
                        return;
                    }
                    if (!sPostingDateTo) {
                        MessageToast.show("Vui lòng nhập Posting Date To");
                        return;
                    }
                    if (!sMaterialDocFrom) {
                        MessageToast.show("Vui lòng nhập Material Document From");
                        return;
                    }
                    if (!sMaterialDocTo) {
                        MessageToast.show("Vui lòng nhập Material Document To");
                        return;
                    }

                    // 👉 Validate định dạng ngày
                    if (!this._isValidDate(sPostingDateFrom) || !this._isValidDate(sPostingDateTo)) {
                        MessageToast.show("Ngày nhập không đúng định dạng");
                        return;
                    }

                    // 👉 Validate material chỉ được nhập số
                    if (!this._isNumeric(sMaterialDocFrom) || !this._isNumeric(sMaterialDocTo)) {
                        MessageToast.show("Material Document chỉ được nhập số");
                        return;
                    }

                    var oDateFrom = new Date(sPostingDateFrom);
                    var oDateTo = new Date(sPostingDateTo);

                    if (oDateFrom.getTime() > oDateTo.getTime()) {
                        MessageToast.show("Posting Date From phải trước ngày Posting Date To");
                        return;
                    }
                    if (sMaterialDocFrom > sMaterialDocTo) {
                        MessageToast.show("Material Document From phải nhỏ hơn Material Document To");
                        return;
                    }

                    // 👉 Format ngày thành yyyymmdd
                    params.POSTING_DATE_LOW = this._formatDateToYYYYMMDD(sPostingDateFrom);
                    params.POSTING_DATE_HIGH = this._formatDateToYYYYMMDD(sPostingDateTo);

                    params.MATERIAL_DOC_LOW = sMaterialDocFrom;
                    params.MATERIAL_DOC_HIGH = sMaterialDocTo;
                }
                this._oPreviewDialog.setBusy(true);
                oModel.callFunction("/SEND_MAIL_FUNCTION", {
                    method: "POST",
                    urlParameters: params,
                    success: function (oResponse) {
                        if (oResponse.MESSAGE === "NODATA") {
                            MessageToast.show("Không có data");
                            this.byId("htmlPreview").setContent("");
                            this.byId("btnSend").setEnabled(false);
                            this._oPreviewDialog.setBusy(false);
                        } else if (oResponse.MESSAGE === "SUCCESS") {
                            console.log(oResponse.HTML_CONTENT.replace(/"/g, '&quot;'));
                            var sHtml = `<iframe srcdoc="${oResponse.HTML_CONTENT.replace(/"/g, '&quot;')}" 
                     width="100%" height="550px" style="border:none;"></iframe>`;
                            this.byId("htmlPreview").setContent("");
                            this.byId("htmlPreview").setContent(sHtml);

                            // Chỉ enable nút gửi khi đã load HTML thành công
                            this.byId("btnSend").setEnabled(true);
                            this._oPreviewDialog.setBusy(false);
                        } else if (oResponse.MESSAGE === "OTHER") {
                            MessageToast.show("Lỗi Không Xác Định");
                            this.byId("htmlPreview").setContent("");
                            this.byId("btnSend").setEnabled(false);
                            this._oPreviewDialog.setBusy(false);
                        }
                    }.bind(this),
                    error: function () {
                        sap.m.MessageToast.show("Có lỗi khi preview email");
                        this.byId("htmlPreview").setContent("");
                        this.byId("btnSend").setEnabled(false);
                        this._oPreviewDialog.setBusy(false);
                    }.bind(this)
                });
            },

            _formatDateToYYYYMMDD: function (sDate) {
                if (!sDate) return "";
                var oDate = new Date(sDate);
                var yyyy = oDate.getFullYear().toString();
                var mm = (oDate.getMonth() + 1).toString().padStart(2, '0');
                var dd = oDate.getDate().toString().padStart(2, '0');
                return yyyy + mm + dd;
            },
            _isValidDate: function (sDate) {
                if (!sDate) return false;
                // DatePicker thường trả về chuỗi theo định dạng locale, ta thử parse
                var oDate = new Date(sDate);
                return !isNaN(oDate.getTime()); // nếu parse được thì hợp lệ
            },
            _isNumeric: function (sValue) {
                return /^\d+$/.test(sValue); // chỉ chấp nhận ký tự số
            },


            onCancelPreview: function () {
                // Đóng popup
                this._oPreviewDialog.close();

                // Reset thông tin người nhận
                this.byId("toText").setText("");

                // Reset dropdown template
                this.byId("templateSelect").setSelectedKey(null);

                // Reset CC
                this.byId("ccSelect").removeAllSelectedItems();

                // Reset các input CVMS
                this._resetCvmsInputs();
                this.byId("cvmsInputs").setVisible(false);

                // Reset message và preview HTML
                this.byId("messageText").setVisible(false);
                this.byId("messageText").setText("");
                this.byId("htmlPreview").setContent("");

                // Disable nút gửi mail
                this.byId("btnSend").setEnabled(false);

                // Clear biến lưu dữ liệu dòng chọn
                this._selectedEmailData = null;
            },

            onTemplateChange: function (oEvent) {
                var sKey = oEvent.getParameter("selectedItem").getKey();
                var oCvmsBox = this.byId("cvmsInputs");

                if (sKey === "CVMS") {
                    oCvmsBox.setVisible(true);
                } else {
                    oCvmsBox.setVisible(false);
                }

                // Khi đổi template, cần disable nút gửi cho đến khi preview lại
                this.byId("btnSend").setEnabled(false);
                this.byId("htmlPreview").setContent("");
                this.byId("messageText").setVisible(false);
            },

            _resetCvmsInputs: function () {
                this.byId("postingDateFrom").setValue("");
                this.byId("postingDateTo").setValue("");
                this.byId("materialDocFrom").setValue("");
                this.byId("materialDocTo").setValue("");
            },
            onPostingDateChange: function () {
                this.byId("btnSend").setEnabled(false);
                this.byId("htmlPreview").setContent("");
            },
            onMaterialDocChange: function () {
                this.byId("btnSend").setEnabled(false);
                this.byId("htmlPreview").setContent("");
            },

            onMaterialDocFromValueHelp: function (oEvent) {
                var oInput = oEvent.getSource();
                var aAllItems = this.getView().getModel("MaterialDocModel").getProperty("/results") || [];

                if (!this._oMatDocFromDlg) {
                    var oList = new sap.m.List({
                        mode: "SingleSelectMaster",
                        items: {
                            path: "/items",
                            template: new sap.m.StandardListItem({ title: "{BELNR}" })
                        },
                        select: function (oEvt) {
                            var sSelected = oEvt.getParameter("listItem").getTitle();
                            oInput.setValue(sSelected);
                            this._oMatDocFromDlg.close();
                        }.bind(this)
                    });

                    var oSearch = new sap.m.SearchField({
                        placeholder: "Nhập chuỗi cần tìm (ví dụ: 50, 00)...",
                        search: function (oEvt) {
                            var q = (oEvt.getParameter("query") || "").trim();
                            var aFiltered = q
                                ? aAllItems.filter(function (item) {
                                    return String(item.BELNR || "").trim().includes(q);
                                })
                                : [];
                            oList.setModel(new sap.ui.model.json.JSONModel({ items: aFiltered }));
                        }
                    });

                    this._oMatDocFromDlg = new sap.m.Dialog({
                        title: "Tìm Material Document From",
                        contentWidth: "500px",
                        contentHeight: "400px",
                        content: [oSearch, oList],
                        endButton: new sap.m.Button({
                            text: "Đóng",
                            press: function () { this._oMatDocFromDlg.close(); }.bind(this)
                        }),
                        afterClose: function () {
                            // Optional: clear list data each close
                            oList.setModel(new sap.ui.model.json.JSONModel({ items: [] }));
                        }
                    });

                    // Khởi tạo list rỗng
                    oList.setModel(new sap.ui.model.json.JSONModel({ items: [] }));
                }

                this._oMatDocFromDlg.open();
            },

            onMaterialDocToValueHelp: function (oEvent) {
                var oInput = oEvent.getSource();
                var aAllItems = this.getView().getModel("MaterialDocModel").getProperty("/results") || [];

                if (!this._oMatDocToDlg) {
                    var oList = new sap.m.List({
                        mode: "SingleSelectMaster",
                        items: {
                            path: "/items",
                            template: new sap.m.StandardListItem({ title: "{BELNR}" })
                        },
                        select: function (oEvt) {
                            var sSelected = oEvt.getParameter("listItem").getTitle();
                            oInput.setValue(sSelected);
                            this._oMatDocToDlg.close();
                        }.bind(this)
                    });

                    var oSearch = new sap.m.SearchField({
                        placeholder: "Nhập chuỗi cần tìm (ví dụ: 50, 00)...",
                        search: function (oEvt) {
                            var q = (oEvt.getParameter("query") || "").trim();
                            var aFiltered = q
                                ? aAllItems.filter(function (item) {
                                    return String(item.BELNR || "").trim().includes(q);
                                })
                                : [];
                            oList.setModel(new sap.ui.model.json.JSONModel({ items: aFiltered }));
                        }
                    });

                    this._oMatDocToDlg = new sap.m.Dialog({
                        title: "Tìm Material Document To",
                        contentWidth: "500px",
                        contentHeight: "400px",
                        content: [oSearch, oList],
                        endButton: new sap.m.Button({
                            text: "Đóng",
                            press: function () { this._oMatDocToDlg.close(); }.bind(this)
                        }),
                        afterClose: function () {
                            // clear list data mỗi lần đóng
                            oList.setModel(new sap.ui.model.json.JSONModel({ items: [] }));
                        }
                    });

                    // Khởi tạo list rỗng
                    oList.setModel(new sap.ui.model.json.JSONModel({ items: [] }));
                }

                this._oMatDocToDlg.open();
            }

        });
    });
