const fluid = require('../src/fluidOsc');
const FluidClient = require('../src/FluidClient');

const client = new FluidClient(9999);
client.send([
  fluid.transport.loop(0, 8),
  fluid.transport.play(0),
]);
