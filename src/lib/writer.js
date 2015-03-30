var fs      = require('fs'),
    util    = require('util'),
    _       = require('lodash'),
    pretty  = require('js-object-pretty-print').pretty;    

var flags = { ttBool: false }; // is set to true by tooltips, to output companion files

function buildString(structure){

  // console.log('in writer', structure);
 
 var choms      = structure,
     output     = "",                   // this is the string that will be built
     keys       = Object.keys(choms),  // these are the keys we need to build it
     dataKeys   = [],
     canvasKeys = [],
     elemKeys   = [];

  var d3things = {
    // colors
    'category10'  : 'pre',
    'category20'  : 'pre',
    'category20b' : 'pre',
    'category20c' : 'pre',

    //axes
    'linear'      : 'pre',
    'log'         : 'pre',  
  };


  // Utilty funcs (order: alpha)

  function biteBiteBite(toc, contents, str){
    var str      = str || "",
        biteName = toc.shift()
        bite     = contents[biteName]; 

    if(noms[biteName]){
      str += noms[biteName](bite, contents.parent);
    } else {
      str += defaultBite(bite, biteName);
    }

    if (toc.length) { 
      return biteBiteBite(toc, contents, str);  
    } else {
      str += ";\n"
      return str;
    }
  }

  function eatVars(collection, parent){
    var collect = collection;

    if (_.isArray(collect) && _.isString(collect[0])){
      return '"' +  collect[0] + '"';
    }

    _.forEach(collect, function(val, key){
      // iterate on collection and if a val is an object with property variable, replace that with the value in variable
      if(key === 'variable'){
        if (d3things[val]){
          collect = assembled3things(d3things[val], val); 
        } else {
          collect = lookup(val, parent);
        }
      } else if (typeof val === 'object' && val.hasOwnProperty('variable')){
        if (d3things[val.variable]) {
          collect[key] = assembled3things(d3things[val.variable], val.variable); // passes pre or post as arg
        } else {
          collect[key] = lookup(val.variable, parent);
        }
      }
    });
    return collect;
  }

  function filterArr(type){
    return _.filter(keys, function(el){
      return el.match('' + type + '');
    });
  }

  function lookup(toFind, scope){

    if (choms[scope].hasOwnProperty('parent')){
      if (choms[scope].hasOwnProperty(toFind)){
        return choms[scope][toFind];
      } else {
        lookup(toFind, choms[parent]);
      }
    } else {
      console.log(toFind + ' is not defined.')
    }

  }

  // let's make more tables of contents over which to iterate!
  function popArrs(){
    dataKeys = filterArr('data');
    canvasKeys = filterArr('canvas');
    elemKeys = filterArr('elem');
  }

  function stringifyList(list, prepend, append, punc){
    var ministr = "";

    _.forEach(list, function(el){
      ministr += prepend + el + append + punc;
    });

    return ministr;
  }

  // Noms & funcs

  var noms = {
   'attr'   : attrBite,
   'style'  : styleBite,
   'tooltip': ttBite,

   // events <- add more, consider method to take other DOM methods
    'click'     :   function(args){ return eventBite(args)('click')},
    'mouseover' :   function(args){ return eventBite(args)('mouseover')},
    'mouseenter':   function(args){ return eventBite(args)('mouseenter')},
    'mouseleave':   function(args){ return eventBite(args)('mouseleave')},
    'hover'     :   function(args){ return eventBite(args)('hover')},
  }

  function attrBite(bite, parent){
    var ministr = "",
        miniobj = Object.create(Object.prototype);

    _.forEach(bite, function(el){
      miniobj[el[0]] = eatVars(el[1], parent); // removed arary wrapper here
    })

    return ".attr(" + pretty(miniobj, 4, "JSON") + ")"; 
  }

  function styleBite(bite, parent){
    var ministr = "",
        miniobj = Object.create(Object.prototype);

    _.forEach(bite, function(el){
      miniobj[el[0]] = eatVars(el[1], parent); // removed arary wrapper here
    })

    return ".style(" + pretty(miniobj, 4, "JSON") + ")"; 
  }

  function defaultBite(bite, biteName){
    return "." + biteName + "(" + eatVars(bite) + ")";
  }

  function eventBite(bite){
    return function(type){
      return ".on('" + type + "', " + bite + ")";
    }
  }

  function ttBite (bite, parent){

    flags.ttBool = true;

    var pobj    = choms[parent],
        ministr = "";


    ministr+= ".on('mouseover', function(d){"
    ministr+= "var xPosition = event.clientX + scrollX < width - 200 ? event.clientX + scrollX : event.clientX + scrollX - 200,\n"
    ministr+= "yPosition = event.clientY + scrollY + 100 > height ? event.clientY + scrollY - 25 : event.clientY + scrollY + 5,\n"
    ministr+= "text = " 

    if (bite.text === 'default') {
      ministr += pobj.xPrim + " + '; ' + " + pobj.yPrim;
    } else {
      ministr += bite.text;
    }

    ministr+= ";\n"
    ministr+= "d3.select('#tooltip')\n"
    ministr+= ".style('left', xPosition + 'px')\n"
    ministr+= ".style('top', yPosition + 'px')\n"
    ministr+= ".select('#values')\n"
    ministr+= ".text(text);\n"
    ministr+= "d3.select('#tooltip').classed('hidden', false); })\n"
    ministr+= ".on('mouseout', function(){\n"
    ministr+= "d3.select('#tooltip').classed('hidden', true); })\n"

    // call html & css file generation functions <-- put in another file & just call from here

    return ministr;
  }

 

  // Mini Assemblers (listed alpha)

  function assembleAxes(type, itself){
    var ministr   = "",
        minitype  = type.slice(0,1),  
        inkey     = Object.keys(itself[type]);

    function innerAssemble(kind, content){
      var tinystr   = "",
          defOrient = { x: 'bottom', y: 'left' };
      
      (kind === 'scale') && (tinystr += "." + kind + "(" + (content || (minitype + _.capitalize(kind))) + ")");
      (kind === 'orient') && (tinystr += "." + kind + "('" + (content || defOrient[minitype]) + "')");
      
      return tinystr;
    }

    ministr += "var " + type + " = d3.svg.axis()"
    ministr += itself[type].hasOwnProperty('scale') ? innerAssemble('scale', itself[type].scale) : innerAssemble('scale');
    ministr += itself[type].hasOwnProperty('orient') ? innerAssemble('orient', itself[type].orient) : innerAssemble('orient');
    ministr += ";\n"

    ministr += "svg.append('g')"
    ministr += ".attr('class','" + minitype + " axis')";
    
    (minitype === 'x') && (ministr += ".attr('transform', 'translate(0,' + height + ')')")

    ministr += ".call(" + type + ")"
    ministr += ".append('text')"

    inkey = _.pull(inkey, 'scale', 'orient', 'parent');
    
    ministr += (biteBiteBite(inkey, itself[type]));
    

    return ministr;
  }


  function assembled3things(director, itself, inter){ // expect to use inter later
    if(director === 'pre'){
      return 'd3.scale.' + itself;
    } else if (director === 'post'){
      return 'd3.' + itself + '.scale'
    } else {
      console.log('Cannot assemble d3things; unknown director.\n');
    }
  }

  function assembleMaxes(itself){
    var ministr = "";
    ministr+= "var maxY = d3.max(data, function(d){return " +  itself.yPrim + " }),\n"
    ministr+= "maxX = d3.max(data, function(d){return " + itself.xPrim + "});\n\n" 
    ministr+= "maxY = maxY + (maxY * .25) // Make it a little taller\n"

    return ministr;
  }

  function assembleScale(director, type, itself){
    var ministr = "";
    

    if(director === 'user'){
      var obn = itself[type + "Scale"];
      
      ministr += eatVars(obn.scale) + "()"
      ministr += ".domain([" + obn.domain.short_params[0] + ", " + obn.domain.short_params[1] + "])"
      ministr += ".range([" + obn.range.short_params[0] + ", " + obn.range.short_params[1] + "])";
      
      (type === 'x') && (ministr += ", \n")
    
    } else if (director === 'default'){
      (type === 'x') && (ministr += "d3.scale.linear().domain([0, maxX]).range([0, width])");
      (type === 'y') && (ministr += "d3.scale.linear().domain([0, maxY]).range([height, 0])");  
    
    } else {
      console.log('Cannot assemble scale; unknown director.\n');
    }

    return ministr;

  }


  // Main Assmemblers (listed bottom to top)

  // call this for each object in elemKeys || call on children of everything in canvasKeys and eliminate elKeys?
  function assembleFirstAtom(key){
    var obk   = choms[key],
        inkey = Object.keys(obk),
        str   = "";

    str += "svg.selectAll('" + obk.type + "')"; 
    str += ".data(data)"; // data comes in via draw queue
    str += ".enter()";
    str += ".append('g')";
    str += ".attr('class', ";
    str += obk.elemSelect || "'elements'";
    str += ")";
    str += ".append('" + obk.type + "')";
    str += ".attr(" + pretty(eatVars(obk.req_specs, obk.parent), 4, 'PRINT', true) + ")";

    // remove 'parent', 'type', 'req_specs' from inkey

    inkey = _.pull(inkey, 'parent', 'type', 'req_specs');

    // check if inkey still has length
    // if so str += results of biteBiteBite

    inkey.length && (str += biteBiteBite(inkey, obk));

    return str;

  }

  function assembleRestAtoms(keyArray){
    var str = "",
        arr = _.drop(keyArray);

    _.forEach(arr, function(el){
      var obk = choms[el],
          inkey = Object.keys(obk);

      str += "svg.append('g')"
      str += ".attr('class', "
      str += (obk.elemSelect || "'elements'") + ")"
      str += ".append('" + obk.type + "')"
      str += ".attr(" + pretty(eatVars(obk.req_specs, obk.parent), 4, 'PRINT', true) + ")"

      inkey = _.pull(inkey, 'parent', 'type', 'req_specs');

      // check if inkey still has length
      // if so str += results of biteBiteBite

      inkey.length && (str += biteBiteBite(inkey, obk));

    });

    return str;

  }


  // call this for each object in canvasKeys
  function assembleDrawFuncs(key){
    var str     = "",
        obk     = choms[key],
        obl     = Object.create(Object.prototype),
        margins = obk.margins.short_params;

    // process margins
    if (margins.length === 4){
      obl.top     = +margins[0];
      obl.right   = +margins[1];
      obl.bottom  = +margins[2];
      obl.left    = +margins[3];
    } else if (margins.length === 3){
      obl.top     = +margins[0];
      obl.right   = +margins[1];
      obl.bottom  = +margins[2];
      obl.left    = +margins[1];
    } else if (margins.length === 2){
      obl.top     = +margins[0];
      obl.right   = +margins[1];
      obl.bottom  = +margins[0];
      obl.left    = +margins[1];
    } else if (margins.length === 1){
      obl.top     = +margins[0];
      obl.right   = +margins[0];
      obl.bottom  = +margins[0];
      obl.left    = +margins[0];
    } else {
      console.log('Error: Incorrect margin arity');
    }

    // set data width & height to calculated versions for use in eatVars 
    // someday I'd like to come up with a better approach || maybe just push all user-defined vars into obj?
    
    obk.width   = obk.width - obl.left - obl.right;
    obk.height  = obk.height - obl.top - obl.bottom;

    // open func
    str += "function draw_" + key + "(data){ \n"

    // canvas vars — width & height are less idiomatic / precalculated for use throughout
    str += "var margin = " + pretty(obl) + ", \n"
    str += "width = " + obk.width +  ", \n"
    str += "height = " + obk.height + ";\n"

    // scales & maxFuncs <-  will have to be updated to account for lines || just write own scale

    if(!(obk.hasOwnProperty('xScale') && obk.xScale.hasOwnProperty('domain')) || 
       !(obk.hasOwnProperty('yScale') && obk.yScale.hasOwnProperty('domain'))) {
      str += assembleMaxes(obk);
    }

    str += "var xScale = "
    str += obk.hasOwnProperty('xScale') ? assembleScale('user', 'x', obk) : assembleScale('default', 'x') + ", \n"
    str += "yScale = "
    str += obk.hasOwnProperty('yScale') ? assembleScale('user', 'y', obk) : assembleScale('default', 'y')
    str += obk.hasOwnProperty('color') ? (", \n color = " + eatVars(obk.color) + "(); \n") : ";\n"

    // add in svg
    str += "var svg = d3.select('" + obk.selector + "')"
    str += ".append('svg')"
    str += ".attr('width', width  + margin.left + margin.right)"
    str += ".attr('height', height + margin.top + margin.bottom)"
    str += ".append('g')"
    str += ".attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');"

    // first element
    obk.children.length && (str += assembleFirstAtom(obk.children[0]));

    // any other elements
    (obk.children.length) > 1 && (str += assembleRestAtoms(obk.children) + ';\n');

    // add in axes, if they exist

    (obk.hasOwnProperty('xAxis')) && (str += assembleAxes('xAxis', obk));
    (obk.hasOwnProperty('yAxis')) && (str += assembleAxes('yAxis', obk));    

    // close it up!
    str += "};"
    return str;
  }

  // call this for each object in dataKeys
  function assembleQueues(key){
    var str = "",
        obk = choms[key];

    str += "function draw_" + key + "(rawData){\n"

    // do data cleaning

    str += "rawData.forEach(" + obk.clean + ");\n\n"

    // call child canvases

    str += stringifyList(obk.children, 'draw_', '(rawData)', '; ') + '}'
    str += "\n\n"
    str += "queue().defer(d3" + obk.filetype + ", '"
    str += obk.file + "')"
    str += ".await( function(err, data) { \n"
    str += "if(err){ console.log(err) } \n"
    str += "draw_" + key + "(data); } );"

    return str;  

  }

  // populate output in the right order
  (function metaAssemble(){
      popArrs();

      _.forEach(canvasKeys, function(el){
        output += assembleDrawFuncs(el) + "\n";
      });

      _.forEach(dataKeys, function(el){
        output +=  assembleQueues(el);
      });

      // fs.writeFile('output.js', output);

    })();
  
  return output; 
  // console.log(util.inspect(output, false, null));
   
}

exports.string  = buildString;
exports.flags   = flags;