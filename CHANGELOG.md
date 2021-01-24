# Change Log
## 1.4.0 (2020-01-24)
**Implemented enhancement:**
* Add option to set font-size for JSON viewer. In **Firefox** only woriking when default JSON viewer is deactivated (about:config --> `devtools.jsonview.enabled`  set to `false`).

## 1.3.1 (2020-01-27)
**Bugfix**
* **Chrome**: The `SchemaXml` property of a list wasn't loaded correctly
* **Firefox**: The `SchemaXml` property of a list wasn't loaded correctly when `devtools.jsonview.enabled` was set to `false`

## 1.3.0 (2019-10-27)
**Implemented enhancement:**
* Global options: Add Cancel button per filter item
* Global options: Add confirmation message before removing filter item

## 1.2.0 (2019-08-21)
**Implemented enhancement:**
* Add plain XML option [\#1](https://github.com/ddesch/SP-REST-JSON/issues/1)
* Add JSON viewer so that
    * **Chrome**: No additional JSON viewer is needed anymore
    * **Firefox**: It also works when `devtools.jsonview.enabled` is set to `false`