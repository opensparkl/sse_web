/**
  * Copyright (c) 2018 SPARKL Limited. All Rights Reserved.
  * Licensed under the Apache License, Version 2.0 (the "License")
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
  * Supporting Javascript for listen webpage.
  */

import * as state from './state.js'
import * as common from '../common/sse.js'

const POD = common.getPod()
const ORIGIN = window.location.origin
const LISTEN_PATH = '/sse_listen/websocket/'
const LISTEN_PREFIX = `${POD.replace('http','ws')}${LISTEN_PATH}`

/**
 * On init, wire up the button event handlers.
 */
function init() {
  const wireup = [
    ['button[name=limit]', limit_history],
    ['button[name=clear]', clear_history]
  ]

  wireup.forEach(
    ([selector, callback]) =>
      document.querySelector(selector).onclick = callback)
}

/*
 * Linked to the add listen subject button.
 */
function add_listeners(event) {
  const input =
    document.querySelector(
      'input[name=add]')

  input.value
    .split(' ')
    .forEach(
      function(subject) {
        add_listener(
          subject)
      })

  input.value = null
}

/*
 * Adds a listener column. The subject is not added if
 * it is undefined or already present.
 *
 * If paused is true, then the listener websocket is not
 * connected immediately.
 */
export function add_listener(subject, paused) {
  if (!subject || get_listener(subject)) {
    return
  }

  const listener =
    clone_template(
      'listener')
  const header =
    listener.querySelector(
      'header .name')

  listener.local = {
    subject: subject
  }
  header.textContent = trim_path(subject, 25)
  listener.setAttribute(
    'subject', subject)
  header.setAttribute(
    'title', subject)

  render_listener(listener)

  if (!paused) {
    start_listener(listener)
  }
}

/**
 * Trims the path to show the last path segments that
 * fit in the specified number of characters.
 */
function trim_path(subject, maxlen) {
  const segs = subject.split('/')
  let path = null

  while (segs.length > 0) {
    let seg = segs.pop()
    let nextpath = path ? seg + '/' + path : seg
    if (nextpath.length < maxlen) {
      path = nextpath
    }
    else {
      break
    }
  }

  return path
}

/**
 * Gets the listener element for the subject. The
 * listener-local data is stored on that element.
 */
function get_listener(subject) {
  const element =
    document.querySelector(
      `listener[subject='${subject}']`)
  return element
}

/**
 * Deletes the listener element, closing the websocket first.
 */
function remove(listener) {
  const listeners =
    document.querySelector(
      'listeners')

  if (isConnected(listener)) {
    listener.local.ws.close()
  }
  listeners.removeChild(
    listener)
}

/**
 * Pauses (disconnects) or starts (connects) the listener element.
 */
function toggleListener(listener) {
  if (isConnected(listener)) {
    stop_listener(listener)
  }
  else {
    start_listener(listener)
  }
}

/**
 * Returns true if the listener websocket is connected,
 * otherwise false.
 */
function isConnected(listener) {
  return listener.local.ws && (
    listener.local.ws.readyState == 0
    || listener.local.ws.readyState == 1)
}

/**
 * Sets up the listener element which is on the document,
 * and wires up the click events.
 */
function render_listener(listener) {
  const listeners =
    document.querySelector(
      'listeners')
  listener.local.ws_url = new URL(
    `${LISTEN_PREFIX}${listener.local.subject}`)

  listeners.appendChild(
    listener)

  listener.querySelector(
    'header .icon.clear').onclick =
      event => clear_history_bar(listener, 0)

  listener.querySelector(
    'header .icon.close').onclick =
      event => remove(listener)

  listener.querySelector(
    'header .icon.pause').onclick =
      event => toggleListener(listener)
}

/**
 * Starts the listener element by creating the websocket.
 * Opens a cookie session if not already present, to work
 * around the bug where IOS fails to honour TLS client certs.
 */
function start_listener(listener) {
  common.tlsAutoCookieSession(true).then(
    () => {
      listener.local.ws =
        new WebSocket(listener.local.ws_url)

      listener.local.ws.onopen =
        event => onopen(event, listener)

      listener.local.ws.onclose =
        event => onclose(event, listener)

      listener.local.ws.onmessage =
        event => onmessage(event, listener)

      listener.local.ws.onerror =
        event => onerror(event, listener)
    })
}

/**
 * Stops the listener element by closing the websocket.
 */
function stop_listener(listener) {
  if (isConnected(listener)) {
    listener.local.ws.close()
  }
}

/*
 * Websocket open has event and listener element args.
 */
function onopen(event, listener) {
  listener.classList.remove(
    'disconnected')
}

