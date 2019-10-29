var arrOptionsAccept;
var inpNewAcceptValue = document.querySelector('#newAcceptValue');
// var iOpt = 0;
var btnAddFilterOption = document.querySelector('#addFilterOption');
var btnRestoreDefault = document.querySelector('#restoreDefault');
var pFooter = document.querySelector('#footer');
var portGlobalOptions;
var strUrlEdit = '';
var iSelectedIndexEdit = -1;
bNew = false;


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
	portGlobalOptions = xBrowser.runtime.connect({ name: 'portGlobalOptions' });

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
	if (iSelectedIndex === -1) {
		btnAddFilterOption.disabled = true;
		bNew = true;
	}
	var p = document.createElement('p');
	p.className = 'filter';

	// var span = document.createElement('span');
	// p.appendChild(span);
	var inputUrl = document.createElement('input');
	inputUrl.type = 'text';
	inputUrl.className = 'url';
	inputUrl.value = strUrl;
	if (iSelectedIndex !== -1) {
		inputUrl.disabled = true;
	}
	p.appendChild(inputUrl);
	// span.appendChild(inputUrl);

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
	// span.appendChild(selectAccept);

	var btnEditFilter = document.createElement('button');
	btnEditFilter.type = 'button';
	// btnEditFilter.textContent = '🖊️';
	// btnEditFilter.textContent = '✎';
	btnEditFilter.textContent = '⚙️';
	btnEditFilter.title = 'Edit option';
	btnEditFilter.className = 'iconButton editOption';
	if (iSelectedIndex === -1) {
		btnEditFilter.style.display = 'none';
	}
	btnEditFilter.addEventListener('click', editOption);
	p.appendChild(btnEditFilter);
	
	var btnSaveFilter = document.createElement('button');
	btnSaveFilter.type = 'button';
	btnSaveFilter.textContent = '✅';
	btnSaveFilter.title = 'Save option';
	btnSaveFilter.className = 'iconButton saveOption';
	if (iSelectedIndex !== -1) {
		btnSaveFilter.style.display = 'none';
	}
	btnSaveFilter.addEventListener('click', saveOptions);
	p.appendChild(btnSaveFilter);
	p.appendChild(btnSaveFilter);
	
	var btnEndEdit = document.createElement('button');
	btnEndEdit.type = 'button';
	btnEndEdit.textContent = '🔚';
	btnEndEdit.textContent = '❌';
	btnEndEdit.title = 'Cancel edit';
	btnEndEdit.className = 'iconButton endEditOption';
	if (iSelectedIndex !== -1) {
		btnEndEdit.style.display = 'none';
	}
	btnEndEdit.addEventListener('click', endEditOption);
	p.appendChild(btnEndEdit);

	var btnRemoveFilter = document.createElement('button');
	btnRemoveFilter.type = 'button';
	// btnRemoveFilter.textContent = '❌';
	btnRemoveFilter.textContent = '🗑️';
	btnRemoveFilter.title = 'Delete option';
	btnRemoveFilter.className = 'iconButton removeOption';
	if (iSelectedIndex === -1) {
		btnRemoveFilter.style.display = 'none';
	}
	btnRemoveFilter.addEventListener('click', removeOption);
	p.appendChild(btnRemoveFilter);
	
	if (iSelectedIndex === -1) {
		// Hide all Edit + Remove buttons
		var nodeListBtnEdit = document.querySelectorAll('.editOption, .removeOption');
		nodeListBtnEdit.forEach(function(btn) {
			btn.style.display = 'none';
		});
	}

	pFooter.parentNode.insertBefore(p, pFooter);
	// iOpt++;
}

function editOption(ev) {
	var btnEditOption = ev.target;
	var p = btnEditOption.parentNode;
	var inputUrl = p.querySelector('.url');
	var selectAccept = p.querySelector('.accept');
	strUrlEdit = inputUrl.value;
	iSelectedIndexEdit = selectAccept.selectedIndex;

	p.querySelector('.url').disabled = false;
	p.querySelector('.accept').disabled = false;
	btnAddFilterOption.disabled = true;
	// Hide all Edit + Remove buttons
	var nodeListBtnEdit = document.querySelectorAll('.editOption, .removeOption');
	nodeListBtnEdit.forEach(function(btn) {
		btn.style.display = 'none';
	});
	p.querySelector('.saveOption').style.display = 'inline-block';
	p.querySelector('.endEditOption').style.display = 'inline-block';
	// if (iOpt > 1) {
	// if (document.querySelectorAll('p.filter').length > 1) {
	// 	p.querySelector('.removeOption').style.display = 'inline-block';
	// }
}

