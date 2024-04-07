# Apport.js documentation

## HTML element attribute "directives"

- `ap-get` / `ap-post` / `ap-put` / `ap-delete` - Send a GET/POST/PUT/DELETE request to the server and swap the returned HTML into the page. The attribute value (if present) is the URL to get/post to (defaults to current URL). 
- `ap-on` - The event that triggers the fetch request. Defaults to `change` for input, textarea and select elements, `submit` for form elements, and `click` for all other element types. Can also be `mount`to do the request as soon as the element is loaded. (optional)
- `ap-swap` - How to swap returned HTML into target element. See "swap values" below. Defaults to "inner". (optional)
- `ap-validate` - Override form validation for `ap-post` / `ap-put` by setting this to `"true"` (or empty) or `"false"`. The default is "true" on `<form>` elements - and "false" on other elements. (optional)
- `ap-target` - Query selector for target element (defaults to current element).  (optional)
- `ap-data` - Value is evaluated as JavaScript and then included in request "AP-Data" header (JSON.stringify'd + URL encoded).  (optional)
- `ap-trim` - for input/textarea elements - value is automatically trimmed on load and after change (optional).
- `ap-validity` - for input/textarea elements - sets custom validity to result of evaluating value as JavaScript on load and after change (optional).

## Request-headers

The following headers are include with requests sent to the server:

- `AP-Request:` - always `true`.
- `AP-Trigger:` - the `id` (if it exists) of the element that triggered the request (URL encoded).
- `AP-Trigger-Name:` - the `name` (if it exists) of the element that triggered the request (URL encoded).
- `AP-Data:` - value from evaluated `ap-data` attribute or Apport options `data` value (JSON.stringify'd + URL encoded).


## Response headers

Apport.js understands the following response headers sent back from your web-server:

- `AP-Redirect:` url (optional - redirect the browser to a new url)
- `AP-Reload:` true (optional - reload whole page)
- `AP-Push-URL:` url (optional - push to history)
- `AP-Replace-URL:` url (optional - replace history)
- `AP-Target:` query selector string (optional - target element).
- `AP-Swap:` one of the swap methods (see below) (optional).
- `AP-Execute:` JavaScript to be executed on the client (URL encoded). The script can access the ApportOptions object through an "$opt" variable.

**Note:** `AP-Target` and `AP-Swap` headers (if present) override `target` / `swap` values from Get/Post options object. 


## Swap values

- `innner` - replace the innerHTML of the target element.
- `replace` - replace the target element.
- `before` - insert before the target element.
- `after` - insert after the target element. 
- `first` - insert first inside the target element. 
- `last` - insert last inside the target element. 
- `none` - don't change anything.
- `delete` - delete the target element.

## Events

On `document`:

- `ap-begin` - opportunity to show spinner
- `ap-done` - opportunity to hide spinner
- `ap-error` - opportunity to hide spinner / react to error


## Global API

- `Apport(ApportOptions)` 

Global function which returns a promise (awaitable).

Can be used as a JavaScript alternative to the element attributes above.

`ApportOptions` is an object with the following members:

- `url:` the URL to get / post to. Defaults to the current URL.
- `method:` - POST, GET, PUT or DELETE (automatically set with ap-... attributes).
- `form:` for post/put requests - the form to post data for. Actual HTML form element or query selector string. For ap-get/ap-post attributes this defaults to the enclosing form - if any (specify "none" to override) (optional). 
- `validate:` true/false. for post/put requests with a form (see above) - when true, only perform request if form validates. Defaults to false. 
- `target:` the target element where the HTML from the server goes (actual HTMLElement or query selector string - for ap-get/post attributes it defaults to same element).
- `swap:` one of the swap methods (see below) (defaults to "inner").
- `data:` a value which is sent to the server in the "AP-Data" request header (JSON.stringify'd + URL encoded).
- `trigger:` value placed in `AP-Trigger:` request header (URL encoded).
- `triggerName:` value placed in `AP-Trigger-Name:` request header (URL encoded).
