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

                this._setDataTreeTable();
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
                var oModel = this.getOwnerComponent().getModel(); // luôn có default model
                var that = this; //Lưu this ra biến
                oModel.metadataLoaded().then(function () {
                    oModel.read("/User_EmailSet", {
                        success: function (oData) {
                            var groupedCompany = {};

                            oData.results.forEach(function (item) {
                                var company = item.Company_Code;
                                var jtCode = item.JT_CODE;
                                var jtName = item.JT_NAME;

                                // Tạo node công ty
                                if (!groupedCompany[company]) {
                                    groupedCompany[company] = {
                                        Company_Code: company,
                                        children: {}
                                    };
                                }

                                // Tạo node nhóm chức danh theo JT_CODE
                                if (!groupedCompany[company].children[jtCode]) {
                                    groupedCompany[company].children[jtCode] = {
                                        JT_CODE: jtCode,
                                        JT_NAME: jtName, // dùng để hiển thị
                                        children: []
                                    };
                                }

                                // Thêm email vào nhóm chức danh
                                groupedCompany[company].children[jtCode].children.push(item);
                            });

                            // Chuyển thành mảng nodes
                            var treeData = {
                                nodes: Object.values(groupedCompany).map(function (companyNode) {
                                    return {
                                        Company_Code: companyNode.Company_Code,
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

                // Nếu có nhóm chức danh → mở popup
                this._showTemplatePopup(sJTName, sJTCode);
            },

            _showTemplatePopup: function (sJTName, sJTCode) {
                var oHtmlContent_GD = new sap.ui.core.HTML({
                    content: `
                            <div style="padding:10px;">
                            <h2 style="color:red;">Template Email cho ${sJTName}</h2>
                            <p>Kính gửi Anh/Chị,</p>
                            <p>Báo cáo anh/chị kết quả đánh giá định kỳ Nhà cung cấp của công ty tại kỳ đánh giá 12 năm 2025 như sau:</p>
                            <h3 style="margin-top:20px;">Top 5 Nhà cung cấp có điểm xếp hạng cao</h3>
                            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                              <thead>
                                <tr style="background:#f1f1f1;">
                                  <th style="border:1px solid #ccc; padding:6px;">Xếp hạng</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Mã NCC</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Tên NCC</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Điểm đánh giá tổng thể</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Giá cả</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Chất lượng sản phẩm</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Thời gian giao hàng</th>
                                  <th style="border:1px solid #ccc; padding:6px;">.</th>
                                  <th style="border:1px solid #ccc; padding:6px;">.</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Nhóm hàng cung cấp</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style="border:1px solid #ccc; padding:6px;">1</td>
                                  <td style="border:1px solid #ccc; padding:6px;">0000200028</td>
                                  <td style="border:1px solid #ccc; padding:6px;">Công ty TNHH Bao Bì Thủy Tinh Vigla</td>
                                  <td style="border:1px solid #ccc; padding:6px;">100</td>
                                  <td style="border:1px solid #ccc; padding:6px;">99</td>
                                  <td style="border:1px solid #ccc; padding:6px;">100</td>
                                  <td style="border:1px solid #ccc; padding:6px;">100</td>
                                  <td style="border:1px solid #ccc; padding:6px;"></td>
                                  <td style="border:1px solid #ccc; padding:6px;"></td>
                                  <td style="border:1px solid #ccc; padding:6px;">Bao bì, đóng gói</td>
                                </tr>
                              </tbody>
                              </table>
                              <div/>
                              <h3 style="margin-top:20px;">Top 5 Nhà cung cấp có điểm xếp hạng thấp</h3>
                            <table style="width:100%; border-collapse:collapse; font-size:13px;">
                              <thead>
                                <tr style="background:#f1f1f1;">
                                  <th style="border:1px solid #ccc; padding:6px;">Xếp hạng</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Mã NCC</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Tên NCC</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Điểm đánh giá tổng thể</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Giá cả</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Chất lượng sản phẩm</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Thời gian giao hàng</th>
                                  <th style="border:1px solid #ccc; padding:6px;">.</th>
                                  <th style="border:1px solid #ccc; padding:6px;">.</th>
                                  <th style="border:1px solid #ccc; padding:6px;">Nhóm hàng cung cấp</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style="border:1px solid #ccc; padding:6px;">1</td>
                                  <td style="border:1px solid #ccc; padding:6px;">0000200028</td>
                                  <td style="border:1px solid #ccc; padding:6px;">Công ty TNHH Bao Bì Thủy Tinh Vigla</td>
                                  <td style="border:1px solid #ccc; padding:6px;">100</td>
                                  <td style="border:1px solid #ccc; padding:6px;">99</td>
                                  <td style="border:1px solid #ccc; padding:6px;">100</td>
                                  <td style="border:1px solid #ccc; padding:6px;">100</td>
                                  <td style="border:1px solid #ccc; padding:6px;"></td>
                                  <td style="border:1px solid #ccc; padding:6px;"></td>
                                  <td style="border:1px solid #ccc; padding:6px;">Bao bì, đóng gói</td>
                                </tr>
                              </tbody>
                            </table>
                            <div style="font-family:Arial, sans-serif; font-size:14px; color:#333; padding:10px;">
                                <p><em>*Đây là email tự động từ hệ thống. Anh/Chị vui lòng không reply lại email này.</em></p>
                                <p style="margin-top:20px;">Trân trọng,</p>
                                <p><strong>CTCP Bia-Rượu-NGK Hà Nội</strong></p>
                            </div>
                          </div>`
                });

                var oHtmlContent_TPKD = new sap.ui.core.HTML({
                    content: `<div style="padding:10px;">
                        <h2 style="color:red;">Template Email cho ${sJTName}</h2>
                        <p>Kính gửi Anh/Chị,</p>
                        <p>Báo cáo anh/chị kết quả đánh giá định kỳ Nhà cung cấp của công ty tại kỳ đánh giá 11 năm 2025 như sau:</p>
                        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:20px;">
                        <thead>
                        <tr>
                            <td colspan="10" style="border:1px solid #ccc; padding:8px; background:#eaeaea; font-weight:bold; text-align:left;">
                                Xếp hạng theo Giá cả
                            </td>
                        </tr>
                        <tr style="background:#f1f1f1;">
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Xếp hạng</th>
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Mã NCC</th>
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Tên NCC</th>
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Điểm Tiêu chí</th>
                          <th style="border:1px solid #ccc; padding:6px;" colspan="5">Trong đó</th>
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Nhóm hàng cung cấp</th>
                        </tr>
                        <tr style="background:#f9f9f9;">
                          <th style="border:1px solid #ccc; padding:6px;">Mức giá</th>
                          <th style="border:1px solid #ccc; padding:6px;">Chất lượng sản phẩm</th>
                          <th style="border:1px solid #ccc; padding:6px;">Thời gian giao hàng</th>
                          <th style="border:1px solid #ccc; padding:6px;">.</th>
                          <th style="border:1px solid #ccc; padding:6px;">.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="border:1px solid #ccc; padding:6px;">1</td>
                          <td style="border:1px solid #ccc; padding:6px;">0000200028</td>
                          <td style="border:1px solid #ccc; padding:6px;">Công ty TNHH Bao Bì Thủy Tinh Vigla</td>
                          <td style="border:1px solid #ccc; padding:6px;">100</td>
                          <td style="border:1px solid #ccc; padding:6px;">99</td>
                          <td style="border:1px solid #ccc; padding:6px;">100</td>
                          <td style="border:1px solid #ccc; padding:6px;">100</td>
                          <td style="border:1px solid #ccc; padding:6px;"></td>
                          <td style="border:1px solid #ccc; padding:6px;"></td>
                          <td style="border:1px solid #ccc; padding:6px;">Bao bì, đóng gói</td>
                        </tr>
                      </tbody>
                    </table>
                    <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:20px;">
                        <thead>
                        <tr>
                            <td colspan="10" style="border:1px solid #ccc; padding:8px; background:#eaeaea; font-weight:bold; text-align:left;">
                                Xếp hạng theo Chất lượng
                            </td>
                        </tr>
                        <tr style="background:#f1f1f1;">
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Xếp hạng</th>
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Mã NCC</th>
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Tên NCC</th>
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Điểm Tiêu chí</th>
                          <th style="border:1px solid #ccc; padding:6px;" colspan="5">Trong đó</th>
                          <th style="border:1px solid #ccc; padding:6px;" rowspan="2">Nhóm hàng cung cấp</th>
                        </tr>
                        <tr style="background:#f9f9f9;">
                          <th style="border:1px solid #ccc; padding:6px;">Mức giá</th>
                          <th style="border:1px solid #ccc; padding:6px;">Chất lượng sản phẩm</th>
                          <th style="border:1px solid #ccc; padding:6px;">Thời gian giao hàng</th>
                          <th style="border:1px solid #ccc; padding:6px;">.</th>
                          <th style="border:1px solid #ccc; padding:6px;">.</th>
                        </tr>
                      </thead>
                      <tbody>
                      </tbody>
                    </table>
                    <p>.</p>
                    <p>.</p>
                    <p>.</p>
                        <div style="font-family:Arial, sans-serif; font-size:14px; color:#333; padding:10px;">
                            <p><em>*Đây là email tự động từ hệ thống. Anh/Chị vui lòng không reply lại email này.</em></p>
                            <p style="margin-top:20px;">Trân trọng,</p>
                            <p><strong>CTCP Bia-Rượu-NGK Hà Nội</strong></p>
                        </div>
                      </div>`
                });
                if (sJTCode === "GD") {
                    var oDialog = new sap.m.Dialog({
                        title: "Template Email",
                        content: [oHtmlContent_GD],
                        endButton: new sap.m.Button({
                            text: "Đóng",
                            press: function () {
                                oDialog.close();
                            }
                        })
                    });
                    oDialog.open();

                } else if (sJTCode === "TPKD") {
                    var oDialog = new sap.m.Dialog({
                        title: "Template Email",
                        content: [oHtmlContent_TPKD],
                        endButton: new sap.m.Button({
                            text: "Đóng",
                            press: function () {
                                oDialog.close();
                            }
                        })
                    });
                    oDialog.open();
                }
            }
        });
    });
