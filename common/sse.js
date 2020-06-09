/**
 * Copyright 2019 Onfido Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Utility functions for sse HTML pages.
 */

/**
 * Returns the pod URL from session storage, or null if not available.
 * If pod is present as a query parameter, it is used to set the
 * the session storage value to that value before returning.
 *
 * The pod needs to be a URL of the form:
 *     http://localhost:8000
 * or  https://some.pod.id
 */
export function getPod() {
  const searchParams =
    (new URL(document.location)).searchParams
  if (searchParams.get('pod')) {
    sessionStorage.setItem('pod', searchParams.get('pod'))
  }

  return sessionStorage.getItem('pod')
}

/**
 * Clears the pod name from session storage.
 */
export function clearPod() {
  sessionStorage.clear('pod')
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
export function httpGet(urlstring, params = {}, options = {}) {
  let {
    accept = 'application/xml',
    responseType = ''
  } = options

  return new Promise(
    function(resolve, reject) {
      const xhr = new XMLHttpRequest()
      const url = new URL(urlstring)
      url.search = new URLSearchParams(params).toString()
      xhr.open('GET', url, true)
      xhr.withCredentials = true
      xhr.setRequestHeader('Accept', accept)
      xhr.responseType = responseType
      xhr.onload =
        () => resolve(xhr)
      xhr.onerror =
        () => reject(xhr)
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
export function httpPost(urlstring, params = {}, options = {}) {
  let {
    contentType = 'application/x-www-form-urlencoded;charset=UTF-8',
    accept = 'application/xml',
    responseType = ''
  } = options

  return new Promise(
    function(resolve, reject) {
      const xhr = new XMLHttpRequest()
      const url = new URL(urlstring)
      const postParams = new URLSearchParams(params)
      xhr.open('POST', url, true)
      xhr.withCredentials = true
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.setRequestHeader('Accept', accept)
      xhr.responseType = responseType
      xhr.onload =
        () => resolve(xhr)
      xhr.onerror =
        () => reject(xhr)
      xhr.send(postParams)
    }
  )
}

/**
 * Serialises the object and puts it in the localstorage under
 * the given key.
 */
export function put(key, value) {
  window.localStorage.setItem(key,
    JSON.stringify(value))
}

/**
 * Retrieves and deserialises the localstorage item under the
 * given key, or the defaultValue if not present.
 */
export function get(key, defaultValue) {
  const value = window.localStorage.getItem(key)
  if (value === null) {
    return defaultValue
  }
  else {
    return JSON.parse(value)
  }
}

/**
 * If no cookie session is established but there is a TLS session
 * secured by client certificate, then establishes a cookie session
 * for that same user.
 *
 * This is required by Safari websockets on IOS, which fail to
 * support TLS connections secured by client certificate.
 *
 * Hence the appleOnly flag: if this is set, then we test for the
 * buggy combination of Safari and iPhone/iPad before doing the
 * workaround.
 */
export async function tlsAutoCookieSession(appleOnly) {
  const needsWorkAround =
    /(iPhone)|(iPad)/g.test(navigator.platform) &&
    /Apple/g.test(navigator.vendor)

  if (appleOnly && !needsWorkAround) {
    return
  }

  const xhr = await httpGet("/sse_cfg/user")
  const connectionType = xhr.responseXML.evaluate(
    '//prop[@name="connection"]/@type', xhr.responseXML,
    null, XPathResult.STRING_TYPE, null).stringValue
  if (connectionType == 'client_cert') {
    await httpPost("/sse_cfg/user")
    console.warn("Cookie session opened automatically")
  }
}

/**
 * Returns the first element matching the document xpath with
 * the given context.
 */
export function selectOne(xpath, context) {
  return document.evaluate(xpath, context).iterateNext()
}

/**
 * Returns a new array of elements matching the document xpath
 * with the given context.
 */
export function selectAll(xpath, context) {
  let result = []
  const selection =
    document.evaluate(xpath, context)
  for (let next; next = selection.iterateNext(); ) {
    result.push(next)
  }
  return result
}

/**
 * Add menu expander event handler. This only gets invoked when
 * the expander element is displayed on a small screen.
 */
function init() {
  const expander =
    document.querySelector(
      'menu right expander')
  if (expander) {
    expander.addEventListener(
      'click', () =>
        document.querySelector('menu right')
          .classList.toggle('expand'))
  }
}

document.addEventListener('DOMContentLoaded', init)
