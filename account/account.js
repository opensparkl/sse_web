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

import * as common from '../common/sse.js'

const POD = common.getPod()
const ORIGIN = window.location.origin
const USER_XHR = `${POD}/sse_cfg/user`
const LOGOUT_XHR = `${POD}/sse_cfg/signout`
const REGISTER_XHR = `${POD}/sse_cfg/register`
const CERT_XHR = `${POD}/sse_cfg/cert`
const RENDER_PAGE = `${ORIGIN}/render/render.html`
const UNKNOWN_USER = 'unknown@unknown.domain'

const LISTENERS = 'listeners'
const OPENERS = 'openers'

const PEM_MIME_TYPE = 'application/pem-certificate-chain'
const P12_MIME_TYPE = 'application/pkcs12'

/**
 * Called on load. Thie wires up events and gets the user, which
 * can be unknown, logged in using cookie_session, or connected
 * using client_cert.
 *
 * In the latter two cases, the body element has the class
 * cookie_session or client_cert added.
 */
export async function init() {
  document.querySelector('button[name=login]')
    .addEventListener('click', login)
  document.querySelector('button[name=logout')
    .addEventListener('click', logout)
  document.querySelector('button[name=register]')
    .addEventListener('click', register)
  document.querySelector('button[name=cert]')
    .addEventListener('click', cert)

  if (common.getPod()) {
    const xhr = await common.httpGet(USER_XHR, {}, {
      accept: 'application/json',
      responseType: 'json'
    })

    const user = xhr.response

    document.body.classList.remove(
      'no_user', 'client_cert', 'cookie_session')

    if (user.attr.name == UNKNOWN_USER) {
      document.body.classList.add('no_user')
    }
    else {
      for (let item of user.content || []) {
        if (item.tag == 'prop' && item.attr.name == 'connection') {
          document.body.classList.add(item.attr.type)
        }
      }
    }

    document.querySelector('header user').textContent =
      user.attr.name
  }
}

/**
 * Performs cookie session login, alerts error on failure.
 *
 * If the name input is empty, a credential-less signin is posted,
 * which will succeed if the connection is authenticated with a
 * client certificate.
 */
async function login() {
  const name = document.querySelector(
    'account input.name')
  const password = document.querySelector(
    'account input.password')

  let data = {}
  if (name.value) {
    data = {
      email: name.value,
      password: password.value}
  }

  const xhr = await common.httpPost(USER_XHR, data)
  if (xhr.status == 200) {
    window.location.reload()
  }
  else {
    alert('Invalid credentials')
  }
}

/**
 * Performs cookie session logout.
 */
async function logout() {
  await common.httpPost(LOGOUT_XHR)
  common.put(LISTENERS, {})
  common.put(OPENERS, {})
  window.location.reload()
}

/**
 * Performs register, alerts error on failure.
 */
async function register() {
  const name = document.querySelector('account input.name')
  const password = document.querySelector('account input.password')
  const xhr = await common.httpPost(REGISTER_XHR, {
    email: name.value,
    password: password.value})
  password.value = ''
  if (xhr.status == 200) {
    window.location.reload()
  }
  else {
    alert('Invalid credentials')
  }
}

/**
 * Retrieves client certificate file.
 */
async function cert() {
  const name = document.querySelector('account input.name')
  const password = document.querySelector('account input.password')
  const format = document.querySelector('account select[name=format]')
  const mimetype = {
    'pem': PEM_MIME_TYPE,
    'p12': P12_MIME_TYPE}
  const xhr = await common.httpPost(CERT_XHR,
    {
      email: name.value,
      password: password.value,
      format: format.value},
    {
      accept: mimetype[format.value],
      responseType: 'blob'})
  password.value = ''
  if (xhr.status == 200) {
    save_response(xhr)
  }
  else {
    alert('Invalid credentials')
  }
}

/**
 * To save to file:
 * - Create a local Object URL with the data.
 * - Create a download <a/> referencing it.
 * - Auto-click the link.
 * Weird. But it works. Note we attempt to guess the illegal
 * filename chars that the browser will likely replace in the
 * actual filename.
 */
function save_response(xhr) {
  const data = xhr.response
  const mimetype = xhr.getResponseHeader('Content-Type')
  const illegalChars = /\\|\/|\:|\*|\?|\"|\<|\>|\|/g
  const filename = get_filename(xhr)
    .replace(illegalChars, '_')
  const blob = new Blob([data], {type: mimetype})
  const URL = window.URL || window.webkitURL
  const downloadUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  setTimeout(
    () => URL.revokeObjectURL(downloadUrl), 100)
  document.body.removeChild(anchor)
}

/**
 * Extract filename from response content-disposition header.
 */
function get_filename(xhr) {
  const disposition = xhr.getResponseHeader('Content-Disposition')
  const regex = /filename=(\S+)/
  const filename = disposition.match(regex)[1]
  return filename
}

document.addEventListener('DOMContentLoaded', init)
