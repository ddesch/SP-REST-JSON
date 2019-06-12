var arrOptionsAccept;
var inpNewAcceptValue = document.querySelector('#newAcceptValue');
var iOpt = 0;
var btnAddFilterOption = document.querySelector('#addFilterOption');
var btnRestoreDefault = document.querySelector('#restoreDefault');
var pFooter = document.querySelector('#footer');
var portGlobalOptions;

var xBrowser;
var browserName;
window.addEventListener('load', function(){
	if (typeof browser === 'undefined') {
		// If browser is not defined, the plugin was loaded into Google Chrome.
		// Set the xBrowser variable and browserName accordingly.
		xBrowser = chrome;
		browserName = 'chrome';
	} else if (window.MsInkCanvasContext !== undefined && typeof window.MsInkCanvasContext === 'function') {
		browserName = 'edge';
		xBrowser = browser;
	} else {
		browserName = 'firefox'
		xBrowser = browser;
	}

	if(browserName !== 'firefox') {
		xBrowser.storage.sync.get(setValuesFromStorage);
	}
	else {
		xBrowser.storage.sync
			.get()
			.then(setValuesFromStorage);
	}

	btnAddFilterOption.addEventListener('click', function(){
		addFilterOption('', -1);
	});
	
	btnRestoreDefault.addEventListener('click', function(){
		restoreDefault();
	});
});

function addFilterOption(strUrl, iSelectedIndex) {
	if (iSelectedIndex == -1) {
		btnAddFilterOption.disabled = true;
	}
	var p = document.createElement('p');
	p.className = 'filter';

	var inputUrl = document.createElement('input');
	inputUrl.type = 'text';
	inputUrl.className = 'url';
	inputUrl.value = strUrl;
	if (iSelectedIndex !== -1) {
		inputUrl.disabled = true;
	}
	p.appendChild(inputUrl);

	var selectAccept = document.createElement('select');
	selectAccept.className = 'accept';
	
	for(var i = 0; i < arrOptionsAccept.length; i++) {
		var opt = document.createElement('option');
		opt.value = i;
		opt.text = arrOptionsAccept[i];
		selectAccept.add(opt);
	}
	selectAccept.selectedIndex = iSelectedIndex;
	if (iSelectedIndex !== -1) {
		selectAccept.disabled = true;
	}
	p.appendChild(selectAccept);

	var btnEditFilter = document.createElement('button');
	btnEditFilter.type = 'button';
	// btnEditFilter.textContent = '🖊️';
	// btnEditFilter.textContent = '✎';
	btnEditFilter.textContent = '⚙️';
	btnEditFilter.className = 'editOption';
	if (iSelectedIndex === -1) {
		btnEditFilter.style.display = 'none';
	}
	btnEditFilter.addEventListener('click', editOption);
	p.appendChild(btnEditFilter);
	
	var btnSaveFilter = document.createElement('button');
	btnSaveFilter.type = 'button';
	btnSaveFilter.textContent = '✅';
	btnSaveFilter.className = 'saveOption';
	if (iSelectedIndex !== -1) {
		btnSaveFilter.style.display = 'none';
	}
	btnSaveFilter.addEventListener('click', saveOptions);
	p.appendChild(btnSaveFilter);

	var btnRemoveFilter = document.createElement('button');
	btnRemoveFilter.type = 'button';
	// btnRemoveFilter.textContent = '❌';
	btnRemoveFilter.textContent = '🗑️';
	btnRemoveFilter.className = 'removeOption';
	if (iSelectedIndex !== -1) {
		btnRemoveFilter.style.display = 'none';
	}
	btnRemoveFilter.addEventListener('click', removeOption);
	p.appendChild(btnRemoveFilter);
	pFooter.parentNode.insertBefore(p, pFooter);
	iOpt++;
}

function editOption(ev) {
	var btnEditOption = ev.target;
	var p = btnEditOption.parentNode;
	p.querySelector('.url').disabled = false;
	p.querySelector('.accept').disabled = false;
	btnAddFilterOption.disabled = true;
	// Hide all Edit buttons
	var nodeListBtnEdit = document.querySelectorAll('.filter .editOption');
	nodeListBtnEdit.forEach(function(btn) {
		btn.style.display = 'none';
	});
	p.querySelector('.saveOption').style.display = 'inline-block';
	if (iOpt > 1) {
		p.querySelector('.removeOption').style.display = 'inline-block';
	}
}

function removeOption(ev) {
	var btn = ev.target;
	var p = btn.parentNode;
	p.outerHTML = '';
	iOpt--;
	saveOptions(ev);
}

function saveOptions(ev) {
	var btn = ev.target;
	if( btn.className === 'saveOption') {
		var p = btn.parentNode;
		var inputUrl = p.querySelector('.url');
		var selectAccept = p.querySelector('.accept');
		var bError = false;
		if (inputUrl.value === '') {
			inputUrl.classList.add('error');
			bError = true;
		}
		else {
			inputUrl.classList.remove('error');
		}
		if (selectAccept.selectedIndex === -1) {
			selectAccept.classList.add('error');
			bError = true;
		}
		else {
			selectAccept.classList.remove('error');
		}
		if (bError) {
			return false;
		}
		inputUrl.disabled = true;
		selectAccept.disabled = true;
		p.querySelector('.saveOption').style.display = 'none';
		p.querySelector('.removeOption').style.display = 'none';
	}
	btnAddFilterOption.disabled = false;

	// Show all Edit buttons
	var nodeListBtnEdit = document.querySelectorAll('.filter .editOption');
	nodeListBtnEdit.forEach(function(btn) {
		btn.style.display = 'inline-block';
	});

	var arrFilterURLs = [];
	var arrFilterOptionsIndex = [];
	var i;
	var nodeListParagraphs = document.querySelectorAll('p.filter');
	for(i = 0; i < nodeListParagraphs.length; i++) {
		var p = nodeListParagraphs[i];
		var inputUrl = p.querySelector('.url');
		var selectAccept = p.querySelector('.accept');
		arrFilterURLs.push(inputUrl.value);
		arrFilterOptionsIndex.push(selectAccept.selectedIndex);
	}
	xBrowser.storage.sync.set({
		arrFilterURLs: arrFilterURLs
		,arrFilterOptionsIndex: arrFilterOptionsIndex
	});
}

function setValuesFromStorage(res) {
	if(res.arrOptionsAccept != undefined) {
		arrOptionsAccept = res.arrOptionsAccept;
		if(res.arrFilterURLs != undefined) {
			for(var i = 0; i < res.arrFilterURLs.length; i++) {
				addFilterOption(res.arrFilterURLs[i], res.arrFilterOptionsIndex[i]);
			}
		}
	}
}

function restoreDefault() {
	portGlobalOptions = xBrowser.runtime.connect({ name: 'portGlobalOptions' });
	portGlobalOptions.onMessage.addListener(function(objBgScript) {
		if(objBgScript.reloadOptions != undefined  && objBgScript.reloadOptions === true) {
			// Delete paragraph elements with filter options...
			var nlParagraphFilter = document.querySelectorAll('p.filter');
			var cntParagraphFilter = nlParagraphFilter.length - 1;
			for(var i = cntParagraphFilter; i > -1; i--) {
				nlParagraphFilter[i].outerHTML = '';
			}
			if(browserName !== 'firefox') {
				xBrowser.storage.sync.get(setValuesFromStorage);
			}
			else {
				xBrowser.storage.sync
					.get()
					.then(setValuesFromStorage);
			}
		}
	});
}