/**
 * 
 *	SP REST JSON, v. 1.0.1
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

// var arrURLs = [];
// arrURLs.push('https://*/*_api/web/*');
// arrURLs.push('https://*/*_api/Web/*');
// arrURLs.push('https://*/*_api/site/*');
// arrURLs.push('https://*/*_api/Site/*');
// arrURLs.push('https://*/*_api/sp./*');
// arrURLs.push('https://*/*_api/SP./*');


var RegExpRestURL = /\/_api\/web\/|\/_api\/site\/|\/_api\/sp./i; // '/_api/web/' or '/_api/site/'	or /_api/sp./i --> caseinsesitive
var RegExpOData = /odata=|odata.metadata=/i; // 'odata=' OR 'odata.metadata='	/i --> caseinsesitive
var strAcceptValue = '';
//var bJSON;
var iTabId;
var objTabSettings = {};
var arrODataOptions = [
	'application/json;odata=verbose',
	'application/json;odata=minimalmetadata',
	'application/json;odata=nometadata'
];
//var iODataChosen;
var portFromCS;


var browser = browser;
var browserName = 'firefox';

var publicToggleIcon;
(function(browser) {
	if (typeof browser === 'undefined') {
		// If browser is not defined, the plugin was loaded into Google Chrome.
		// Set the browser variable and other differences accordingly.
		browser = chrome;
		browserName = 'chrome';
	} else if (typeof browser.runtime.getBrowserInfo === 'undefined') {
		// If browser.runtime.getBrowserInfo is not defined, then we're on
		// Microsoft Edge. 
		promises = false;
		browserName = 'edge';
	}


	function updateActiveTab(tabs) {
		function updateTab(currentTab) {
			iTabId = currentTab.id;
			if(iTabId != undefined) {
				if(objTabSettings[iTabId] == undefined) {
					objTabSettings[iTabId] = {};
					objTabSettings[iTabId].bJSON = true;
					objTabSettings[iTabId].bAcceptChanged = false;
					objTabSettings[iTabId].iODataChosen = 0;
					objTabSettings[iTabId].bRefreshOnChange = true;
				}
				updateIcon();
			}			
		}

		if (browserName == 'firefox') {
			browser.tabs.query({active:true}).then(function(tab) {
				updateTab(tab[0]);
			});
		}
		else {
			browser.tabs.query({active:true}, function(tab) {
				updateTab(tab[0]);
			});
		}
	}

	function updateIcon() {
		if(objTabSettings[iTabId].bAcceptChanged) {
			browser.browserAction.enable();
			var strTooltip = 'Click to set options for SP REST JSON in this tab.\n\nCurrent options: ';
			if(objTabSettings[iTabId].bJSON) {
				var objTab = objTabSettings[iTabId];
				browser.browserAction.setIcon({
					path: {
						16: "icons/16/active.png",
						32: "icons/32/active.png",
						48: "icons/48/active.png",
						64: "icons/64/active.png",
						128: "icons/128/active.png"
					}
				});
				var bRefreshOnChange = objTab.bRefreshOnChange;
				var stroData = arrODataOptions[objTab.iODataChosen];
				strTooltip += '\nAutomatic page reload on odata change: ' + bRefreshOnChange + '\noData option: ' + stroData;
			}
			else {
				browser.browserAction.setIcon({
					path: {
						16: "icons/16/disabled.png",
						32: "icons/32/disabled.png",
						48: "icons/48/disabled.png",
						64: "icons/64/disabled.png",
						128: "icons/128/disabled.png"
					}
				});
				strTooltip += 'disabled';
			}
			
			browser.browserAction.setTitle({
				title: strTooltip
			});
		}
		else {
			browser.browserAction.disable();
			browser.browserAction.setIcon({
				path: {
					16: "icons/16/inactive.png",
					32: "icons/32/inactive.png",
					48: "icons/48/inactive.png",
					64: "icons/64/inactive.png",
					128: "icons/128/inactive.png"
				} 
			});
			browser.browserAction.setTitle({
				title: 'Only active when a SharePoint REST API URL is loaded'
			});
		}


	}

	function connected(p) {
		portFromCS = p;
		// Set initial values for the pop up
		portFromCS.postMessage({
			bJSON: objTabSettings[iTabId].bJSON,
			arrODataOptions: arrODataOptions,
			iODataChosen: objTabSettings[iTabId].iODataChosen,
			bRefreshOnChange: objTabSettings[iTabId].bRefreshOnChange
		});
		
		portFromCS.onMessage.addListener(function(objMessage) {
			if(objMessage.bJSON != undefined) {
				objTabSettings[iTabId].bJSON = objMessage.bJSON;
			}
			if(objMessage.iODataChosen != undefined) {
				var bReload = false;
				if(objMessage.bRefreshOnChange != undefined && objMessage.bRefreshOnChange == true && objMessage.iODataChosen != objTabSettings[iTabId].iODataChosen) {
					bReload = true;
				}
				objTabSettings[iTabId].iODataChosen = objMessage.iODataChosen;
				if(bReload) {
					browser.tabs.reload();
				}
			}
			if(objMessage.bRefreshOnChange != undefined) {
				objTabSettings[iTabId].bRefreshOnChange = objMessage.bRefreshOnChange;
			}
			updateIcon();
		});
	}

	browser.runtime.onConnect.addListener(connected);

	// Rewrite the Accept header if needed...
	function rewriteRequestAcceptHeader(ev) {
		if(ev.type === 'main_frame') {
			if(RegExpRestURL.test(ev.url)) {
				if(objTabSettings[iTabId] == undefined) {
					strAcceptValue = arrODataOptions[0];
				}
				else {		
					strAcceptValue = arrODataOptions[objTabSettings[iTabId].iODataChosen];
				}
				if(objTabSettings[iTabId].bJSON) {
					var bAccept = false;
					for (var header of ev.requestHeaders) {
						if (header.name.toLowerCase() == 'accept') {
							bAccept = true;
							var strValue = header.value.toLowerCase();
							if(strValue.indexOf('application/json') > -1) {
								if(RegExpOData.test(strValue) == false) {
									header.value = strAcceptValue;
								}
							}
							else {
								header.value = strAcceptValue;
							}
						}
					}
					if(!bAccept) {
						ev.requestHeaders.push({name: 'Accept', value: strAcceptValue});
					}
					objTabSettings[iTabId].bAcceptChanged = true;
				}
			}
			else {
				objTabSettings[iTabId].bAcceptChanged = false;
			}
		}
		updateIcon();
		return { requestHeaders: ev.requestHeaders };
	}

	// Add rewriteRequestAcceptHeader as a listener to onBeforeSendHeaders
	// Make it "blocking" so we can modify the headers.
	browser.webRequest.onBeforeSendHeaders.addListener(
		rewriteRequestAcceptHeader,
		{
			// urls: arrURLs
			urls: ['<all_urls>']
		},
		["blocking", "requestHeaders"]
	);
	
	// listen to tab switching
	browser.tabs.onActivated.addListener(updateActiveTab);

	// listen for window switching
	browser.windows.onFocusChanged.addListener(updateActiveTab);

	// update when the extension loads initially
	updateActiveTab();
})(browser);