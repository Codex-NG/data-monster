// generate names using uuid gen

consts: {

  [data]: {
  // data name generated by filename
    file:
    filetype:
    clean: [ ] // array of funcs
    children: [ ] // refs to children
  }

  [canvas]: {
  // generate name based on selected object
    selector:
    height:
    width:
    margins:
    xScale: { 
      type:
      range: 
      domain: }
    yScale: { 
      type:
      range: 
      domain: }
    xAxis:  { 
      scale:
      orientation: 
      text_specs: { }
      opt_specs: { } }
    yAxis:  { 
      scale:
      orientation: 
      text_specs: { }
      opt_specs: { } }
    parent: // is a data, named
    children: [ ] // refs to children
  }
  
  [svg_elem]: {
  // generate name based on selected node // clashes throw errors
    type:
    req_specs: { } // an object with the required svg properties, eg {'cx': 'ratio', 'cy': 'Shape_Count' }
    opt_specs: [ ] // attr, style, &c.
    events: { } // populate with functions that match mouse events or are indicated otherwise
    parent: // is a canvas, named
    children: [ ] // refs to children
  }
         

  special: {
    tooltips: [{
      exist:
      text:
      parent: 
    }],
    // Move variables to interpretation II? and just store in obj?
    variables: {
      d3: [category10, category20, category20b, category20c],
      dm: [width, height, ]
    }
  }
}