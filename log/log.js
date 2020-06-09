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
  * Supporting Javascript for log webpage.
  */

import * as common from '/common/sse.js'

const LOG_PATH = '/sse_log/log'

/**
 * On init, wire up the select box and retrieve the log.
 */
export function init() {
  const typeSelector = document.querySelector('select[name=type]')
  typeSelector.addEventListener('change',
    function(event) {
      get_log()
    })

  get_log()
}

/**
 * Retrieve the log and populate the content.
 */
async function get_log() {
  const type = document.querySelector('select[name=type]').value
  const content = document.querySelector('log > content')
  const url = `${common.getPod()}${LOG_PATH}`
  const xhr = await common.httpGet(url, {
    type: type})
  if (xhr.status == 200) {
    content.textContent = xhr.responseText
  }
  else {
    content.textContent = 'Must be administrator to view logs'
  }
}

document.addEventListener('DOMContentLoaded', init)
