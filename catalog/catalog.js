/**
 * Copyright 2020 Onfido Limited
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
 * Utility functions for the integration catalog page for a pod.
 *
 * Catalog entries look like this:
 * <prop name='catalog'
 *  publisher='Acme'
 *  class='user'
 *  label='A useful integration'
 *  href='http://acme.com/useful/integration.html'>
 *  Short description can be included in prop content.
 * </prop>
 *
 * where the class= attribute is used to filter entries as follows:
 *
 *   user     - UI routinely initiated by the owner.
 *   admin    - Administrative UI routinely initiated by the owner.
 *   external - UI initiated by external events, such as login.
 */
import * as common from '/common/sse.js'

const POD = common.getPod()
const ORIGIN = window.location.origin
const SOURCE_XHR = `${POD}/sse_cfg/source/`
const CATALOG_XHR = `${ORIGIN}/catalog/catalog.xsl`

/**
 * Downloaded source and XSLT are retained to allow re-rendering
 * on dropdown selection.
 */
let source
let xsl

/**
 * Initialises the page by loading the pod configuration source
 * and filtering out all <prop name='catalog'../> entries.
 */
async function init() {
  const sourceXhr = await common.httpGet(SOURCE_XHR)
  const classParam = (new URL(window.location)).searchParams.get('class')
  const xslXhr = await common.httpGet(CATALOG_XHR)

  source = sourceXhr.responseXML
  xsl = xslXhr.responseXML

  render(classParam ? classParam : 'all')
}

/*
 * Applies the catalog xsl to the source xml to generate the
 * catalog HTML, and replaces the catalog element with the result.
 */
async function render(classParam) {
  const processor = new XSLTProcessor()
  const pod = common.getPod()

  processor.importStylesheet(xsl)
  processor.setParameter(null, 'pod', pod)
  processor.setParameter(null, 'class', classParam)

  const catalog = processor.transformToFragment(
    source, document)
  addPublisherIcons(catalog);

  document.querySelector('catalog').replaceWith(catalog)
  document.querySelector(`class[name=${classParam}]`)
    .classList.add('selected')
  wireupClassClickListener()
  wireupEntryClickListener()
}

/**
 * Adds icons to publisher headers where domain is specified.
 */
const GOOGLE_USER_CONTENT =
  'https://s2.googleusercontent.com/s2/favicons'

async function addPublisherIcons(catalog) {
  [...catalog.querySelectorAll('publisher[domain]')].forEach(
    (publisher) => {
      const domain = publisher.getAttribute('domain')
      const img = document.createElement('img')
      img.setAttribute('src', `${GOOGLE_USER_CONTENT}?domain=${domain}`)
      publisher.querySelector('header').prepend(img)
    })
}

/**
 * Wires up the change event handler to the class selector.
 */
function wireupClassClickListener() {
  document.querySelectorAll('classes class').forEach(
    (element) =>
      element.addEventListener('click',
        () => render(element.getAttribute('name'))
      )
    )
}

function wireupEntryClickListener() {
  document.querySelectorAll('entry[href]').forEach(
    (element) =>
      element.addEventListener('click',
        () => window.location = element.getAttribute('href')
      )
    )
}

/*
 * Init on page load complete.
 */
document.addEventListener(
  'DOMContentLoaded', init)
