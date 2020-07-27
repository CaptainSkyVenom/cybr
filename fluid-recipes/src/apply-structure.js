// I get an array of n unique sections
// a section can be an array of other section objects

/*
Output:

(done) Edit-able scores that the user can edit themselves    
() Automations done for any user written input should be copied over onto any other similar sections
() Adding our own automations for changing tempo
(done) Changing note library for transposing
(done) Adding/removing the presence of drums
() Edited transitions
-> 
*/

/*
The called function will write to a new file 

The called function will call:
parse()
automate()

parse will go through the scoreObject array. parse will record these things:
start/end times of each section
start/end beat

If it is an array, it will go through it and call another function objectParse

objectParse will recusively read through other objects with the keys not in reservedKeys within the inital scoreObject, 
and apply applyChanges() to them

applyChanges() can:
transpose the note library
detect which section the object is in and add/remove the drum tracks

automate() will take in the start/end times of each section and apply automations for changing tempo and other effects like fade


*/

var fs = require('fs');
var path = require('path');

const tab     = require('../../fluid-music/src/tab');
const { update } = require('ramda');
const reservedKeys = tab.reservedKeys;
var arrayObjectsWithKeys = []

// https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arays-by-string-path/6491621#6491621
Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

function readStructure(structureId){
    console.log(path.join(__dirname, 'structure-library', structureId + '.json'))
    if (typeof structureId !== 'string') throw new Error("structureId should be a string");
    try {
        var structure = JSON.parse(fs.readFileSync(path.join(__dirname, 'structure-library', structureId + '.json')));
        return structure;   
    } catch (error) {
        throw new Error('structureId: ' + structureId + ' could not be found.')   
    }
}

function applyStructure(scoreObject, labels){
    var newScore = [];
    var offset = 0;
    for (let label of labels){
        if (label == 'unique_intro'){
            newScore.push(scoreObject[0]);
            offset += 1;
        }
        else if (label == 'unique_outro'){
            newScore.push(scoreObject[scoreObject.length - 1]);
        }
        else{
            newScore.push(scoreObject[parseInt(label) + offset])
        }
    }
    return newScore
}

function getStructuredScore(scoreObject, config, structure, outfile){

    // console.log(scoreObject)
    arrayObjectsWithKeys = []

    var labels = structure.structure[0].labels
    var structuredScore = applyStructure(scoreObject, labels)
    var updatedScore = parse(null, structuredScore, structure, '')

    // Extra automation code goes here

    // Write object to file in a clean format

    var sectionPrefixes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    var sectionIndices = new Array(sectionPrefixes.length).fill(0);

    let stream = fs.createWriteStream(path.join(process.cwd(), outfile));
    stream.write(`const fluid   = require('fluid-music');
const recipes = require('fluid-recipes'); \n`)
    stream.write('\n\nconst config = ')
    stream.write(JSON.stringify(config, null, 4))
    stream.write('\n\n//Sections:')
    stream.write('\nconst score = [];\n')

    const sectionToName = {}

    for (var i = 0; i < updatedScore.length; i++){
        var sectionName = ""
        if (labels[i] === 'unique_intro'){
            sectionName = 'Intro'
        } else if (labels[i] === 'unique_outro'){
            sectionName = 'Outro'
        } else{
            sectionName = sectionPrefixes[labels[i]] + sectionIndices[labels[i]]
            sectionIndices[labels[i]] += 1
        }

        sectionToName[i] = sectionName

        stream.write('var ' + sectionName + ' = ')
        stream.write(JSON.stringify(updatedScore[i], null, 4))
        stream.write('\nscore.push(' + sectionName + ');')
        stream.write('\n\n')
    }    

    stream.write('\n\n')

    for (var i = 0; i < arrayObjectsWithKeys.length; i++){
        const id = arrayObjectsWithKeys[i]
        var a = id.split('.');
        var b = a.slice(2).join('.');
        var c = a.slice(1).join('.');
        var obj = Object.byString(updatedScore, c)
        stream.write(sectionToName[a[1]] + '.' + b + ' = ' + JSON.stringify(obj, null, 4))
        stream.write('\n\n')
    }
}


// start, end beats of each section
function parse(key, scoreObject, structure, tree) {

    scoreObject = applyChanges(tree, key, scoreObject, structure) 

    if (Array.isArray(scoreObject)) {
        let returnValue = [];
        for (let [key, o] of Object.entries(scoreObject)) {
            let result = parse(key, o, structure, tree + '.' + key);
            if (isNaN(key)){
                arrayObjectsWithKeys.push(tree + '.' + key)
                returnValue[key] = result;
            } else{
                returnValue.push(result);
            }
        }
        return returnValue;
    } else if (typeof(scoreObject) === 'object') {
        let returnValue = {};
        for (let [key, val] of Object.entries(scoreObject)) {
            let result = parse(key, val, structure, tree + '.' + key);
            returnValue[key] = result
        }
        return returnValue;
    } else{
        return scoreObject;
    }
};

function applyChanges(tree, key, scoreObject, structure){

    if (key == 'nLibrary' || tree.includes('nLibrary')){
        var a = tree.split('.')
        const section = parseInt(a[1])
        const diff = parseInt(structure.sections[section][0].key_diff)

        for(let [key, val] of Object.entries(scoreObject)){
            if (!isNaN(val)){
                scoreObject[key] = val + diff
            }
        }
    } else if(key == 'drums'){
        var a = tree.split('.')
        const section = parseInt(a[1])
        const drums = parseInt(structure.sections[section][0]["drums-delta"])

        if (drums == 0){
            return {}
        }
    }

    return scoreObject
}

function addAutomations(structure){

}

module.exports = {
    readStructure,
    getStructuredScore,
}