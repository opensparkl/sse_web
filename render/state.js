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
import * as render from './render.js'

const LISTENERS = 'listeners'
const OPENERS = 'openers'
const SELECTED_USER = 'selectedUser'

/**
 * On restore, ...
 */
export async function restore() {
  restoreOpeners()
  restoreListeners()
}

/**
 * On save, ...
 */
export function save() {
  saveOpeners()
  saveListeners()
}

/**
 * Restores openers from local storage.
 */
function restoreOpeners() {
  const openers = get(OPENERS, {})
  const  elements =
    document.querySelectorAll('[action="open-close"]');
  [...elements].forEach(
    element => {
      const pathname = element.getAttribute('pathname')
      if (openers[pathname] == 'opened') {
        element.classList.remove('closed')
        element.classList.add('opened')
      }
      else {
        element.classList.remove('opened')
        element.classList.add('closed')
      }
    }
  )
}

/**
 * Saves openers to local storage.
 */
function saveOpeners() {
  const openers = {}
  const elements =
    document.querySelectorAll('[action="open-close"');
  [...elements].forEach(
    element => {
      const pathname = element.getAttribute('pathname')
      if (element.classList.contains('opened')) {
        openers[pathname] = 'opened'
      }
      else {
        openers[pathname] = 'closed'
      }
    }
  )
  put(OPENERS, openers)
}

/**
 * Restores listeners from local storage.
 */
function restoreListeners() {
  const listeners = get(LISTENERS, {})
  const elements = document.querySelectorAll('[pathname]');
  [...elements].forEach(
    element => {
      const pathname = element.getAttribute('pathname')
      if (listeners.hasOwnProperty(pathname)) {
        element.classList.add('listen')
      }
    }
  )
}

/**
 * Iterates through all elements marked as listeners, creating a new
 * map using existing entries (which have the paused state) if present,
 * or creating a new entry with paused=false if not.
 */
function saveListeners() {
  const oldListeners = get(LISTENERS, {})
  const newListeners = {}
  const listenElements = document.querySelectorAll('.listen[pathname]');
  [...listenElements].forEach(
    listenElement => {
      const subject = listenElement.getAttribute('pathname')
      if (oldListeners.hasOwnProperty(subject)) {
        newListeners[subject] = oldListeners[subject]
      }
      else {
        newListeners[subject] = false
      }
    }
  )
  put(LISTENERS, newListeners)
}
