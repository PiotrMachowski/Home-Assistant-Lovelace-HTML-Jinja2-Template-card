// html-template-card: displays a Jinja2 template as the HTML content of a card.
//
// Upstream opens a new render_template subscription on every tracked state
// change and never unsubscribes, so subscriptions pile up until the websocket
// queue (4096 pending messages) overflows. This build holds exactly one
// subscription per card: the server already re-renders and pushes the result
// whenever anything the template depends on changes.
//
//  - subscribes when the card is attached, unsubscribes when it is detached
//    (so cards hidden by a visibility condition hold no subscription)
//  - re-subscribes only if the template text or the connection object changes
//  - `entities` and `always_update` are accepted but no longer needed
(() => {
  const TAG = "html-template-card";
  const VERSION = "1.1.0";

  class HtmlTemplateCard extends HTMLElement {
    setConfig(config) {
      if (!config || !config.content) {
        throw new Error("You need to define 'content' in your configuration.");
      }
      this._config = config;

      let root;
      if (config.picture_elements_mode) {
        root = document.createElement("div");
      } else {
        root = document.createElement("ha-card");
        root.style.padding = "16px";
      }
      if (this._root && this._root.parentNode === this) {
        this.replaceChild(root, this._root);
      } else {
        this.appendChild(root);
      }
      this._root = root;
      this._lastHtml = undefined;
      if (this._lastResult !== undefined && !config.do_not_parse) {
        this._render(this._lastResult); // keep showing content while re-subscribing
      }
      this._sync();
    }

    set hass(hass) {
      this._hass = hass;
      this._sync();
    }

    get hass() {
      return this._hass;
    }

    connectedCallback() {
      this._sync();
    }

    disconnectedCallback() {
      this._unsubscribe();
    }

    _template() {
      let content = String(this._config.content);
      if (!this._config.ignore_line_breaks) {
        content = content.replace(/\r?\n|\r/g, "</br>");
      }
      return content;
    }

    // Bring the subscription in line with the current config/hass/attachment.
    _sync() {
      if (!this._config || !this._root) return;

      if (this._config.do_not_parse) {
        this._unsubscribe();
        this._render(this._template());
        return;
      }
      if (!this.isConnected || !this._hass || !this._hass.connection) return;

      const conn = this._hass.connection;
      const template = this._template();
      if (this._sub && this._sub.conn === conn && this._sub.template === template) {
        return; // already subscribed to exactly this
      }
      this._unsubscribe();

      const sub = { conn, template, cancelled: false, unsub: null };
      this._sub = sub;
      conn
        .subscribeMessage(
          (msg) => {
            if (sub.cancelled || this._sub !== sub) return;
            if (msg && typeof msg.result !== "undefined") {
              this._lastResult = msg.result;
              this._render(msg.result);
            } else if (msg && msg.error) {
              this._renderError(msg.error);
            }
          },
          { type: "render_template", template }
        )
        .then((unsub) => {
          if (sub.cancelled) {
            unsub(); // detached or superseded while the subscribe was in flight
          } else {
            sub.unsub = unsub;
          }
        })
        .catch((err) => {
          if (this._sub === sub) {
            this._sub = null; // allow a retry on the next hass update
            this._renderError((err && err.message) || err);
          }
        });
    }

    _unsubscribe() {
      const sub = this._sub;
      if (!sub) return;
      this._sub = null;
      sub.cancelled = true;
      if (sub.unsub) {
        try {
          const r = sub.unsub();
          if (r && typeof r.catch === "function") r.catch(() => {});
        } catch (e) {
          /* connection already gone */
        }
      }
    }

    _render(content) {
      const header = this._config.title
        ? `<div class="card-header" style="padding: 8px 0 16px 0;"><div class="name">${this._config.title}</div></div>`
        : "";
      const html = this._config.picture_elements_mode
        ? String(content)
        : `${header}<div>${content}</div>`;
      if (html === this._lastHtml) return;
      this._lastHtml = html;
      this._root.innerHTML = html;
    }

    _renderError(error) {
      const pre = document.createElement("pre");
      pre.style.cssText = "white-space:pre-wrap; color:var(--error-color, #db4437); margin:0;";
      pre.textContent = `Template error: ${typeof error === "string" ? error : JSON.stringify(error)}`;
      this._lastHtml = undefined;
      this._root.innerHTML = "";
      this._root.appendChild(pre);
    }

    getCardSize() {
      return 1;
    }
  }

  if (customElements.get(TAG)) {
    console.warn(`${TAG} ${VERSION}: element already defined - the upstream card is still loaded as a resource`);
  } else {
    customElements.define(TAG, HtmlTemplateCard);
    console.info(`%c ${TAG} %c ${VERSION} `, "background:#333;color:#fff", "background:#f5b547;color:#000");
  }
})();
