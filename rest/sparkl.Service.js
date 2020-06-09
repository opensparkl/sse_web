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
 * Simple library to support service implementations
 * over svc_rest websockets.
 *
 * The websocket event messages are very simple, so you don't
 * need to use this library at all. But it provides a callback
 * idiom for solicit/response and request[consume]/reply
 * which keeps user code nice and trivial.
 */

if (typeof sparkl == "undefined") {
  sparkl = {};
}

sparkl.Service =
  function(base, href, impl) {
    this.init(base, href, impl);
  };

/**
 * Initialise object properties.
 */
sparkl.Service.prototype.init =
  function(base, href, impl) {
    this.ws_url =
      [base, "svc_rest/websocket", href].join("/");

    // Pending solicits.
    this.pending = {};

    // Empty implementation if not supplied.
    this.impl = impl ? impl : {};

    this.open();
  };

/**
 * User defined. Called back when connection opened.
 */
sparkl.Service.prototype.onopen =
  function() {};

/**
 * User defined. Called back when connection closed.
 */
sparkl.Service.prototype.onclose =
  function() {};

/**
 * User defined. Called back when connection error occurs.
 */
sparkl.Service.prototype.onerror =
  function() {};

/**
 * User defined callbacks on request and consume events.
 */
sparkl.Service.prototype.impl =
  {};

/**
 * Dispatches a notify event on the websocket.
 */
sparkl.Service.prototype.notify =
  function(message) {
    this.ws.send(
      JSON.stringify(message));
  };

/**
 * Dispatches a solicit event and invokes callback on arrival
 * of the response event.
 */
sparkl.Service.prototype.solicit =
  function(message, callback) {
    message.id =
      Math.random().toString(36);
    this.pending[message.id] = callback;

    this.ws.send(
      JSON.stringify(message));
  };

/**
 * Opens the websocket and message handlers.
 */
sparkl.Service.prototype.open =
  function() {
    try {
      this.ws =
        new WebSocket(this.ws_url);
    }
    catch (exception) {
      console.error(exception);
      setTimeout(
        () => this.onerror("Invalid websocket"), 0);
      return;
    }

    this.ws.onopen =
      (event) => {
        this.onopen();
      };

    this.ws.onerror =
      (event) => {
        console.error(event);
        this.onerror("Error in websocket");
      };

    this.ws.onclose =
      (event) => {
        this.onclose();
      };

    this.ws.onmessage =
      (event) => {
        const message =
          JSON.parse(event.data);

        // Response message is cleaned of id and callback invoked.
        if (message.response) {
          const callback =
            this.pending[message.id];

          message.response =
            message.response.split("/").pop();
          delete this.pending[message.id];
          delete message.id;

          callback && callback(message);
        }

        // Request and consume messages are cleaned of id, reply
        // callback is constructed and implementation invoked.
        else {
          const path =
            message.request || message.consume;
          const id =
            message.id;
          const callback =
            (object) => {

              // Reply id matches request id.
              object.id = id;

              // Reinstate reply path if only name is supplied.
              if (!object.reply.startsWith(path)) {
                object.reply =
                  [path, object.reply].join("/");
              }

              this.ws.send(
                JSON.stringify(object));
            };

          delete message.id;

          try {
            this.impl[path](
              message, callback);
          }
          catch (exception) {
            console.error(path, message, exception);
            this.onerror(`Exception calling back implementation ${path}`);
          }
      }
    }
  };

/**
 * Closes the websocket which in turn causes the onclose callback.
 * If there is no websocket (e.g. the url was invalid anyway)
 * then the onclose() callback is invoked directly.
 */
sparkl.Service.prototype.close =
  function() {
    if (this.ws) {
      this.ws.close();
    }
    else {
      this.onclose();
    }
  };
