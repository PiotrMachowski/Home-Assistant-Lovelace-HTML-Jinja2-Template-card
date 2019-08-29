class HtmlTemplateCard extends HTMLElement {
    static get properties() {
        return {
            _config: {},
            _hass: {},
        };
    }

    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;
        if (this._config && this._hass && !this._entities) {
            this.calculateEntites();
        }
        if (this.shouldUpdate(oldHass)) {
            this.processAndRender();
        }
    }

    shouldUpdate(oldHass) {
        if (oldHass && this._entities && !this._config.always_update) {
            let should = false;
            this._entities.forEach(entity => {
                should = should || oldHass.states[entity] !== this._hass.states[entity]
                    || oldHass.states[entity].attributes !== this._hass.states[entity].attributes
            });
            return should;
        }
        return true;
    }

    setConfig(config) {
        if (!config.content) {
            throw new Error("You need to define 'content' in your configuration.")
        }
        this._config = config;
        if (this._config && this._hass && !this._entities) {
            this.calculateEntites();
        }
    }

    calculateEntites() {
        this._entities = [];
        if (this._config.entities && Array.isArray(this._config.entities)) {
            for (const entity in this._config.entities) {
                this._entities.push(this._config.entities[entity]);
            }
        }
        for (const entity in this._hass.states) {
            if (this._config.content.includes(entity)) {
                this._entities.push(this._hass.states[entity].entity_id);
            }
        }
    }

    processAndRender() {
        let content = this._config.content;
        if (!this._config.ignore_line_breaks) {
            content = content.replace(/\r?\n|\r/g, "</br>");
        }
        if (!this._config.do_not_parse) {
            this._hass.callApi("post", "template", {"template": content}).then(t => this.render(t));
        } else {
            this.render(content);
        }
    }

    render(content) {
        let header = ``;
        if (this._config.title) {
            header = `<div class="card-header" style="padding: 8px 0 16px 0;"><div class="name">${this._config.title}</div></div>`;
        }
        this.innerHTML = `<ha-card id="htmlCard" style="padding: 16px">${header}<div>${content}</div></ha-card>`;
    }

    getCardSize() {
        return 1;
    }
}

customElements.define('html-template-card', HtmlTemplateCard );