const { expresionPreset } = require('./data/faces')

const LED_PIN = D4
const LED_COUNT = 154 // Rina board leds
const RINA_COLOR = [255, 20, 147]

let rgb = new Uint8ClampedArray(LED_COUNT * 3) // Forces the values to be between 0 and 255
let brightness = 0.2 // 0 to 1 based on how bright we want the colours to be.

let active_eye = 0
let active_blush = false
let active_mouth = 0

let prev_active_eye = null
let prev_active_blush = null
let prev_active_mouth = null

pinMode(D16, 'input_pulldown')
pinMode(D17, 'input_pulldown')
pinMode(D18, 'input_pulldown')
pinMode(D19, 'input_pulldown')

setWatch(
  function (e) {
    if (e.time - e.lastTime < 0.2) return

    if (brightness >= 1) brightness = 0.2
    else brightness = brightness + 0.2

    setLed()
  },
  D16,
  { repeat: true, edge: 'rising', debounce: 50 }
)
setWatch(
  function (e) {
    if (e.time - e.lastTime < 0.2) return

    prev_active_eye = active_eye
    active_eye = (active_eye + 1) % expresionPreset.eyes.length

    setLed()
  },
  D17,
  { repeat: true, edge: 'rising' }
)
setWatch(
  function (e) {
    if (e.time - e.lastTime < 0.2) return

    prev_active_blush = active_blush
    if (active_blush >= expresionPreset.blush.length - 1) active_blush = false
    else active_blush = typeof active_blush === 'number' ? (active_blush || 0) + 1 : 0

    setLed()
  },
  D18,
  { repeat: true, edge: 'rising' }
)
setWatch(
  function (e) {
    console.log('change mouth', brightness, e.time - e.lastTime)
    if (e.time - e.lastTime < 0.2) return

    prev_active_mouth = active_mouth
    active_mouth = (active_mouth + 1) % expresionPreset.mouth.length

    setLed()
  },
  D19,
  { repeat: true, edge: 'rising' }
)

function setColor(index, color) {
  // colour is an array of 3 integers: RGB
  rgb[index * 3] = Math.floor(color[1] * brightness) // red
  rgb[index * 3 + 1] = Math.floor(color[0] * brightness) // green
  rgb[index * 3 + 2] = Math.floor(color[2] * brightness) // blue
}

function draw() {
  require('neopixel').write(LED_PIN, rgb)
}

function setLed() {
  clearLed()

  if (active_eye !== prev_active_eye) {
    expresionPreset.eyes[active_eye].data.forEach((num) => setColor(num, RINA_COLOR))
  }
  if (active_mouth !== prev_active_mouth) {
    expresionPreset.mouth[active_mouth].data.forEach((num) => setColor(num, RINA_COLOR))
  }
  if (active_blush !== prev_active_blush) {
    if (typeof active_blush === 'number' && expresionPreset.eyes[active_eye].withBlush) {
      expresionPreset.blush[active_blush].data.forEach((num) => setColor(num, RINA_COLOR))
    } else {
      active_blush = false
    }
  }

  draw()
}

function clearLed() {
  rgb = new Uint8ClampedArray(LED_COUNT * 3)
}

setLed()
