/**
 * 
 *	SP REST JSON, v. 1.1.0
 *
 *	by Daniel Desch <danieldesch@gmx.de>
 *
 *
 *	This Source Code Form is subject to the terms of the Mozilla Public
 *	License, v. 2.0. If a copy of the MPL was not distributed with this
 *	file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 *
*/
'use strict';
var RegExpOData = /odata=|odata.metadata=/i; // 'odata=' OR 'odata.metadata='	/i --> caseinsesitive
var strAcceptValue = '';
var iWindowId; // IMPORTANT: For open Global options tab out of tabOptions.js
var iCurrentTabId;
var objTabSettings = {};
var arrOptionsAccept = [
	'application/json;odata=verbose',
	'application/json;odata=minimalmetadata',
	'application/json;odata=nometadata'
];
var arrFilterURLs = [];
var arrDefaultFilterURLs = [
	'/_api/web/',
	'/_api/site/',
	'/_api/sp.',
	'/_api/search',
	'/_vti_bin/ListData.svc'
];
var arrFilterOptionsIndex = [];
var arrDefaultFilterOptionsIndex = [
	0,
	0,
	0,
	0,
	0
];

var xBrowser;
var browserName;
var objConnectedPort;
var publicToggleIcon;

if (typeof browser === 'undefined') {
	// If browser is not defined, the plugin was loaded into Google Chrome.
	// Set the xBrowser variable and the browserName accordingly.
	browserName = 'chrome';
	xBrowser = chrome;
} else if (window.MsInkCanvasContext !== undefined && typeof window.MsInkCanvasContext === 'function') {
	browserName = 'edge';
	xBrowser = browser;
} else {
	browserName = 'firefox';
	xBrowser = browser;
}
callXBrowserFunc(xBrowser.storage.sync.get, undefined, setValuesFromStorage, onError);

function setValuesFromStorage(res) {
	console.log('res:', res);
	if (res.arrOptionsAccept !== undefined) {
		arrOptionsAccept = res.arrOptionsAccept;
	}
	else {
		xBrowser.storage.sync.set({
			arrOptionsAccept: arrOptionsAccept
		});
	}
	if (res.arrFilterURLs !== undefined && res.arrFilterURLs.length > 0) {
		arrFilterURLs = res.arrFilterURLs;
		arrFilterOptionsIndex = res.arrFilterOptionsIndex;

		// Remove iOdataTab option per tab:
		var arrKeys = Object.keys(objTabSettings);
		for (var i = 0; i < arrKeys.length; i++) {
			if (objTabSettings[arrKeys[i]].iOdataTab !== undefined) {
				delete objTabSettings[arrKeys[i]].iOdataTab;
			}
		}
	}
	else {
		setDefaultGlobalOptions();
	}
	xBrowser.runtime.onConnect.addListener(connected);

	// Add rewriteRequestAcceptHeader as a listener to onBeforeSendHeaders
	// Make it "blocking" so we can modify the headers.
	xBrowser.webRequest.onBeforeSendHeaders.addListener(
		rewriteRequestAcceptHeader,
		{
			urls: ['<all_urls>']
		},
		["blocking", "requestHeaders"]
	);

	// listen to NEW tabs (empty and opened from bookmarks)
	xBrowser.tabs.onCreated.addListener(function (tab) {
		iWindowId = tab.windowid;
		var strURL = tab.url;
		createObjTab(tab.id, strURL);
		if (tab.active) {
			iCurrentTabId = tab.id;
			updateIcon(iCurrentTabId);
		}
	});

	// listen to tab URL changes
	xBrowser.tabs.onUpdated.addListener(function (iTabId, changeInfo, tab) {
		if (changeInfo.status === 'complete') {
			var strURL = tab.url;
			iWindowId = tab.windowid;
			if (tab.active) {
				iCurrentTabId = iTabId;
			}
			if (objTabSettings[iCurrentTabId] === undefined) {
				createObjTab(iCurrentTabId, strURL);
			}
			if (tab.active) {
				updateObjTabSettingsURL(iCurrentTabId, strURL);
				updateIcon(iCurrentTabId);
			}
		}
	});

	// listen to tab switching
	xBrowser.tabs.onActivated.addListener(
		function (ev) {
			console.log(ev);
			iWindowId = ev.windowId;
			iCurrentTabId = ev.tabId;
			var strURL = '';
			if (objTabSettings[iCurrentTabId] === undefined) {
				createObjTab(iCurrentTabId, strURL);
			}
			callXBrowserFunc(xBrowser.tabs.get, iCurrentTabId, prepareUpdateTabURL, onError);
		}
	);

	xBrowser.tabs.onRemoved.addListener(
		function (iTabRemovedId) {
			console.log('xBrowser.tabs.onRemoved Tab Id: ' + iTabRemovedId);
			delete objTabSettings[iTabRemovedId];
		}
	);

	// For installation:
	callXBrowserFunc(xBrowser.tabs.query, { active: true, currentWindow: true }, initialiseSettingsForInstallingTab, onError);
}