function removeOption(ev) {
	var btn = ev.target;
	var p = btn.parentNode;
	var inputUrl = p.querySelector('.url');
	var selectAccept = p.querySelector('.accept');
	inputUrl.style.border = '1px dashed red';
	selectAccept.style.border = '1px dashed red';
	var strUrl = inputUrl.value;
	var strAccept = selectAccept.selectedOptions[0].innerText;
	bRemove = confirm('Remove option?\n' + 'URL: ' + strUrl + '\nAccept: ' + strAccept);
	if( bRemove ) {
		p.outerHTML = '';
		// iOpt--;
		saveOptions(ev);
	} else {
		inputUrl.style.border = '';
		selectAccept.style.border = '';
	}
}

function endEditOption(ev) {
	btnAddFilterOption.disabled = false;
	var btn = ev.target;
	var p = btn.parentNode;
	// p.outerHTML = '';
	// iOpt--;
	// saveOptions(ev);
	var inputUrl = p.querySelector('.url');
	var selectAccept = p.querySelector('.accept');
	inputUrl.value = strUrlEdit;
	selectAccept.selectedIndex = iSelectedIndexEdit;
	inputUrl.disabled = true;
	selectAccept.disabled = true;
	p.querySelector('.saveOption').style.display = 'none';
	p.querySelector('.removeOption').style.display = 'none';
	p.querySelector('.endEditOption').style.display = 'none';

	if(bNew) {
		p.outerHTML = '';
		if (document.querySelectorAll('p.filter').length === 1) {
			p.querySelector('.removeOption').style.display = 'none';
		}
		// iOpt--;
	}
	bNew = false;
	// Show all Edit + Remove buttons
	var nodeListBtnEdit = document.querySelectorAll('.removeOption, .editOption');
	nodeListBtnEdit.forEach(function(btn) {
		btn.style.display = 'inline-block';
	});
}


function saveOptions(ev) {
	var btn = ev.target;
	if( btn.classList.contains('saveOption') ) {
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
		p.querySelector('.endEditOption').style.display = 'none';
	}
	btnAddFilterOption.disabled = false;

	// Show all Edit + Remove buttons
	var nodeListBtnEdit = document.querySelectorAll('.removeOption, .editOption');
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
	var objOptions = {
		arrFilterURLs: arrFilterURLs
		,arrFilterOptionsIndex: arrFilterOptionsIndex
	};

	if (document.querySelectorAll('p.filter').length === 1) {
		p = document.querySelector('p.filter');
		p.querySelector('.removeOption').style.display = 'none';
	}
	
	if(browserName !== 'firefox') {
		xBrowser.storage.sync.set(objOptions, reloadFromStorage);
	}
	else {
		xBrowser.storage.sync
			.set(objOptions)
			.then(reloadFromStorage);
	}
}

function setValuesFromStorage(res) {
	if(res.arrOptionsAccept != undefined) {
		arrOptionsAccept = res.arrOptionsAccept;
		if(res.arrFilterURLs != undefined) {
			for(var i = 0; i < res.arrFilterURLs.length; i++) {
				addFilterOption(res.arrFilterURLs[i], res.arrFilterOptionsIndex[i]);
			}
			if (document.querySelectorAll('p.filter').length === 1) {
				p = document.querySelector('p.filter');
				p.querySelector('.removeOption').style.display = 'none';
			}
		}
	}
}

function restoreDefault() {
	var bConfirm = confirm("Delete all options and restore default options?");
	if (bConfirm) {
		portGlobalOptions.postMessage({
			setDefaultOptions: true
		});
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
}

function reloadFromStorage(){
	portGlobalOptions.postMessage({
		reloadFromStorage: true
	});
}