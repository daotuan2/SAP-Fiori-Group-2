/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"freestyleui5fiori/freestyleui5fiori/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