/*
 * Websocket close has event and listener element args.
 */
function onclose(event, listener) {
  listener.classList.add(
    'disconnected')
}

/*
 * Websocket message has event and listener element args.
 * All messages are structs with tag, attr and nested content.
 */
function onmessage(event, listener) {
  const events =
    listener.querySelector('events')
  const message =
    struct_to_element(
      JSON.parse(
        event.data))
  const limit =
    get_history_limit()
  clear_history_bar(
    listener, limit - 1)
  incr_trip(
    listener)
  incr_odo(
    listener)
  events.appendChild(message)
}

/*
 * Websocket error has event and listener element args.
 */
function onerror(event, listener) {
  // No action.
}

/*
 * Struct object with tag, attr, content is converted to HTML using the
 * struct template element.
 */
function struct_to_element(struct) {
  const element =
    clone_template(
      'struct')

  console.log(struct)

  // Tag is used as class and text content.
  element.classList.add(
    struct.tag)

  // Struct messages are closed by default.
  element.classList.add(
    'closed')

  element.querySelector('header > span.icon').onclick =
    toggle

  element.querySelector('header > span.tag').textContent =
    struct.tag

  let name = struct.attr.name ? struct.attr.name : ""
  if (struct.attr[struct.tag]) {
    name = struct.attr[struct.tag].replace(/.+\//, "")
  }
  element.querySelector('header > span.name').textContent =
    name

  // Each attribute is an attr element under attrs.
  Object.keys(struct.attr || {}).forEach(
    function(key) {
      const val = struct.attr[key]
      const tr =
        clone_template(
          'attr')
      tr.querySelector('td.attr-name')
        .textContent = key
      tr.querySelector('td.attr-value')
        .textContent = val
      element.querySelector('table.attributes')
        .appendChild(tr)
    })

  // Content is recursively processed.
  Object.keys(struct.content || []).forEach(
    function(i) {
      const child = struct.content[i]
      const child_element =
        struct_to_element(
          child)
      element.querySelector('content')
        .appendChild(child_element)
    })

  return element
}

/*
 * Utility function returns clone of named template element.
 */
function clone_template(template_id) {
  const template =
    document.querySelector(
      `template#${template_id}`)

  // Exact return value of querySelector varies by browser.
  const clone =
    document.importNode(
      template.firstElementChild ||
      template.content.firstElementChild, true)
  return clone
}

/*
 * Toggles the opened or closed class.
 */
function toggle(event) {
  const struct =
    document.evaluate(
      'ancestor::struct[1]',
      event.target, null, null, null).iterateNext()

  struct.classList.toggle('opened')
  struct.classList.toggle('closed')
}

/**
 * Clears the content of all listeners.
 */
function clear_history(event) {
  clear_histories_bar(0)
}

/**
 * Clears the content of all listeners to the
 * history limit.
 */
function limit_history(event) {
  clear_histories_bar(
    get_history_limit())
}

/**
 * Returns the history length limit.
 */
function get_history_limit() {
  return Number(
    document.querySelector(
      'input[name=limit]').value)
}

/**
 * Clears the content of all listeners bar the latest
 * 'count' entries.
 */
function clear_histories_bar(count) {
  const listeners =
    document.querySelectorAll(
      'listeners listener')

  listeners.forEach(
    function(listener) {
      clear_history_bar(
        listener, count)
    }
  )
}

/**
 * Clears the content of the specified listener bar
 * the latest 'count' entries.
 */
function clear_history_bar(listener, count) {
  const events =
    listener.querySelector('events')

  while (events.children.length > count) {
    events.removeChild(
      events.firstElementChild)
  }

  if (count == 0) {
    reset_trip(
      listener)
  }
}

/**
 * Increments the trip counter for the listener.
 */
function incr_trip(listener) {
  const trip =
    listener.querySelector(
      'stats trip')
  const current = Number(
    trip.textContent)
  trip.textContent =
    current + 1
}

/**
 * Increments the odometer counter for the listener.
 */
function incr_odo(listener) {
  const odo =
    listener.querySelector(
      'stats odo')
  const current = Number(
    odo.textContent)
  odo.textContent =
    current + 1
}

/**
 * Resets the trip counter to the specified value
 * for the given listener.
 */
function reset_trip(listener) {
  listener.querySelector(
    'stats trip').textContent = 0
}

/**
 * Init and restore page state on load.
 * Save page state on unload.
 */
document.addEventListener('DOMContentLoaded', init)
document.addEventListener('DOMContentLoaded', state.restore)
window.addEventListener('pagehide', state.save)
