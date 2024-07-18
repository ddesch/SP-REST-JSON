# SP REST JSON
WebExtension that modifies request header for SharePoint REST API calls to get JSON instead of XML feed.

### Available for
* **Firefox:** https://addons.mozilla.org/firefox/addon/sp-rest-json/
* **Chrome:** https://chrome.google.com/webstore/detail/sp-rest-json/kcdolhjbipnfgefpjaopfbjbannphidh
* **Edge:** https://microsoftedge.microsoft.com/addons/detail/mdjmgobkbnldmmchokoaefcaldhpdfoi

### Try it yourself
* Clone the project
* **Firefox:**
	* Go to about:debugging#/runtime/this-firefox
	* Click "Load Temporary Add-on"
	* Point to the "SP-REST-JSON/src/SPRESTJSON.js" file
* **Chrome:** https://chrome.google.com/webstore/detail/sp-rest-json/kcdolhjbipnfgefpjaopfbjbannphidh
	* Go to chrome://extensions
	* Click "Load unpacked"
	* Point to the "SP-REST-JSON/src" folder
* **Edge:** https://microsoftedge.microsoft.com/addons/detail/mdjmgobkbnldmmchokoaefcaldhpdfoi
	* Go to edge://extensions
	* Turn on **Developer mode** toggle
	* Click "Load unpacked"
	* Point to the "SP-REST-JSON/src" folder

### Details
Once a tab is active, the current URL is matched against the following strings:
* /_api/web/
* /_api/site/
* /_api/sp.
* /_api/search
* /_vti_bin/ListData.svc

At a match the accept property in the request header is changed to 'application/json;odata=verbose' per default.

### Global Options
* Add or change SharePoint URL filters
* Set the accept header per URL filter

In the menu the following options can be chosen:
* application/json;odata=verbose
* application/json;odata=minimalmetadata
* application/json;odata=nometadata
* text/xml