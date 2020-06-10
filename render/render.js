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
 * Utility functions for SPARKL render.
 */

import * as common from '/common/sse.js'
import * as state from './state.js'

const POD = common.getPod()
const ORIGIN = window.location.origin
const RENDER_XSL = `${ORIGIN}/render/render.xsl`
const SOURCE_PREFIX = `${POD}/sse_cfg/source/`
const USER_XHR = `${POD}/sse_cfg/user`
const USERS_XHR = `${POD}/sse_cfg/users`

/**
 * Called on load.
 */
async function init() {
  await users()
  state.restore()
  activateRender()
}

/**
 * Retrieves the current user, and if administrator all further users
 * defined in the configuration tree.
 *
 * Renders each user tree in a separate container.
 *
 * Returns a single promise that resolves when all the user trees
 * have rendered.
 */
async function users() {
  const options = {
    accept: 'application/json',
    responseType: 'json'
  }
  const pod = common.getPod()
  const userXhr = await common.httpGet(USER_XHR, {}, options)
  const currentUser = userXhr.response
  const users = [currentUser]

  if (currentUser.attr.administrator) {
    const usersXhr = await common.httpGet(USERS_XHR, {}, options)
    usersXhr.response.content.forEach(
      user => {
        if (user.attr.name != currentUser.attr.name) {
          users.push(user)
        }
      }
    )
  }

  // Collect the promises of all user source renders, aggregated
  // into a single promise that resolves on completion of them all.
  // Pre-creating the container 'source' elements preserves order.
  const root = document.querySelector('sources')
  const promises = []
  users.forEach(
    user => {
      const name = user.attr.name
      const element = document.createElement('source')
      root.appendChild(element)
      promises.push(
        source(user.attr.name, element))
    }
  )
  return Promise.all(promises)
}


/**
 * Submits the source request for the selected user
 * and renders it into the supplied parent element.
 */
async function source(username, parent) {
  const select = document.querySelector('select[name=users]')
  const url = `${SOURCE_PREFIX}${username}/`
  const xhr = await common.httpGet(url)
  await render(xhr.responseXML, parent)
}

/**
 * Applies render.xsl to the xml, placing the result
 * in the parent element.
 */
async function render(xml, parent) {
  const processor = new XSLTProcessor()
  const xhr = await common.httpGet(RENDER_XSL)
  const xsl = xhr.responseXML
  processor.importStylesheet(xsl)
  const fragment = processor.transformToFragment(
    xml, document)
  if (parent.firstElementChild) {
    parent.removeChild(parent.firstElementChild)
  }
  parent.appendChild(fragment)
}

/**
 * Attach open/close event handler to icons, and clipboard
 * append/remove event handler to element names.
 */
async function activateRender() {
  document.querySelector('menu button[name=open-all]')
    .addEventListener('click', openAll)
  document.querySelector('menu button[name=close-all]')
    .addEventListener('click', closeAll)

  // Activate open/close icons.
  const icons = document.getElementsByClassName('icon open-close');
  [...icons].forEach(icon => {
    icon.onclick = function(event) {
      const container = common.selectOne(
        'ancestor::*[@action="open-close"][1]', icon)
      if (container) {
        if (container.classList.contains('opened')) {
          container.classList.remove('opened')
          container.classList.add('closed')
        }
        else {
          container.classList.remove('closed')
          container.classList.add('opened')
        }
      }
    }
  })

  // Activate listener toggle.
  document.querySelectorAll('header > span.name')
    .forEach(span => {
      span.onclick = function(event) {
        const container = common.selectOne(
            'ancestor::*[@pathname][1]', span)
        if (container) {
          container.classList.toggle('listen')
        }
      }
    }
  )

  // Append ?pod=POD[:port] to app hrefs ending in ".html" for one-click start
  // of linked apps.
  document.querySelectorAll('prop[name=catalog] a.href')
    .forEach(app => {
      const href = app.getAttribute('href')
      app.setAttribute('href', `${href}?pod=${POD}`)
    }
  )

  // Activate service hover.
  document.querySelectorAll('service')
    .forEach(service => {
      const name = service.getAttribute('name')
      const folder =
        common.selectOne(
          '(ancestor::folder|ancestor::mix)[last()]', service)
      const ops =
        common.selectAll(
          `descendant::table
            [@class="operation"]
            [descendant::*[@service="${name}" or @clients="${name}"]]`, folder)
      service.addEventListener('mouseover',
        () =>
          ops.forEach( op => op.classList.add('highlight')))
      service.addEventListener('mouseout',
        () =>
          ops.forEach( op => op.classList.remove('highlight')))
      })

  // Activate field hover.
  document.querySelectorAll('field')
    .forEach(field => {
      const name = field.getAttribute('name')
      const folder =
        common.selectOne(
          '(ancestor::folder|ancestor::mix)[last()]', field)
      const eventFields =
        common.selectAll(
          `descendant::table
            [@class="operation"]
            //div
              [@class="field"]
              [@name="${name}"]`, folder)
      field.addEventListener('mouseover',
        () =>
          eventFields.forEach( eventField => eventField.classList.add('highlight')))
      field.addEventListener('mouseout',
        () =>
          eventFields.forEach( eventField => eventField.classList.remove('highlight')))
      })
}

/**
 * Expand all closeable elements.
 */
function openAll() {
  const selector = 'folder[action=open-close],mix[action=open-close]'
  document.querySelectorAll(selector).forEach(
    element => {
      element.classList.remove('closed')
      element.classList.add('opened')
    }
  )
}

/**
 * Contract all closeable elements.
 */
function closeAll() {
  const selector = 'folder[action=open-close],mix[action=open-close]'
  document.querySelectorAll(selector).forEach(
    element => {
      element.classList.remove('opened')
      element.classList.add('closed')
    }
  )
}

/**
 * Init on load.
 * Restore page state is invoked in-line.
 * Save page state on unload.
 */
document.addEventListener('DOMContentLoaded', init)
window.addEventListener('pagehide', state.save)
