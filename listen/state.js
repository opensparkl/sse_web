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
 * State functions for render page.
 */

import {get, put} from '../common/sse.js'
import {add_listener} from './listen.js'

const LISTENERS = 'listeners'
const ROW_LIMIT = 'rowLimit'
/**
 * On save, put listeners into local storage.
 */
export function save() {
  save_settings()
  save_listeners()
}

/**
 * On restore, read and add listeners from local storage.
 */
export function restore() {
  restore_settings()
  restore_listeners()
}

/**
 * Save paused state
 */
function save_settings() {
  const rowLimit =
    document.querySelector('input[name=limit]').value
  put(ROW_LIMIT, rowLimit)
}

/**
 * Restore settings
 */
function restore_settings() {
  const element = document.querySelector('input[name=limit]')
  const rowLimit = get(ROW_LIMIT, element.value)
  element.value = rowLimit
}

/**
 * Save listeners.
 */
function save_listeners() {
  const listeners = {}
  const listenerElements = document.querySelectorAll('listener');
  [...listenerElements].forEach(
    listener => {
      const subject = listener.getAttribute('subject')
      const paused = listener.classList.contains('disconnected')
      listeners[subject] = paused
    })
  put(LISTENERS, listeners)
}

/**
 * Restore listeners.
 */
 function restore_listeners() {
  const listeners = get(LISTENERS)
  Object.entries(listeners).forEach(
    ([subject, paused]) =>
      add_listener(subject, paused))
 }
