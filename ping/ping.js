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
 * Utility functions for login, register and client certificate download.
 */

import * as common from '/common/sse.js'

const POD = common.getPod()
const PING_URL = `${POD}/sse/ping`

/**
 * Called on load, gets the ping response from the sse.
 */
export async function init() {
  wireup()

  if (POD) {
    ping()
  }
}

/**
 * Wires up the change pod button.
 */
function wireup() {

  document.querySelector('button[name=change]')
    .addEventListener('click', (event) => {
      const pod = document.querySelector(
        'input[name=pod]').value
      window.location = `?pod=${pod}`
    })

  document.querySelector('button[name=clear]')
    .addEventListener('click', (event) => {
      common.clearPod()
      window.location = window.location.pathname
    })
}

/**
 * Pings the pod and renders the result.
 */
async function ping() {
  document.querySelector('input[name=pod]').value = POD

  const options = {
    accept: 'application/json'
  }

  const xhr = await common.httpGet(PING_URL, {}, {
    accept: 'application/json',
    responseType: 'json'})
  if (xhr.response.tag && xhr.response.tag == "pong") {
    document.body.classList.add('pong')
  }
  else {
    document.body.classList.remove('pong')
  }

  const container = document.querySelector('ping pong')
  Object.entries(xhr.response.attr).forEach(
    ([key, value]) => {
      const attr = document.createElement('attr')
      attr.innerHTML = `
          <key>${key}</key>
          <value>${value}</value>`
      container.appendChild(attr)
    })
}

document.addEventListener('DOMContentLoaded', init)
