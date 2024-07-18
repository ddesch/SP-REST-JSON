/**
 * 
 *	SP REST JSON, v. 1.6.0
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
	'application/json;odata=nometadata',
	'text/xml'
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
var fontSize = 11;

var xBrowser;
var browserName;
var objConnectedPort;
var publicToggleIcon;

if (typeof browser === 'undefined') {
	// browser is undefined in Google Chrome
	browserName = 'chrome';
	xBrowser = chrome;
} else if (window.MsInkCanvasContext !== undefined && typeof window.MsInkCanvasContext === 'function') {
	browserName = 'edge';
	xBrowser = browser;
} else {
	browserName = 'firefox';
	xBrowser = browser;
}

xBrowser.runtime.onInstalled.addListener(function(details) {
	console.log(details);
	if (details.reason === 'install') {
		setDefaultGlobalOptions();
    } else if (details.rease === 'update') {
		console.log('UPDATE');
		xBrowser.storage.sync.set({
			arrOptionsAccept: arrOptionsAccept
		});
	}
});

callXBrowserFunc(xBrowser.storage.sync, 'get', null, setValuesFromStorage, onError);

function setValuesFromStorage(res) {
	console.log('res:', res);
	if (res.arrFilterURLs !== undefined && res.arrFilterURLs.length > 0) {
		arrFilterURLs = res.arrFilterURLs;
		arrFilterOptionsIndex = res.arrFilterOptionsIndex;
	} else {
		arrFilterURLs = arrDefaultFilterURLs;
		arrFilterOptionsIndex = arrDefaultFilterOptionsIndex;
	}
	if (res.fontSize !== undefined) {
		fontSize = res.fontSize;
	}
	xBrowser.runtime.onConnect.addListener(connected);

	// Needed to update the iCurrentTabId in Firefox >= 128
	function fnOnBeforeRequest(requestDetails) {
		console.log('fnOnBeforeRequest requestDetails');
		// console.log(requestDetails);
		if (requestDetails.tabId !== -1) {
			iCurrentTabId = requestDetails.tabId;
		}
	}

	xBrowser.webRequest.onBeforeRequest.addListener(
		fnOnBeforeRequest,
		{
			urls: ['<all_urls>'],
			types: ['main_frame']
		}
	);


	// For changing the Request header
	xBrowser.webRequest.onBeforeSendHeaders.addListener(
		rewriteRequestAcceptHeader,
		{
			urls: ['<all_urls>'],
			types: ['main_frame']
		},
		["blocking", "requestHeaders"]
	);

	// For changing the Response header
	xBrowser.webRequest.onHeadersReceived.addListener(
		changeResponseHeaders,
		{
			urls: ['<all_urls>'],
			types: ['main_frame']
		},
		["blocking", "responseHeaders"]
	);

	function changeResponseHeaders(ev) {
		// var iTabIdEvent = ev.tabId;
		// IMPORTANT for Firefox >= 128
		// if the tabId of the event is -1 set the global iCurrentTabId to iTabIdEvent
		const iTabIdEvent = ev.tabId === -1? iCurrentTabId : ev.tabId;
		console.log('changeResponseHeaders main_frame', ev);
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
				if(strAcceptValue === 'text/xml') {
					setHeader(ev.responseHeaders, 'Content-Type', 'text/xml');
				}
			}
		}
		return { responseHeaders: ev.responseHeaders };
	}


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
		console.log(`xBrowser.tabs.onUpdated status: ${changeInfo.status} | iTabId: ${iTabId}`); // CRASHES in EDGE??
		//console.log(xBrowser.tabs.onUpdated); // Ok in EDGE???
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

				if (objTabSettings[iCurrentTabId].strMatchedURL !== '' && objTabSettings[iCurrentTabId].bUSE) {
					if (objTabSettings[iCurrentTabId].bTabXorGlobal === true) {
						strAcceptValue = arrOptionsAccept[objTabSettings[iCurrentTabId].iOdataTab];
						console.log('TAB', strAcceptValue);
					}
					else {
						strAcceptValue = arrOptionsAccept[objTabSettings[iCurrentTabId].iOdataTab];
						console.log('GLOBAL', strAcceptValue);
					}
					updatePageContent(iCurrentTabId);
				}
			}
		}
	});

	// listen to tab switching
	xBrowser.tabs.onActivated.addListener(
		function (ev) {
			console.log(`xBrowser.tabs.onActivated.addListener ev.windowId: ${ev.windowId} | ev.tabId: ${ev.tabId}`);
			iWindowId = ev.windowId;
			iCurrentTabId = ev.tabId;
			var strURL = '';
			if (objTabSettings[iCurrentTabId] === undefined) {
				createObjTab(iCurrentTabId, strURL);
			}
			callXBrowserFunc(xBrowser.tabs, 'get', iCurrentTabId, prepareUpdateTabURL, onError);
		}
	);

	xBrowser.tabs.onRemoved.addListener(
		function (iTabRemovedId) {
			console.log('xBrowser.tabs.onRemoved Tab Id: ' + iTabRemovedId);
			delete objTabSettings[iTabRemovedId];
		}
	);

	// For installation:
	callXBrowserFunc(xBrowser.tabs, 'query', { active: true, currentWindow: true }, initialiseSettingsForInstallingTab, onError);
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
	console.log('createObjTab', objTabSettings);
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
		console.log(iTabId);
		var strTooltip = 'SP REST JSON\n\n';
		var objTab = objTabSettings[iTabId];
		if (objTab.strMatchedURL !== '') {
			if (objTab.bUSE) {
				// var objTab = objTabSettings[activeTab[0].id];
				if (xBrowser.action.setIcon) {
					setCrossBrowserIcon('active');
				}
				if (xBrowser.action.enable) {
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
				if (xBrowser.action.setIcon) {
					setCrossBrowserIcon('disabled');
					strTooltip += 'disabled';
				}
			}
			xBrowser.action.setTitle({
				title: strTooltip
			});
		}
		else {
			if (xBrowser.action.setIcon) {
				setCrossBrowserIcon('inactive');
			}
			if (!xBrowser.action.enable) {
				// MOBILE
				strTooltip = 'SP REST JSON\n\n';
			}
			else {
				// DESKTOP
				strTooltip += 'Only active when a SharePoint REST API URL is loaded';
			}
			xBrowser.action.setTitle({
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
			updateIcon(iCurrentTabId);
		});
	}
	else if (objConnectedPort.name === 'portGlobalOptions') {
		objConnectedPort.onMessage.addListener(function (objMessage) {
			if (objMessage.reloadFromStorage !== undefined && objMessage.reloadFromStorage === true) {	
				callXBrowserFunc(xBrowser.storage.sync, 'get', undefined, setValuesFromStorage, onError);
			} else if (objMessage.setDefaultOptions !== undefined && objMessage.setDefaultOptions === true) {
				setDefaultGlobalOptions();
			}
		});
	}
}

function setCrossBrowserIcon(strFileName) {
	if (browserName === 'edge') {
		xBrowser.action.setIcon({
			path: {
				19: 'icons/16/' + strFileName + '.png'
				,38: 'icons/32/' + strFileName + '.png'
			}
		});
	} else {
		xBrowser.action.setIcon({
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
	callXBrowserFunc(
		xBrowser.storage.sync,
		'set',
		{
			arrFilterURLs: arrDefaultFilterURLs,
			arrOptionsAccept: arrOptionsAccept,
			arrFilterOptionsIndex: arrDefaultFilterOptionsIndex
		},
		function() {
			var arrKeys = Object.keys(objTabSettings);
			for (var i = 0; i < arrKeys.length; i++) {
				var objTabConfig = objTabSettings[arrKeys[i]];
				if (objTabConfig.iOdataTab !== undefined && objTabConfig.bTabXorGlobal === false) {
					objTabConfig.iOdataTab = 0;
				}
			}
			console.log('setDefaultGlobalOptions result function');
			if (objConnectedPort !== undefined && objConnectedPort.name === 'portGlobalOptions') {
				objConnectedPort.postMessage({
					reloadOptions: true
				});
			}
		},
		onError
	);
}

function onError(error) {
	console.error('Error: ' + error);
}

function prepareUpdateTabURL(activeTab) {
	console.log(activeTab);
	console.info(activeTab);
	if (activeTab !== undefined) {
		updateObjTabSettingsURL(activeTab.id, activeTab.url);
		console.log(objTabSettings[iCurrentTabId]);
		updateIcon(iCurrentTabId);

		if (objTabSettings[iCurrentTabId].strMatchedURL !== '' && objTabSettings[iCurrentTabId].bUSE) {
			if (objTabSettings[iCurrentTabId].bTabXorGlobal === true) {
				strAcceptValue = arrOptionsAccept[objTabSettings[iCurrentTabId].iOdataTab];
				console.log('TAB', strAcceptValue);
			}
			else {
				strAcceptValue = arrOptionsAccept[objTabSettings[iCurrentTabId].iOdataTab];
				console.log('GLOBAL', strAcceptValue);
			}
			updatePageContent(iCurrentTabId);
		}
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
	}
	console.log('objTabSettings[iTabId].strMatchedURL: ' + objTabSettings[iTabId].strMatchedURL);
}

function callXBrowserFunc(objBrowserProp, strBrowserFunc, param, fnSuccess, fnError) {
	if (browserName !== 'firefox') {
		if (param === undefined) {
			objBrowserProp[strBrowserFunc](fnSuccess);
		} else {
			objBrowserProp[strBrowserFunc](param, fnSuccess);
		}
	}
	else {
		if (param === undefined) {
			objBrowserProp[strBrowserFunc]().then(fnSuccess, fnError);
		} else {
			objBrowserProp[strBrowserFunc](param).then(fnSuccess, fnError);
		}
	}
}

function callXBrowserTabSendMessage(iTabId, objParam, fnSuccess, fnError) {
	if (browserName !== 'firefox') {
		xBrowser.tabs.sendMessage(iTabId, objParam, fnSuccess);
	}
	else {
		xBrowser.tabs.sendMessage(iTabId, objParam).then(fnSuccess).catch(fnError);
	}
}

function removeHeader(headers, name) {
	for (var i = 0; i < headers.length; i++) {
		if (headers[i].name.toLowerCase() == name.toLowerCase()) {
			headers.splice(i, 1);
			return;
		}
	}
}

function setHeader(headers, name, value) {
	for (var header of headers) {
		if (header.name.toLowerCase() === name.toLowerCase()) {
			header.value = value;
			return;
		}
	}
	headers.push({ name : name, value : value });
}

// Rewrite the Accept header if needed...
function rewriteRequestAcceptHeader(ev) {
	console.log('rewriteRequestAcceptHeader');
	console.log(ev);
	// IMPORTANT for Firefox >= 128
	// if the tabId of the event is -1 set the global iCurrentTabId to iTabIdEvent
	const iTabIdEvent = ev.tabId === -1? iCurrentTabId : ev.tabId;
	console.log(ev.url);
	console.log(objTabSettings[iTabIdEvent]);
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
					if(strAcceptValue === 'text/xml') {
					setHeader(ev.requestHeaders, 'Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3');
					} else {
					setHeader(ev.requestHeaders, 'Accept', strAcceptValue);
					}
			}
		}
	}
	if (iCurrentTabId === iTabIdEvent) {
		updateIcon();
	}
	return { requestHeaders: ev.requestHeaders };
}

function updatePageContent(iTabId) {
	console.log('updatePageContent. strAcceptValue: ' + strAcceptValue + ' | browserName: ' + browserName);
	if(strAcceptValue === 'text/xml') {
		if(browserName !== 'firefox') {
			xBrowser.tabs.sendMessage( iCurrentTabId, {bXML: true});
		} 
	} else {
		console.log('sendMessage loadJSONViewer');
		if(browserName === 'firefox') {
			xBrowser.tabs.sendMessage(iTabId, {txt: 'loadJSONViewer', fontSize: fontSize}).then().catch(function(err) {
				console.info('Receiving end not found --> default FireFox JSON Viewer is active');
			});
		} else {
			xBrowser.tabs.sendMessage(iTabId, {txt: 'loadJSONViewer', fontSize: fontSize});
		}
	}
}