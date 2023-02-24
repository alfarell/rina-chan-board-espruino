const neopixel = require('neopixel')
const { expresionPreset } = require('./data/faces')

const LED_PIN = D4
const LED_COUNT = 154 // Rina board leds
const RINA_COLOR = [255, 20, 147]

let rgb = new Uint8ClampedArray(LED_COUNT * 3) // Forces the values to be between 0 and 255
let brightness = 0.2 // 0 to 1 based on how bright we want the colours to be.

const switch1 = D16
const switch2 = D17
const switch3 = D18
const switch4 = D19

let expression_mode = 0
// expression mode list
const expression_mode_list = ['eyes', 'blush', 'mouth']

let active_mode = 0
let active_key_expression = {
  eyes: 0,
  blush: false,
  mouth: 0,
}
let prev_active_key_expression = {
  eyes: null,
  blush: null,
  mouth: null,
}
const active_expression_indicator = {
  eyes: 118,
  blush: 50,
  mouth: 9,
}
// mode list
const mode_list = [
  {
    // change expression for each part (eyes, blush, mouth)
    name: 'change-expression',
    activeColor: [255, 0, 0],
    actions: {
      D17: () => {
        const key = expression_mode_list[expression_mode]

        prev_active_key_expression[key] = active_key_expression[key]
        if (key === 'blush') {
          if (active_key_expression[key] >= 1) {
            active_key_expression[key] = typeof active_key_expression[key] === 'number' ? (active_key_expression[key] || expresionPreset[key].length) - 1 : expresionPreset[key].length
          } else {
            active_key_expression[key] = false
          }
        } else {
          if (active_key_expression[key] >= 1) active_key_expression[key] = active_key_expression[key] - 1
          else active_key_expression[key] = expresionPreset[key].length - 1
        }

        setLed()
      },
      D18: () => {
        const key = expression_mode_list[expression_mode]

        prev_active_key_expression[key] = active_key_expression[key]
        if (key === 'blush') {
          if (active_key_expression[key] >= expresionPreset.blush.length - 1) active_key_expression[key] = false
          else active_key_expression[key] = typeof active_key_expression[key] === 'number' ? (active_key_expression[key] || 0) + 1 : 0
        } else {
          active_key_expression[key] = (active_key_expression[key] + 1) % expresionPreset[key].length
        }

        setLed()
      },
      D19: (e) => {
        if (!e.state) {
          if (e.time - e.lastTime < 2) {
            expression_mode = (expression_mode + 1) % expression_mode_list.length
          }
          const key = expression_mode_list[expression_mode]
          const active_indicator = active_expression_indicator[key]

          setColor(active_indicator, [255, 0, 0])
          draw()

          setTimeout(() => {
            setColor(active_indicator, [0, 0, 0])
            draw()
          }, 1000)
        }
      },
    },
  },
  // {
  //   // change expression face
  //   name: 'change-face',
  //   activeColor: [0, 255, 0],
  // },
  {
    // change brightness
    name: 'brightness',
    activeColor: [255, 255, 0],
    actions: {
      D17: () => {
        if (brightness <= 0.2) return
        brightness = brightness - 0.1
        setLed()
      },
      D18: () => {
        if (brightness >= 0.9) return
        brightness = brightness + 0.1
        setLed()
      },
    },
  },
  {
    // settings connectivity (BLE & Wifi)
    name: 'connectivity',
    activeColor: [0, 0, 255],
  },
]

pinMode(switch1, 'input_pulldown')
pinMode(switch2, 'input_pulldown')
pinMode(switch3, 'input_pulldown')
pinMode(switch4, 'input_pulldown')

setWatch(
  function (e) {
    if (e.state && e.time - e.lastTime < 0.2) return

    // handle code on low state button
    if (!e.state) {
      if (e.time - e.lastTime < 2) {
        active_mode = (active_mode + 1) % mode_list.length
      }

      setColor(0, mode_list[active_mode].activeColor)
      draw()

      setTimeout(() => {
        setColor(0, [0, 0, 0])
        draw()
      }, 1000)
    }
  },
  switch1,
  { repeat: true, edge: 'both', debounce: 50 }
)

setWatch(
  function (e) {
    if (e.time - e.lastTime < 0.2) return

    runActiveAction(e)
  },
  switch2,
  { repeat: true, edge: 'rising' }
)

setWatch(
  function (e) {
    if (e.time - e.lastTime < 0.2) return

    runActiveAction(e)
  },
  switch3,
  { repeat: true, edge: 'rising' }
)

setWatch(
  function (e) {
    if (e.state && e.time - e.lastTime < 0.2) return

    runActiveAction(e)
  },
  switch4,
  { repeat: true, edge: 'both' }
)

function runActiveAction(e) {
  const action = mode_list[active_mode] && mode_list[active_mode].actions && mode_list[active_mode].actions[e.pin]
  action && action(e)
}

function setColor(index, color) {
  // colour is an array of 3 integers: RGB
  rgb[index * 3] = Math.floor(color[1] * brightness) // red
  rgb[index * 3 + 1] = Math.floor(color[0] * brightness) // green
  rgb[index * 3 + 2] = Math.floor(color[2] * brightness) // blue
}

function draw() {
  neopixel.write(LED_PIN, rgb)
}

function setLed() {
  clearLed()

  if (active_key_expression.eyes !== prev_active_key_expression.eyes) {
    expresionPreset.eyes[active_key_expression.eyes].data.forEach((num) => setColor(num, RINA_COLOR))
  }
  if (active_key_expression.mouth !== prev_active_key_expression.mouth) {
    expresionPreset.mouth[active_key_expression.mouth].data.forEach((num) => setColor(num, RINA_COLOR))
  }
  if (active_key_expression.blush !== prev_active_key_expression.blush) {
    if (typeof active_key_expression.blush === 'number' && expresionPreset.eyes[active_key_expression.eyes].withBlush) {
      expresionPreset.blush[active_key_expression.blush].data.forEach((num) => setColor(num, RINA_COLOR))
    } else {
      active_key_expression.blush = false
    }
  }

  draw()
}

function clearLed() {
  rgb = new Uint8ClampedArray(LED_COUNT * 3)
}

setLed()
