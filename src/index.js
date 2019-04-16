const default_elements = {
  '[data-mt]': ['data-mt'],
}

// This is very likely unnecessary, but I don't know a better way
const domrect2array = dr => ({
  top: dr.top,
  bottom: dr.bottom,
  left: dr.left,
  right: dr.right,
  width: dr.width,
  height: dr.height
})

const extractpadding = elem => {
  const style = window.getComputedStyle(elem)
  return {
    css_p_t: style.getPropertyValue('padding-top'),
    css_p_b: style.getPropertyValue('padding-bottom'),
    css_p_l: style.getPropertyValue('padding-left'),
    css_p_r: style.getPropertyValue('padding-right'),
    css_m_t: style.getPropertyValue('margin-top'),
    css_m_b: style.getPropertyValue('margin-bottom'),
    css_m_l: style.getPropertyValue('margin-left'),
    css_m_r: style.getPropertyValue('margin-right')
  }
}

const fromPairs = pairs => pairs.reduce((cache, pair) => {
  cache[pair[0]] = pair[1]
  return cache
}, {})

export class Mousetrap {
  constructor({ elements=default_elements }={}) {
    this.data = []
    this.elements = elements
    this.handlers = {
      click: e => this.data.push({
        type: 'click',
        timestamp: e.timeStamp || performance.now(),
        pageX: e.pageX, pageY: e.pageY,
        clientX: e.clientX, clientY: e.clientY,
        buttons: e.buttons,
      }),
      mousemove: e => this.data.push({
        type: 'mousemove',
        timestamp: e.timeStamp || performance.now(),
        pageX: e.pageX, pageY: e.pageY,
        clientX: e.clientX, clientY: e.clientY,
        screenX: e.screenX, screenY: e.screenY,
      }),
      mousedown: e => this.data.push({
        type: 'mousedown',
        timestamp: e.timeStamp || performance.now(),
        pageX: e.pageX, pageY: e.pageY,
        clientX: e.clientX, clientY: e.clientY,
        screenX: e.screenX, screenY: e.screenY,
        buttons: e.buttons,
      }),
      mouseup: e => this.data.push({
        type: 'mouseup',
        timestamp: e.timeStamp || performance.now(),
        pageX: e.pageX, pageY: e.pageY,
        clientX: e.clientX, clientY: e.clientY,
        screenX: e.screenX, screenY: e.screenY,
        buttons: e.buttons,
      }),
      mouseout: e => this.data.push({
        type: 'mouseout',
        timestamp: e.timeStamp || performance.now(),
        pageX: e.pageX, pageY: e.pageY,
        clientX: e.clientX, clientY: e.clientY,
        screenX: e.screenX, screenY: e.screenY,
      }),
    }
  }

  attach() {
    Object.entries(this.handlers).forEach(([name, handler]) => {
      window.addEventListener(name, handler)
    })
  }

  detach() {
    Object.entries(this.handlers).forEach(([name, handler]) => {
      window.removeEventListener(name, handler)
    })
  }

  get windowContents() {
    return fromPairs(Object.entries(this.elements).map(([selector, attributes]) => [
      // Map through selected dom elements
      selector,
      Array.from(document.querySelectorAll(selector)).map(elem => {
        const attribute_values = {}
        for (let attribute_name in attributes) {
          attribute_values[attribute_name] = elem.getAttribute(attribute_name)
        }

        return Object.assign({},
          attribute_values,
          domrect2array(elem.getBoundingClientRect()),
          extractpadding(elem)
        )
      })
    ]))
  }
}

export class MousetrapPlugin {
  constructor({ debug=false }={}) {
    this.trap = new Mousetrap()
    this.debug = debug
  }

  handle(context, event) {
    switch (event) {
      case 'run':
        return this.onRun(context)
      case 'end':
        return this.onEnd(context)
      default:
        return null
    }
  }

  onRun(context) {
    if (this.debug) {
      console.log('Attaching mouse-tracking')
    }
    this.trap.attach()
    context.state.mouseEnvironment = this.trap.windowContents
  }

  onEnd(context) {
    if (this.debug) {
      console.log('Detaching mouse-tracking')
      console.log('Collected data', this.trap.data)
    }
    this.trap.detach()
    context.state.mouseData = this.trap.data
  }
}

window.MousetrapPlugin = MousetrapPlugin
