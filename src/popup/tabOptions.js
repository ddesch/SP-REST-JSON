var chkboxToggleUseAddon = document.querySelector('#useAddon');
var spanMatchedURL = document.querySelector('#globalMatchedURL');
var spanGlobalAcceptHeader = document.querySelector('#globalAcceptHeader');
var chkboxTabXorGlobal = document.querySelector('#TabXorGlobal');
var selectOdataTab = document.querySelector('#odataSwitch');
var btnOpenGeneralOptions = document.querySelector('#btnOpenGeneralOptions');

var bUSE;
var bTabXorGlobal;
var strMatchedURL;
var strGlobalAcceptHeader = '';
var portBgScript;
var iWindowId;

var xBrowser;
var browserName;
var strOptionsURL;

if (typeof browser === 'undefined') {
	// If browser is not defined, the plugin was loaded into Google Chrome.
	// Set the browser variable and other differences accordingly.
	browserName = 'chrome';
	xBrowser = chrome;
} else if (window.MsInkCanvasContext !== undefined && typeof window.MsInkCanvasContext === 'function') {
	browserName = 'edge';
	xBrowser = browser;
} else {
	browserName = 'firefox'
	xBrowser = browser;
}

btnOpenGeneralOptions.addEventListener('click', function () {
	strOptionsURL = xBrowser.extension.getURL('') + 'options.html';
	if (browserName !== 'firefox') {
		xBrowser.tabs.query({ currentWindow: true }, checkTabs);
	}
	else {
		xBrowser.tabs
			.query({ currentWindow: true })
			.then(checkTabs, onError);
	}
});

chkboxToggleUseAddon.addEventListener('click', function () {
	bUSE = this.checked;
	portBgScript.postMessage({
		bUSE: bUSE
		, bTabXorGlobal: bTabXorGlobal
		, iOdataTab: selectOdataTab.selectedIndex
		, bReload: true
	});
	setLayout();
});
chkboxTabXorGlobal.addEventListener('click', function () {
	bTabXorGlobal = this.checked;
	var bReload = false;
	if (selectOdataTab.options[selectOdataTab.selectedIndex].text !== strGlobalAcceptHeader) {
		bReload = true;
	}

	portBgScript.postMessage({
		bUSE: bUSE
		, bTabXorGlobal: bTabXorGlobal
		, iOdataTab: selectOdataTab.selectedIndex
		, bReload: bReload
	});
	setLayout();
});

selectOdataTab.addEventListener('change', function () {
	portBgScript.postMessage({
		bUSE: bUSE
		, bTabXorGlobal: bTabXorGlobal
		, iOdataTab: selectOdataTab.selectedIndex
		, bReload: true
	});
});

portBgScript = xBrowser.runtime.connect({ name: 'portTabOptions' });

portBgScript.onMessage.addListener(function (objCurrentTab) {
	if (objCurrentTab.TabSettings && objCurrentTab.TabSettings.bUSE != undefined) {
		bUSE = objCurrentTab.TabSettings.bUSE;
		chkboxToggleUseAddon.checked = bUSE;
		bTabXorGlobal = objCurrentTab.TabSettings.bTabXorGlobal;
		chkboxTabXorGlobal.checked = bTabXorGlobal;

		if (objCurrentTab.arrOptionsAccept != undefined) {
			for (var i = 0; i < objCurrentTab.arrOptionsAccept.length; i++) {
				var opt = document.createElement('option');
				opt.text = objCurrentTab.arrOptionsAccept[i];
				opt.value = String(i);
				selectOdataTab.add(opt);
			}
			strMatchedURL = objCurrentTab.TabSettings.strMatchedURL;
			selectOdataTab.selectedIndex = objCurrentTab.TabSettings.iOdataTab;

			if (strMatchedURL !== '') {
				spanMatchedURL.innerText = strMatchedURL;

				var iFilterURL = -1;
				iFilterURL = objCurrentTab.arrFilterURLs.findIndex(function (filterURL) {
					return strMatchedURL.toLowerCase().indexOf(filterURL.toLowerCase()) > -1;
				});
				strGlobalAcceptHeader = objCurrentTab.arrOptionsAccept[objCurrentTab.arrFilterOptionsIndex[iFilterURL]];
			} else {
				spanMatchedURL.innerText = 'No SharePoint REST API URL';
			}
			spanGlobalAcceptHeader.innerText = strGlobalAcceptHeader;
			iWindowId = objCurrentTab.iWindowId;
			setLayout();
		}
	}
});

function onError(error) {
	console.error('Error: ' + error);
}

function checkTabs(tabs) {
	var idOptionsTab = -1;
	for (var i = 0; i < tabs.length; i++) {
		if (tabs[i].url === strOptionsURL) {
			idOptionsTab = tabs[i].id;
			break;
		}
	}
	if (idOptionsTab === -1) {
		if (browserName === 'firefox') {
			xBrowser.tabs.create({
				"url": strOptionsURL
				, windowId: iWindowId
			});
		} else {
			xBrowser.tabs.create({
				"url": strOptionsURL
			});
		}
		window.close();
	}
	else {
		// browser.tabs.show( tabs[0].index );
		function onUpdated(tab) {
			window.close();
		}

		if (browserName !== 'firefox') {
			xBrowser.tabs.update(idOptionsTab, { active: true }, onUpdated);
		}
		else {
			xBrowser.tabs
				.update(idOptionsTab, { active: true })
				.then(onUpdated, onError);
		}
	}
}

function setLayout() {
	// console.log('strMatchedURL', strMatchedURL);
	// console.log('bUSE', bUSE, 'bTabXorGlobal', bTabXorGlobal)
	if (strMatchedURL === '') {
		chkboxToggleUseAddon.disabled = true;
		selectOdataTab.disabled = true;
	} else {
		selectOdataTab.disabled = false;
	}
	var divToggleUseAddon = document.querySelector('.onoffswitch');
	var divSelect = selectOdataTab.parentNode;
	if (strMatchedURL === '' || !bUSE) {
		chkboxTabXorGlobal.disabled = true;
		divToggleUseAddon.style.opacity = '0.4';
		divSelect.style.opacity = '0.4';
	} else {
		chkboxTabXorGlobal.disabled = false;
		divToggleUseAddon.style.opacity = '1';
		divSelect.style.opacity = '1';
	}
	var onSpan = divToggleUseAddon.querySelector('.on');
	var offSpan = divToggleUseAddon.querySelector('.off');
	if (chkboxToggleUseAddon.checked) {
		onSpan.style.display = 'inline';
		offSpan.style.display = 'none';
		selectOdataTab.disabled = false;
	}
	else {
		onSpan.style.display = 'none';
		offSpan.style.display = 'inline';
		selectOdataTab.disabled = true;
	}
	var divGlobalAcceptHeader = spanGlobalAcceptHeader.parentNode.parentNode;
	if (bTabXorGlobal) {
		divGlobalAcceptHeader.style.opacity = '0.4';
		selectOdataTab.disabled = false;
		divSelect.style.opacity = '1';
	}
	else {
		divGlobalAcceptHeader.style.opacity = '1';
		selectOdataTab.disabled = true;
		divSelect.style.opacity = '0.4';
	}
}