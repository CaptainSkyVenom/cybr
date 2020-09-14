const tCompReport = require('./reports/vst2-t-compressor')
const fluid = require('..')

for (const paramInfo of tCompReport.params) {
  if (paramInfo.name === 'Threshold (2)') paramInfo.key = 'softClipThresholdDb'
  else if (paramInfo.name === 'Auto') paramInfo.key = 'enableAutoMakeUpGain'
  else if (paramInfo.name === 'Type') paramInfo.key = 'filterType'
  else if (paramInfo.name === 'Freq') paramInfo.powerFuncB = 5
}

const moduleString = fluid.gen.generatePluginModule(tCompReport)
process.stdout.write(moduleString)
