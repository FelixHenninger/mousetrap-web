// Return clamped value as well as the lost magnitude
const clamp = (n, lower, upper) => {
  if (n <= lower) {
    return [lower, lower-n]
  } else if (n >= upper) {
    return [upper, upper-n]
  }
  return [n, 0]
}

class MousetrapOverlay {
  constructor({
    cursorSize=15,
    cursorOffset=[0, 0],
    viewport=[800, 600],
  }) {
    this.options = { cursorSize, cursorOffset, viewport }
    this.canvas = null

    // Bind event handlers
    this.handleResize = this.handleResize.bind(this)
    this.handleMousemove = this.handleMousemove.bind(this)
    this.render = this.render.bind(this)
  }

  // Calculation / scaling utilities -------------------------------------------
  get scale() {
    return Math.min(
      this.canvas.width / this.options.viewport[0],
      this.canvas.height / this.options.viewport[1],
    )
  }

  get targetArea() {
    const scale = this.scale

    return [
      this.options.viewport[0] * scale,
      this.options.viewport[1] * scale
    ]
  }

  get targetBounds() {
    const [ targetWidth, targetHeight ] = this.targetArea
    const { width: canvasWidth, height: canvasHeight } = this.canvas

    return {
      top:    (canvasHeight - targetHeight) / 2,
      bottom: (canvasHeight + targetHeight) / 2,
      left:   (canvasWidth - targetWidth) / 2,
      right:  (canvasWidth + targetWidth) / 2,
      width:  targetWidth,
      height: targetHeight,
      canvasWidth,
      canvasHeight,
    }
  }

  // Rendering helpers ---------------------------------------------------------
  clear(targetOnly=true) {
    if (targetOnly) {
      const { left, top, width, height } = this.targetBounds

      this.ctx.clearRect(left, top, width, height)
    } else {
      this.ctx.clearRect(
        0, 0,
        this.canvas.width, this.canvas.height,
      )
    }
  }

  setClipping() {
    const { left, top, width, height } = this.targetBounds
    this.ctx.beginPath()
    this.ctx.rect(left, top, width, height)
    this.ctx.clip()
  }

  renderBarndoor() {
    // Calculate usable screen area
    const { left, right, top, bottom, canvasWidth, canvasHeight } = this.targetBounds

    // Fill barndoor area
    this.ctx.fillStyle = 'black'

    // Left and right barndoors
    this.ctx.fillRect(0, 0, left, canvasHeight)
    this.ctx.fillRect(right, 0, left, canvasHeight)
    // Top and bottom barndoors
    this.ctx.fillRect(0, 0, canvasWidth, top)
    this.ctx.fillRect(0, bottom, canvasWidth, top)
    // (for the right and bottom borders, remember that the width
    // of the barndoors is the same as the top and bottom bound)
  }

  renderCursor(x=250, y=200) {
    const { left, right, top, bottom } = this.cachedTargetBounds
    const [offsetX, offsetY] = this.options.cursorOffset
    const [newX, clampedX] = clamp(x + offsetX, left, right)
    const [newY, clampedY] = clamp(y + offsetY, top, bottom)
    this.options.cursorOffset = [offsetX + clampedX, offsetY + clampedY]

    this.ctx.beginPath()
    this.ctx.arc(
      newX, newY,
      this.options.cursorSize * this.cachedScale,
      0, lab.util.geometry.toRadians(360)
    )
    this.ctx.fillStyle = 'rgb(3, 112, 213)'
    this.ctx.fill()
  }

  // DOM interaction -----------------------------------------------------------
  injectCanvas() {
    // Generate overlay
    const overlay = document.createElement('div')
    overlay.innerHTML = `
      <canvas style="width: 100%; height: 100%">
    `
    overlay.classList.add('overlay')
    // TODO: Move styles into CSS file
    overlay.style.background = 'none'
    overlay.style.backdropFilter = 'none'
    overlay.style.padding = 0

    // Extract canvas
    this.canvas = overlay.querySelector('canvas')
    this.ctx = this.canvas.getContext('2d')

    // Inject overlay and adjust canvas dimensions
    document.body.appendChild(overlay)
    this.setCanvasSize()
  }

  setCanvasSize() {
    this.canvas.height = this.canvas.offsetHeight
    this.canvas.width = this.canvas.offsetWidth
  }

  // Event handling ------------------------------------------------------------

  init() {
    this.renderBarndoor()
    this.setClipping()
    this.cachedTargetBounds = this.targetBounds
    this.cachedScale = this.scale
    this.ctx.globalCompositeOperation = 'copy'
  }

  handleResize() {
    this.clear(false)
    this.setCanvasSize()
    this.init()
  }

  handleMousemove(e) {
    this._mousePos = [e.clientX, e.clientY]
  }

  setCursorPosition(x, y) {
    const [currentX, currentY] = this._mousePos
    const [offsetX, offsetY] = this.options.cursorOffset

    this.options.cursorOffset = [
      (x - currentX) + offsetX,
      (y - currentY) + offsetY,
    ]
  }

  // Render loop ---------------------------------------------------------------

  render() {
    if (this._mousePos) {
      this.renderCursor(...this._mousePos)
    }
    this._rAF = requestAnimationFrame(this.render)
  }

  // Plugin integration --------------------------------------------------------
  async handle(context, event) {
    if (event === 'before:run' && !document.fullscreenElement) {
      this.injectCanvas()
      this.init()
      window.addEventListener('resize', this.handleResize)
      this.canvas.addEventListener('mousemove', this.handleMousemove)
      this.canvas.addEventListener('mouseout', this.handleMousemove)
      this.render()
    } else if (event === 'end') {
      window.removeEventListener('resize', this.handleResize)
      this.canvas.removeEventListener('mousemove', this.handleMousemove)
      this.canvas.removeEventListener('mouseout', this.handleMousemove)
      cancelAnimationFrame(this._rAF)
    }
  }
}

window.MousetrapOverlay = MousetrapOverlay
