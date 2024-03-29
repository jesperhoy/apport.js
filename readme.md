# Apport.js

Say "apport" to your dog - and it will fetch...

Apport.js fetches HTML from your server and inserts it into the web-page.

## Why

1. "HTML over the wire" removes the middle JSON serialization/de-serialization layer between server and SPA/client.  
It is much simpler to use the data from the database etc. to generate HTML directly on the server.

2. Expressing "event -> Ajax call -> partial page update" with a few HTML attributes, greatly simplifies this common pattern - removing a lot of boiler plate code.

3. This cannot replace more complex SPAs - but it can replace a LOT of simple SPAs - like pagination, CRUD / form handling, etc.

4. Because [HTMX](https://htmx.org) is 47 KB minified (15 KB gzipped) and Apport.js is 4 KB minified (2 KB gzipped).


## Inspiration

Apport.js is heavily inspired by [HTMX](https://htmx.org).

HTMX is build around an idea of extending the "hypertext" (the HT of HTML) beyond links (&lt;a&gt;) and forms (&lt;form&gt;).

However the part of HTMX that caught my attention is - having a few special HTML attributes which, on an event (such as a click on the element), triggers an Ajax call to alert the server about the event and retrieve back an HTML fragment from the server, and automatically insert/swap this into the HTML document.

That is an awesome idea! And HTMX implements this concept very nicely.

However, HTMX also comes with a bunch of other stuff (like intersection observers).
That extra stuff may be there to support the extended hypertext idea, but it feels more like an attempt at shielding JavaScript-scared backend developers from having to deal with JavaScript at all.

Apport.js does just the core functionality (as I see it) of HTMX.

If you are not too scared of JavaScript, it is easy to add the other pieces only when you need them - and minimize your JavaScript overhead when you don't.

## Documentation

See [docs.md](docs.md)