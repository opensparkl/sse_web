# OpenSPARKL Web Utility
- Load the utility by clicking [here](https://opensparkl.github.io/sse_web/ping/ping.html).

This utility lets you use your browser to:
- Connect to an [sse_core](https://github.com/opensparkl/sse_core) running locally or on the web
- Authenticate using client certificate or cookie session
- View and expand the configuration tree
- Listen to one or more objects in the tree for tracing
- Show the sse system log for debugging

This repo also provides a standard location for the [
ServiceModule.js](https://opensparkl.github.io/sse_web/rest/ServiceModule.js)
used to implement browser-side micro-services:
```
import {Service} from 'https://opensparkl.github.io/sse_web/rest/ServiceModule.js'
```