function initialiseSettingsForInstallingTab(activeTab) {
	// activeTab is the array of the active tabs
	if (activeTab !== undefined && activeTab.length > 0) {
		iCurrentTabId = activeTab[0].id;
		var strURL = activeTab[0].url;
		createObjTab(iCurrentTabId, strURL);
	}
}

function createObjTab(iTabId, strURL) {
	// console.log('createObjTab', objTabSettings);
	if (iTabId !== -1) {
		objTabSettings[iTabId] = {};
		objTabSettings[iTabId].bUSE = true;
		objTabSettings[iTabId].bTabXorGlobal = false; // true --> Tab Option, false --> Global Option
		updateObjTabSettingsURL(iTabId, strURL);
	}
	if (Object.keys(objTabSettings).length === 1) {
		updateIcon(iTabId);
	}
}

function updateIcon(iTabId) {
	if (iTabId !== undefined && iTabId > -1) {
		// console.log(iTabId);
		var strTooltip = 'SP REST JSON\n\n';
		var objTab = objTabSettings[iTabId];
		if (objTab.strMatchedURL !== '') {
			if (objTab.bUSE) {
				// var objTab = objTabSettings[activeTab[0].id];
				if (xBrowser.browserAction.setIcon) {
					setCrossBrowserIcon('active');
				}
				if (xBrowser.browserAction.enable) {
					strTooltip += 'Global matched URL: ' + objTab.strMatchedURL
					var iFilterURL = -1;
					iFilterURL = arrFilterURLs.findIndex(function (filterURL) {
						return objTab.strMatchedURL.toLowerCase().indexOf(filterURL.toLowerCase()) > -1;
					});
					strTooltip += '\nGlobal Accept header: ' + arrOptionsAccept[arrFilterOptionsIndex[iFilterURL]];
					strTooltip += '\nTab Accept header: ' + arrOptionsAccept[objTab.iOdataTab];
					var strOption = objTab.bTabXorGlobal ? 'Tab' : 'Global';
					strTooltip += '\nUsed option: ' + strOption;
				}
			}
			else {
				if (xBrowser.browserAction.setIcon) {
					setCrossBrowserIcon('disabled');
					strTooltip += 'disabled';
				}
			}
			xBrowser.browserAction.setTitle({
				title: strTooltip
			});
		}
		else {
			if (xBrowser.browserAction.setIcon) {
				setCrossBrowserIcon('inactive');
			}
			if (!xBrowser.browserAction.enable) {
				// MOBILE
				strTooltip = 'SP REST JSON\n\n';
			}
			else {
				// DESKTOP
				strTooltip += 'Only active when a SharePoint REST API URL is loaded';
			}
			xBrowser.browserAction.setTitle({
				title: strTooltip
			});
		}
	}	
}

function connected(objPort) {
	objConnectedPort = objPort;
	if (objConnectedPort.name === 'portTabOptions') {
		objConnectedPort.postMessage({
			arrOptionsAccept: arrOptionsAccept
			, arrFilterURLs: arrFilterURLs
			, arrFilterOptionsIndex: arrFilterOptionsIndex
			, iWindowId: iWindowId
			, TabSettings: objTabSettings[iCurrentTabId]
		});
		objConnectedPort.onMessage.addListener(function (objMessage) {
			if (objMessage.bUSE !== undefined) {
				objTabSettings[iCurrentTabId].bUSE = objMessage.bUSE;
			}
			if (objMessage.iOdataTab !== undefined) {
				objTabSettings[iCurrentTabId].iOdataTab = objMessage.iOdataTab;
			}
			if (objMessage.bTabXorGlobal !== undefined) {
				objTabSettings[iCurrentTabId].bTabXorGlobal = objMessage.bTabXorGlobal;
			}
			if (objMessage.bReload) {
				xBrowser.tabs.reload(iCurrentTabId, { bypassCache: true });
			}
			updateIcon();
		});
	}
	else if (objConnectedPort.name === 'portGlobalOptions') {
		objConnectedPort.onMessage.addListener(function (objMessage) {
			if (objMessage.reloadFromStorage !== undefined && objMessage.reloadFromStorage === true) {	
				callXBrowserFunc(xBrowser.storage.sync.get, undefined, setValuesFromStorage, onError);
			} else if (objMessage.setDefaultOptions !== undefined && objMessage.setDefaultOptions === true) {
				setDefaultGlobalOptions();
			}
		});
	}
}

