This card displays provided Jinja2 template as an HTML content of a card. It uses exactly the same engine as Home Assistant in *Developer tools*.

## Configuration options

| Key | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `title` | `string` | `false` | - | Title of a card |
| `content` | `string` | `true` | - | Content of a card |
| `ignore_line_breaks` | `boolean` | `false` | `false` | Disables changing line breaks to `</br>` tags |
| `do_not_parse` | `boolean` | `false` | `false` | Disables template parsing |
| `always_update` | `boolean` | `false` | `false` | Enables refreshing the card with every change of entity |
| `picture_elements_mode` | `boolean` | `false` | `false` | Enables picture-elements mode |
| `entities` | `list` | `false` | `[]` | List of additional entities whose updates should trigger refresh of the card |
| `padding` | `string` | `false` | `16px` | padding of `ha-card` element |
| `header_style` | `string` | `false` | `padding: 8px 0 16px 0;` | in-line CSS for `div.card-header`, which contains card title |

### Templates

 * Entity state, example: `{{ states('sun.sun') }}`
 * Entity attribute, example: `{{ state_attr('sun.sun', 'elevation') }]`
 * Detailed documentation: [*Templating*](https://www.home-assistant.io/docs/configuration/templating/)
 
## Example usage

![Example](https://github.com/PiotrMachowski/Home-Assistant-Lovelace-HTML-Jinja2-Template-card/raw/master/example.gif)


```yaml
views:
- name: Example
  cards:
    - type: custom:html-template-card
      title: 'HTML Template card'
      ignore_line_breaks: true
      content: |
        Sun state: <b>{{ states('sun.sun') }}</b>, elevation: {{ state_attr('sun.sun','elevation') }}</br>
        <b>Hello</b> there!<p>General <u>Kenobi!</u></p>
        <img src="https://i.redd.it/ltxppihy4cyy.jpg" width="70%"/></br>
        <ha-icon icon="mdi:speaker"></ha-icon> Volume: {{ states('input_number.system_volume') }}%</br>
        <center><img src="https://vignette.wikia.nocookie.net/starwars/images/f/fa/Modal_Nodes_02.jpg" width="{{ states('input_number.system_volume') }}%"/></center>
```

## Hints
* To use mdi icon follow example: `<ha-icon icon="mdi:weather-sunny"></ha-icon>`.
* If content does not contain any template use flag `do_not_parse: true` to increase performance.
* If content does not contain entity id (e.g. because of loop) you have to provide it manually in `entities` to enable refresh of the card when it will be updated.
* If you want to enable refreshing for every change in HA use flag `always_update: true`. **WARNING:** this may cause heavy load of browser/HA. Best to use with flag `do_not_parse: true`.
* To check if your content is correct without changing configuration use *Developer tools*.
* To use this card as an element of picture-elements card use `picture_elements_mode` parameter.
