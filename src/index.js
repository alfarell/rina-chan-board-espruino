const { normal_smile } = require('./faces')

const LED_PIN = D4
const LED_COUNT = 154 // Rina board leds
const RINA_COLOR = [255, 20, 147]

const rgb = new Uint8ClampedArray(LED_COUNT * 3) // Forces the values to be between 0 and 255
let brightness = 0.2 // 0 to 1 based on how bright we want the colours to be.

pinMode(D16, 'input_pulldown')

setWatch(
  function (e) {
    if (e.time - e.lastTime < 0.2) return

    if (brightness >= 1) brightness = 0.2
    else brightness = brightness + 0.2

    setLed()
  },
  D16,
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
  normal_smile.forEach((num) => setColor(num, RINA_COLOR))
  draw()
}

setLed()
