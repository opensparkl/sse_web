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
 * Search functions for SPARKL render.
 */


// Search state holds an array of matched elements and the index of the
// current search element in that array.
const SearchState = {
  matched: [],
  current: 0
}

/**
 * Search is done on each keyup in the search input box, and cancelled
 * on clear.
 *
 * The document listens to keydown, and responds only to
 * the N key (for Next) and P key (for Previous) iff a search is
 * currently active.
 */
export function init() {
  document.querySelector('menu input[name=search]')
    .addEventListener('keyup', initSearch)
  document.querySelector('menu button[name=next]')
    .addEventListener('click', nextSearch)
  document.addEventListener('keydown', keyNPCSearch)
  document.querySelector('menu button[name=clear]')
    .addEventListener('click', clearSearch)
  clearSearch()
}

/**
 * Apply changed search string.
 */
function initSearch(event) {
  const term = event.target.value.toLowerCase()
  const all = document.querySelectorAll(
    'service,field,notify,solicit,response,request,reply,consume,folder,mix,prop')
  SearchState.matched = [...all].filter(
    element =>
      element.getAttribute('name').toLowerCase().includes(term))
  SearchState.current = undefined
  document.querySelector('menu span[name=index]')
    .textContent = ''
  document.querySelector('menu span[name=matches]')
    .textContent = SearchState.matched.length
  document.querySelectorAll('.highlight')
    .forEach(
      element =>
        element.classList.remove('highlight'))
}


/**
 * If the N(ext), P(revious) or C(lear) key is pressed outside the search
 * input box and while a search is active, handles the keystroke.
 */
function keyNPCSearch(event) {
  const key = event.key.toLowerCase()

  if (event.target == document.querySelector('menu input[name=search'))
    return

  if (SearchState.current == undefined)
    return

  if (key == 'n') {
    nextSearch()
  }

  if (key == 'p') {
    prevSearch()
  }

  if (key == 'c') {
    clearSearch()
  }
}

/**
 * Search is active if the current index is an integer.
 * It is inactive if the current index is undefined.
 *
 * A search becomes active when the Next button is clicked.
 * It becomes inactive when the search term is changed or the
 * Clear button is clicked.
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

    continueSearch(oldIndex, newIndex)
  }
}

/**
 * Selects and highlights the previous match in the search state.
 */
function prevSearch() {
  const {
    matched,
    current: oldIndex
  } = SearchState

  let newIndex

  if (oldIndex == 0) {
    newIndex = matched.length -1
  }
  else {
    newIndex = oldIndex - 1
  }

  continueSearch(oldIndex, newIndex)
}

/**
 * Switches the search highlight from the old index to the new index.
 */
function continueSearch(oldIndex, newIndex) {
  const matched = SearchState.matched
  SearchState.current = newIndex
  document.querySelector('menu span[name=index]')
    .textContent = newIndex + 1
  unhighlight(matched[oldIndex])
  highlight(matched[newIndex])
  view(matched[newIndex])
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
  if ([
      'field',
      'service',
      'folder',
      'mix',
      'prop'].includes(tag)) {
    return element
  }
  else if ([
      'notify',
      'solicit',
      'response',
      'request',
      'reply',
      'consume'].includes(tag)) {
    return element.closest('td')
  }

  throw("Unsupported element: " + element.localName)
}

/**
 * Opens the path and scrolls the element into view.
 */
function view(element) {
  let el = element
  let block = 'nearest'
  while (el.localName != 'source') {
    if (el.classList.contains('closed')) {
      el.classList.remove('closed')
      el.classList.add('opened')
    }
    el = el.parentElement
  }

  if ([
      'folder',
      'mix'].includes(element.localName)) {
    block = 'start'
  }

  element.scrollIntoView({
    behavior: 'smooth',
    block: block
  })
}

/**
 * Clear the search term and cancel any search in progress.
 */
function clearSearch() {
  document.querySelector('menu input[name=search]')
    .value = ''
  initSearch({target: {value: ''}})
}
