/**
 * 
 *	SP REST JSON, v. 0.1.5
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

var arrURLs = [];
arrURLs.push('https://*/*_api/web/*');
arrURLs.push('https://*/*_api/Web/*');
arrURLs.push('https://*/*_api/site/*');
arrURLs.push('https://*/*_api/Site/*');
arrURLs.push('https://*/*_api/sp./*');
arrURLs.push('https://*/*_api/SP./*');



var RegExpOData = /odata=|odata.metadata=/i; // 'odata=' OR 'odata.metadata='	/i --> caseinsesitive
var strAcceptValue = 'application/json; odata=verbose';
//var bJSON;
var iTabId;
var objTabSettings = {};
var arrODataOptions = ['application/json;odata=verbose', 'application/json;odata=minimalmetadata', 'application/json;odata=nometadata'];
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
		browser.browserAction.setIcon({
			path: objTabSettings[iTabId].bJSON ? {
				64: "icons/64/active.png"
			} : {
				64: "icons/64/inactive.png"
			}
		});
		browser.browserAction.setTitle({
			title: 'Click to set options for SP REST JSON\nCurrent options: ' + (objTabSettings[iTabId].bJSON? arrODataOptions[objTabSettings[iTabId].iODataChosen] : 'disabled')
		});
	}

	function connected(p) {
		portFromCS = p;
		
		// Set initial values for the pop up
		portFromCS.postMessage({
			bJSON: objTabSettings[iTabId].bJSON
			,arrODataOptions: arrODataOptions
			,iODataChosen: objTabSettings[iTabId].iODataChosen
			,bRefreshOnChange: objTabSettings[iTabId].bRefreshOnChange
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
	function rewriteAcceptHeader(ev) {
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
					console.log('Accept header exists');
					var strValue = header.value.toLowerCase();
					if(strValue.indexOf('application/json') > -1) {
						console.log('Accept header is application/json');
						if(RegExpOData.test(strValue) == false) {
							console.log('but NO odata');
							header.value = strAcceptValue;
						}
					}
					else {
						console.log('Accept is NOT application/json');
						header.value = strAcceptValue;
					}
				}
			}
			if(!bAccept) {
				console.log('There wasn\'t any accept header');
				ev.requestHeaders.push({name: 'Accept', value: strAcceptValue});
			}
			console.log('return CHANGED requestHeader');
		}
		else console.log('return UNCHANGED requestHeader');
		return { requestHeaders: ev.requestHeaders };
	}

	// Add rewriteAcceptHeader as a listener to onBeforeSendHeaders
	// Make it "blocking" so we can modify the headers.
	browser.webRequest.onBeforeSendHeaders.addListener(
		rewriteAcceptHeader,
		{
			urls: arrURLs
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