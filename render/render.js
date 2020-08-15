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

import * as common from '../common/sse.js'
import * as state from './state.js'

const POD = common.getPod()
const RENDER_XSL = new URL('render.xsl', window.location).href
const SOURCE_PREFIX = `${POD}/sse_cfg/source/`
const USER_XHR = `${POD}/sse_cfg/user`
const USERS_XHR = `${POD}/sse_cfg/users`

// Search state holds an array of matched elements and the index of the
// current search element in that array.
const SearchState = {
  matched: [],
  current: 0
}

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

  // Search is done on each keyup, and cancelled on clear.
  document.querySelector('menu input[name=search]')
    .addEventListener('keyup', search)
  document.querySelector('menu button[name=next]')
    .addEventListener('click', nextSearch)
  document.querySelector('menu button[name=clear]')
    .addEventListener('click', clearSearch)
  clearSearch()


  // Activate open/close icons.
  document.querySelectorAll('.icon.open-close')
    .forEach(icon => {
      icon.onclick = function(event) {
        const container = icon.closest(
          '*[action="open-close"]')
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
    }
  )

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
          ops.forEach(op => op.classList.add('highlight')))
      service.addEventListener('mouseout',
        () =>
          ops.forEach(op => op.classList.remove('highlight')))
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
          eventFields.forEach( eventField =>
            eventField.classList.add('highlight')))
      field.addEventListener('mouseout',
        () =>
          eventFields.forEach( eventField =>
            eventField.classList.remove('highlight')))
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
  const selector = '*[action=open-close]'
  document.querySelectorAll(selector).forEach(
    element => {
      element.classList.remove('opened')
      element.classList.add('closed')
    }
  )
}

/**
 * Apply changed search string.
 */
function search(event) {
  const term = event.target.value.toLowerCase()
  const all = document.querySelectorAll(
    'service,field,notify,solicit,request,consume,folder,mix,prop')
  SearchState.matched = [...all].filter(
    element =>
      element.getAttribute('name').toLowerCase().includes(term))
  SearchState.current = undefined
  document.querySelector('menu span[name=matches]')
    .textContent = SearchState.matched.length
}

/**
 * Go to the next (or first) index in the search match list, unless empty.
 */
function nextSearch() {
  const {
    matched,
    current: oldIndex
  } = SearchState
  let newIndex

  if (matched.length) {
    if (oldIndex == undefined || oldIndex == matched.length - 1) {
       newIndex = 0
    }
    else {
      newIndex = oldIndex + 1
    }

    SearchState.current = newIndex
    document.querySelector('menu span[name=index]')
      .textContent = newIndex + 1

    unhighlight(matched[oldIndex])
    highlight(matched[newIndex])
    view(matched[newIndex])
  }
}

/**
 * Unhighlights the matched item at the given index, or no action if
 * index is undefined.
 */
function unhighlight(element) {
  if (element == undefined) {
    return
  }
  const highlight = highlightable(element)
  highlight.classList.remove('highlight')
}

/**
 * Highlights the current search element.
 */
function highlight(element) {
  const highlight = highlightable(element)
  highlight.classList.add('highlight')
}

/**
 * Returns the highlight-able element appropriate to the supplied
 * element.
 */
function highlightable(element) {
  const tag = element.localName

  if (['field', 'service', 'folder', 'mix', 'prop'].includes(tag)) {
    return element
  }
  else if (['notify', 'solicit', 'request', 'consume'].includes(tag)) {
    return element.closest('table.operation')
  }

  throw("Unsupported element: " + selected)
}

/**
 * Opens the path and scrolls the element into view.
 */
function view(element) {
  let el = element
  while (el.localName != 'source') {
    if (el.classList.contains('closed')) {
      el.classList.remove('closed')
      el.classList.add('opened')
    }
    el = el.parentElement
  }

  element.scrollIntoView({
    behavior: 'smooth'
  })
}

/**
 * Clear the search term, and simulate the keyup event directly.
 */
function clearSearch() {
  const input = document.querySelector('menu input[name=search]')
  input.value = ''
  document.querySelector('menu span[name=index]')
    .textContent = ''
  document.querySelectorAll('.highlight')
    .forEach(
      element =>
        element.classList.remove('highlight'))
  search({target: {value: ''}})
}

/**
 * Init on load.
 * Restore page state is invoked in-line.
 * Save page state on unload.
 */
document.addEventListener('DOMContentLoaded', init)
window.addEventListener('pagehide', state.save)
