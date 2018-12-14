var inputChkboxUseAddon = document.querySelector('#useAddon');
var inputChkboxRefreshOnOdataChange = document.querySelector('#refreshOnChange');
var fieldsetOdataDropDown = document.querySelector('#odataSwitch');
var selectOdataSwitch = document.querySelector('#odataSwitch select');
var bJSON;


var browser = browser;
var browserName = 'firefox';


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
	
	inputChkboxUseAddon.addEventListener('click', function() {
		bJSON = this.checked;
		myPort.postMessage({bJSON: bJSON});
		setLayout();
		setTdLabel(this);
	});

	inputChkboxRefreshOnOdataChange.addEventListener('click', function() {
		setTdLabel(this);
		myPort.postMessage({
			bRefreshOnChange: inputChkboxRefreshOnOdataChange.checked
			,iODataChosen: selectOdataSwitch.selectedIndex
		});
	});
	
	selectOdataSwitch.addEventListener('change', function() {
		var strOdataValue = selectOdataSwitch.options[selectOdataSwitch.selectedIndex].innerText;
		myPort.postMessage({
			iODataChosen: selectOdataSwitch.selectedIndex
			,bRefreshOnChange: inputChkboxRefreshOnOdataChange.checked
		});
	});
	
	
	
	
	
	var myPort = browser.runtime.connect({name:"port-from-cs"});

	myPort.onMessage.addListener(function(objMessage) {
		if(objMessage.bJSON != undefined) {
			bJSON = objMessage.bJSON;
			inputChkboxUseAddon.checked = bJSON;
			setTdLabel(inputChkboxUseAddon);
			setLayout();
			
		}
		var iSelectedIndex = 0;
		if(objMessage.arrODataOptions != undefined) {
			if(objMessage.iODataChosen != undefined) {
				var iSelectedIndex = objMessage.iODataChosen;
			}
			for(var i = 0; i < objMessage.arrODataOptions.length; i++) {
				var opt = document.createElement(option);
				opt.innerText = objMessage.arrODataOptions[i];
				opt.value = String(i);
				selectOdataSwitch.appendChild(opt);
			}
			selectOdataSwitch.selectedIndex = iSelectedIndex;
		}
		if(objMessage.bRefreshOnChange != undefined) {
			inputChkboxRefreshOnOdataChange.checked = objMessage.bRefreshOnChange;
			setTdLabel(inputChkboxRefreshOnOdataChange);
		}
	});

	function setLayout() {
		refreshOnChange.disabled = !bJSON;
		selectOdataSwitch.disabled = !bJSON;
		
		var divRefreshOnChange = refreshOnChange.parentNode.parentNode.parentNode.parentNode;
		if(bJSON) {
			divRefreshOnChange.style.opacity = '1';
			fieldsetOdataDropDown.style.opacity = '1';
		}
		else {
			divRefreshOnChange.style.opacity = '0.3';
			fieldsetOdataDropDown.style.opacity = '0.3';
		}
	}

	function setTdLabel(inputChkbox) {
		var tdLabel = inputChkbox.parentNode.parentNode.parentNode.nextElementSibling;
		var onSpan = tdLabel.querySelector('.on');
		var offSpan = tdLabel.querySelector('.off');
		if(inputChkbox.checked) {
			//tdLabel.style.textDecoration = 'none';
			onSpan.style.display = 'inline';
			offSpan.style.display = 'none';
		}
		else {	
			//tdLabel.style.textDecoration = 'line-through';
			onSpan.style.display = 'none';
			offSpan.style.display = 'inline';

		}
	}
})(browser);