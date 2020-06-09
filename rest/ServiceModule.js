/**
 * Copyright (c) 2018 SPARKL Limited. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.

 * Author <jacoby@sparkl.com> Jacoby Thwaites.
 *
 * Simple ES6 module to support service implementations
 * over svc_rest websockets.
 *
 * Usage:
 *   import {Service} from 'ServiceModule.js'
 *   const impl = {
 *     'path/to/req': (req, res) => {
 *        ...implementation...
 *     },
 *
 *     ...other op implementations...
 *   }
 *
 *   const service = new Service(
 *     'ws://some.sse',
 *     'path/to/RestService',
 *     impl)
 *
 *   service.onopen = ...
 *   service.onclose = ...
 *   service.onerror = ...
 *
 *   service.notify(notifyObject)
 *   service.solicit(solicitObject, (res) => {...})
 *
 * The websocket event messages are very simple, so you don't
 * need to use this library at all. But it provides a callback
 * idiom for solicit/response and request[consume]/reply
 * which keeps user code nice and trivial.
 */

export function Service(base, href, impl) {
    this.init(base, href, impl)
  }

/**
 * Initialise object properties.
 *
 * The base can be prefixed with either ws[s]: or http[s]: and
 * either case will work the same.
 */
Service.prototype.init =
  function(base, href, impl) {

    if (base.startsWith('http')) {
      this.httpBase = base
      this.wsBase = base.replace('http', 'ws')
    }
    else if (base.startsWith('ws')) {
      this.httpBase = base.replace('ws', 'http')
      this.wsBase = base
    }
    else {
      throw `Unsupported base: ${base}`
    }

    this.ws_url =
      `${this.wsBase}/svc_rest/websocket/${href}`

    // Pending solicits.
    this.pending = {}

    // Empty implementation if not supplied.
    this.impl = impl ? impl : {}

    this.open()
  }

/**
 * User defined. Called back when connection opened.
 */
Service.prototype.onopen =
  function() {}

/**
 * User defined. Called back when connection closed.
 */
Service.prototype.onclose =
  function() {}

/**
 * User defined. Called back when connection error occurs.
 */
Service.prototype.onerror =
  function() {}

/**
 * User defined callbacks on request and consume events.
 */
Service.prototype.impl =
  {}

/**
 * Dispatches a notify event on the websocket.
 */
Service.prototype.notify =
  function(message) {
    this.ws.send(
      JSON.stringify(message))
  }

/**
 * Dispatches a solicit event and invokes callback on arrival
 * of the response event.
 */
Service.prototype.solicit =
  function(message, callback) {
    message.id =
      Math.random().toString(36)
    this.pending[message.id] = callback

    this.ws.send(
      JSON.stringify(message))
  }

/**
 * Opens the websocket and message handlers.
 *
 * Note the auto-cookie-session workaround required to deal with buggy
 * client certificate implementations from Apple.
 */
Service.prototype.open =
  async function() {
    try {
      await this.tlsAutoCookieSession()

      this.ws =
        new WebSocket(this.ws_url)
    }
    catch (exception) {
      console.error(exception)
      setTimeout(
        () => this.onerror('Invalid websocket'), 0)
      return
    }

    this.ws.onopen =
      (event) => {
        this.onopen()
      };

    this.ws.onerror =
      (event) => {
        console.error(event)
        this.onerror('Error in websocket')
      }

    this.ws.onclose =
      (event) => {
        this.onclose()
      }

    this.ws.onmessage =
      (event) => {
        const message =
          JSON.parse(event.data)

        // Response message is cleaned of id and callback invoked.
        if (message.response) {
          const callback =
            this.pending[message.id]

          message.response =
            message.response.split('/').pop()
          delete this.pending[message.id]
          delete message.id

          callback && callback(message)
        }

        // Request and consume messages are cleaned of id, reply
        // callback is constructed and implementation invoked.
        else {
          const path =
            message.request || message.consume
          const id =
            message.id
          const callback =
            (object) => {

              // Reply id matches request id.
              object.id = id

              // Reinstate reply path if only name is supplied.
              if (!object.reply.startsWith(path)) {
                object.reply =
                  [path, object.reply].join('/')
              }

              this.ws.send(
                JSON.stringify(object))
            };

          delete message.id

          try {
            this.impl[path](
              message, callback)
          }
          catch (exception) {
            console.error(path, message, exception)
            this.onerror(`Exception calling back implementation ${path}`)
          }
      }
    }
  }

/**
 * Closes the websocket which in turn causes the onclose callback.
 * If there is no websocket (e.g. the url was invalid anyway)
 * then the onclose() callback is invoked directly.
 */
Service.prototype.close =
  function() {
    if (this.ws) {
      this.ws.close()
    }
    else {
      this.onclose()
    }
  }

/**
 * If no cookie session is established but there is a TLS session
 * secured by client certificate, this method establishes a
 * cookie session for that same user.
 *
 * This is required by Safari websockets on Mac and IOS, which fail to
 * support TLS connections secured by client certificate.
 */
 Service.prototype.tlsAutoCookieSession =
  async function() {
    const needsWorkAround =
      /(iPhone)|(iPad)|(MacIntel)/g.test(navigator.platform) &&
      /Apple/g.test(navigator.vendor)

    if (!needsWorkAround) {
      return
    }

    const xhr = await this.httpGet('/sse_cfg/user')
    const connectionType = xhr.responseXML.evaluate(
      '//prop[@name="connection"]/@type', xhr.responseXML,
      null, XPathResult.STRING_TYPE, null).stringValue
    if (connectionType == 'client_cert') {
      await this.httpPost('/sse_cfg/user')
      console.warn('Cookie session opened automatically')
    }
  }

 /**
 * Returns a promise which resolves on success of the GET,
 * and rejects on failure.
 *
 * Use in an async function like this:
 *   const xhr = await httpGet(path, params)
 *   etc
 *
 * Note how options are deconstructed from the optional
 * third argument with defaults.
 */
Service.prototype.httpGet =
  function(path, params = {}, options = {}) {
    const service = this
    const {
      accept = 'application/xml',
      responseType = ''
    } = options

    return new Promise(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const url = new URL(service.httpBase)
        url.pathname = path
        url.search = new URLSearchParams(params).toString()
        xhr.open('GET', url, true)
        xhr.withCredentials = true
        xhr.setRequestHeader('Accept', accept)
        xhr.responseType = responseType
        xhr.addEventListener('load',
          () => resolve(xhr))
        xhr.addEventListener('error',
          () => reject(xhr))
        xhr.send()
      }
    )
  }

/**
 * Returns a promise which resolves on success of the POST,
 * and rejects on failure.
 *
 * Use in an async function like this:
 *   const xhr = await httpPost(path, params)
 *   etc
 *
 * Note how options are deconstructed from the optional
 * third argument with defaults.
 */
Service.prototype.httpPost =
  function(path, params = {}, options = {}) {
    const service = this
    const {
      contentType = 'application/x-www-form-urlencoded;charset=UTF-8',
      accept = 'application/xml',
      responseType = ''
    } = options

    return new Promise(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const url = new URL(service.httpBase)
        const postParams = new URLSearchParams(params)
        url.pathname = path
        xhr.open('POST', url, true)
        xhr.withCredentials = true
        xhr.setRequestHeader('Content-Type', contentType)
        xhr.setRequestHeader('Accept', accept)
        xhr.responseType = responseType
        xhr.addEventListener('load',
          () => resolve(xhr))
        xhr.addEventListener('error',
          () => reject(xhr))
        xhr.send(postParams)
      }
    )
  }
