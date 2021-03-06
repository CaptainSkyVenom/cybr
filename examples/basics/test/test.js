const fs = require('fs');
const YAML = require('yaml');
const should = require('should');
const mocha = require('mocha');

const converters = require('../src/converters');
const fluid = require('../src/fluidOsc');
const file = fs.readFileSync('./test/test-content.yaml', 'utf8');
const content = YAML.parse(file);

describe('valueToWholeNotes', () => {
  it('should handle strings in the format "1/4"', () => {
    converters.valueToWholeNotes('1/4').should.equal(1/4);
    converters.valueToWholeNotes('1/12').should.equal(1/12);
    converters.valueToWholeNotes('1/32').should.equal(1/32);
  });
  it('should handle strings in the format "sixteenth"', () => {
    converters.valueToWholeNotes('sixteenth').should.equal(1/16);
    converters.valueToWholeNotes('quarter').should.equal(1/4);
  });
  it('should handle Numbers', () => {
    converters.valueToWholeNotes(1/8).should.equal(1/8);
    converters.valueToWholeNotes(1/32).should.equal(1/32);
  });
  it('should throw on invalid values', () => {
    should(() => { converters.valueToWholeNotes('Hi!'); }).throw();
  });
});


describe('valueToMidiNoteNumber', () => {
  it('should convert "c4" string to 60', () => {
    converters.valueToMidiNoteNumber('c4').should.equal(60);
  });
  it('should convert "c##4" string to 62', () => {
    converters.valueToMidiNoteNumber('c##4').should.equal(62);
  });
  it('should leave numbers like 58 unchanged', () => {
    converters.valueToMidiNoteNumber(58).should.equal(58);
  });
  it('should throw on an invalid string', () => {
    should(() => { converters.valueToMidiNoteNumber('invalid'); }).throw();
    should(() => { converters.valueToMidiNoteNumber('##'); }).throw();
  })
});

describe('createMidiNoteMessage', () => {
  let noteNum = 60;
  let startTimeInWholeNotes = 0.375;
  let durationInWholeNotes =  0.125;
  let velocity = 64;
  let startTimeInQuarterNotes = startTimeInWholeNotes * 4;
  let durationInQuarterNotes = durationInWholeNotes * 4;


  const desiredResult = {
    address: '/midiclip/n',
    args: [
      { type: 'integer', value: noteNum },
      { type: 'float', value: startTimeInQuarterNotes },
      { type: 'float', value: durationInQuarterNotes },
    ],
  };

  it('Should create an object designed for osc.toBuffer()', () => {
    fluid.midiclip.note(noteNum, startTimeInWholeNotes, durationInWholeNotes)
      .should.deepEqual(desiredResult);
  });

  it('should include an extra argument if a velocity is supplied', () => {
    desiredResult.args.push({ type: 'integer', value: velocity });
    fluid.midiclip.note(noteNum, startTimeInWholeNotes, durationInWholeNotes, velocity)
      .should.deepEqual(desiredResult);
  });
});


describe('midiclip.create', () => {
  const notes = [
    { n: 60, s: 0.0, l: 0.25 },
    { n: 64, s: 0.5, l: 0.25 },
    { n: 67, s: 1.0, l: 0.25 },
  ];

  const arpMessage = fluid.midiclip.create('track1', 'clip1', 1, 2, notes);

  it('should have /audiotrack/select', () => {
    const trackSelect = arpMessage.elements[0];
    trackSelect.should.deepEqual({
      address: '/audiotrack/select',
      args: [{ type: 'string', value: 'track1' }], // no way to know if its array or not
    });
  });

  it('should have /midiclip/select', () => {
    const clipSelect = arpMessage.elements[1];
    clipSelect.should.deepEqual({
      address: '/midiclip/select',
      args: [
        { type: 'string', value: 'clip1' },
        { type: 'float',  value: 1 },
        { type: 'float',  value: 2 },
      ],
    });
  });

  it('should have /midiclip/clear', () => {
    const clipClear = arpMessage.elements[2];
    clipClear.should.deepEqual({
      address: '/midiclip/clear',
    });
  });

  it('should have /midiclip/n messages (x3)', () => {
    const notes = arpMessage.elements.slice(3);
    notes.should.deepEqual([{
      address: '/midiclip/n',
      args: [
        { type: 'integer', value: 60 },
        { type: 'float',   value: 0 },
        { type: 'float',   value: 1 },
      ],
    }, {
      address: '/midiclip/n',
      args: [
        { type: 'integer', value: 64 },
        { type: 'float',   value: 2 },
        { type: 'float',   value: 1 },
      ],
    }, {
      address: '/midiclip/n',
      args: [
        { type: 'integer', value: 67 },
        { type: 'float',   value: 4 },
        { type: 'float',   value: 1 },
      ],
    }])
  });
});
