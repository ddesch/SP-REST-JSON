# SP REST JSON
WebExtension that modifies request header for SharePoint REST API calls to get JSON instead of XML feed.

### Available for
* **Firefox:** https://addons.mozilla.org/firefox/addon/sp-rest-json/
* **Chrome:** https://chrome.google.com/webstore/detail/sp-rest-json/kcdolhjbipnfgefpjaopfbjbannphidh

### Details
Once a tab is active, the current URL is matched against the following strings:
* /_api/web/
* /_api/site/
* /_api/sp.
* /_api/search
* /_vti_bin/ListData.svc

At a match the accept property in the request header is changed to 'application/json;odata=verbose' per default.

**New since version 1.1.0: Global Options**
* Add or change SharePoint URL filters
* Set the accept header per URL filter

In the menu the following options can be chosen:
* application/json;odata=verbose
* application/json;odata=minimalmetadata
* application/json;odata=nometadata