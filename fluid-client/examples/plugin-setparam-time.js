const fluid = require('../src/fluidOsc');
const FluidClient = require('../src/FluidClient');
const tabs = require('./tab-examples');
const path = require('path');

const sessionPath = path.join(__dirname, 'sessions/out.tracktionedit')

const client = new FluidClient(9999);
client.send([
  fluid.audiotrack.select('stabs'),
  fluid.plugin.select('4osc'),
  fluid.plugin.setParam('Amp Attack', 5, 1),
  fluid.plugin.setParam('Amp Attack', 5, 1),
  fluid.plugin.setParam('Width', 0.75, 4),
  ...fluid.midiclip.create('v1.1', 0, 8, tabs.noTearsVerseNotes),
  fluid.global.save(sessionPath),
]);