function setCrossBrowserIcon(strFileName) {
	if (browserName === 'edge') {
		xBrowser.browserAction.setIcon({
			path: {
				19: 'icons/16/' + strFileName + '.png'
				,38: 'icons/32/' + strFileName + '.png'
			}
		});
	} else {
		xBrowser.browserAction.setIcon({
			path: {
				16: 'icons/16/' + strFileName + '.png'
				,32: 'icons/32/' + strFileName + '.png'
				,48: 'icons/48/' + strFileName + '.png'
				,64: 'icons/64/' + strFileName + '.png'
				,128: 'icons/128/' + strFileName + '.png'
			}
		});
	}
}

function setDefaultGlobalOptions() {
	xBrowser.storage.sync.set({
		arrFilterURLs: arrDefaultFilterURLs
		, arrFilterOptionsIndex: arrDefaultFilterOptionsIndex
	}, function () {
		if (objConnectedPort !== undefined && objConnectedPort.name === 'portGlobalOptions') {
			objConnectedPort.postMessage({
				reloadOptions: true
			});
		}
	});
}

function onError(error) {
	console.log('Error: ' + error);
}

function prepareUpdateTabURL(activeTab) {
	// console.log(activeTab);
	if (activeTab !== undefined) {
		updateObjTabSettingsURL(activeTab.id, activeTab.url);
		// console.log(objTabSettings[iCurrentTabId]);
		updateIcon(iCurrentTabId);
	}
}

function updateObjTabSettingsURL(iTabId, strURL) {
	var iFilterURL = -1;
	iFilterURL = arrFilterURLs.findIndex(function (filterURL) {
		return strURL.toLowerCase().indexOf(filterURL.toLowerCase()) > -1;
	});
	if (iFilterURL > -1) {
		objTabSettings[iTabId].strMatchedURL = arrFilterURLs[iFilterURL];
		if (objTabSettings[iTabId].bTabXorGlobal === false) {
			objTabSettings[iTabId].iOdataTab = arrFilterOptionsIndex[iFilterURL];
		}
	} else {
		objTabSettings[iTabId].strMatchedURL = '';
		objTabSettings[iTabId].iOdataTab = 0;
	}
	// console.log('objTabSettings[iTabId].strMatchedURL: ' + objTabSettings[iTabId].strMatchedURL);
}

function callXBrowserFunc(objFunc, param, fnSuccess, fnError) {
	if (browserName !== 'firefox') {
		if (param === undefined) {
			objFunc(fnSuccess);
		} else {
			objFunc(param, fnSuccess);
		}
	}
	else {
		if (param === undefined) {
			objFunc().then(fnSuccess, fnError);
		} else {
			objFunc(param).then(fnSuccess, fnError);
		}
	}
}

// Rewrite the Accept header if needed...
function rewriteRequestAcceptHeader(ev) {
	var iTabIdEvent = ev.tabId;

	if (ev.type === 'main_frame') {
		console.log('rewriteRequestAcceptHeader | main_frame | Tab Id: ' + ev.tabId, ev.url);
		// Prevent crash while reloading / installing Add-on
		if (ev.url) {
			var strEventURL = ev.url;
			if (objTabSettings[iTabIdEvent] === undefined) {
				createObjTab(iTabIdEvent, strEventURL);
			} else {
				updateObjTabSettingsURL(iTabIdEvent, strEventURL);
			}
			if (objTabSettings[iTabIdEvent].strMatchedURL !== '' && objTabSettings[iTabIdEvent].bUSE) {
				if (objTabSettings[iTabIdEvent].bTabXorGlobal === true) {
					strAcceptValue = arrOptionsAccept[objTabSettings[iTabIdEvent].iOdataTab];
					console.log('TAB', strAcceptValue);
				}
				else {
					strAcceptValue = arrOptionsAccept[objTabSettings[iTabIdEvent].iOdataTab];
					console.log('GLOBAL', strAcceptValue);
				}
				if (objTabSettings[iTabIdEvent].bUSE) {
					var bAccept = false;
					for (var header of ev.requestHeaders) {
						if (header.name.toLowerCase() === 'accept') {
							bAccept = true;
							var strValue = header.value.toLowerCase();
							if (strValue.indexOf('application/json') > -1) {
								if (RegExpOData.test(strValue) === false) {
									header.value = strAcceptValue;
								}
							}
							else {
								header.value = strAcceptValue;
							}
						}
					}
					if (!bAccept) {
						ev.requestHeaders.push({ name: 'Accept', value: strAcceptValue });
					}
				}
			}
		}
	}
	if (iCurrentTabId === iTabIdEvent) {
		updateIcon();
	}
	return { requestHeaders: ev.requestHeaders };
}