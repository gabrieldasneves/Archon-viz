const width = 812.59;
const height = 1000;

const radius = width / 2 - 50;
const node_radius = 18;

const DURATION = 700; // d3 animation duration
const STAGGERN = 4; // delay for each node
const STAGGERD = 200; // delay for each depth
const NODE_DIAMETER = 10; // diameter of circular nodes
const image_size = NODE_DIAMETER + 8;
const MIN_ZOOM = 0.5; // minimum zoom allowed
const MAX_ZOOM = 10;  // maximum zoom allowed
const HAS_CHILDREN_COLOR = 'lightsteelblue';
const SELECTED_COLOR = '#a00';  // color of selected node
const ZOOM_INC = 0.04;  // zoom factor per animation frame
const PAN_INC = 3;  //  pan per animation frame
const ROT_INC = 0.3;  // rotation per animation frame

var counter = 0;  // node ids
var curNode;  // currently selected node
var curPath;  // array of nodes in the path to the currently selected node

// current pan, zoom, and rotation
var curX = width / 2;
var curY = height / 2;
var curZ = 1.0; // current zoom
var curR = 270; // current rotation

// keyboard key codes
var KEY_PLUS = 187;     // + (zoom in)
var KEY_MINUS = 189;    // - (zoom out)
var KEY_SLASH = 191;    // / (slash)
var KEY_PAGEUP = 33;    // (rotate CCW)
var KEY_PAGEDOWN = 34;  // (rotate CW)
var KEY_LEFT = 37;      // left arrow
var KEY_UP = 38;        // up arrow
var KEY_RIGHT = 39;     // right arrow
var KEY_DOWN = 40;      // down arrow
var KEY_SPACE = 32;     // (expand node)
var KEY_RETURN = 13;    // (expand tree)
var KEY_HOME = 36;      // (center root)
var KEY_END = 35;       // (center selection)
var LABELS_ON = true;
hierarchySize = 0;
childrenAccessorFn = ([key, value]) => value.size && Array.from(value);  

function autoBox() {
  document.body.appendChild(this);
  const { x, y, width, height } = this.getBBox();
  document.body.removeChild(this);
  return [x, y, width, height];
}

checkAscendentTree = function (start, query) {
  let node = start;
  while (node.parent) {
    node = node.parent;
    if (node.data[0] == query) {
      return true;
    }
  }
  return false;
}

function showDetails(d) {
  const item = d.data[1][0];
  var titles = Object.keys(item);
  var values  = Object.values(item);
  for(var i = 0; i < titles.length;i++){
    var val = values[i].replace(" ", "\ ");
    var new_title = titles[i].replace(" ", "\ ");
    var aux = String(new_title);
    //console.log(typeof(String(new_title)));

    $("span[id=\"" +aux +"\"]").append( $( "<p class=\"details\">"+String(val)+"</p>" ) );
  };
  console.log("mostrar os detalhes deu certo");
}

function editDetails() {
  
  let x = $("span").find("p");
  propertyNames = Object.values(x);
  propertyNames.forEach(element => {

    if(element.innerHTML == ""){
      element.innerHTML = " ";
    }
    element.contentEditable = true;
    element.style.backgroundColor = "#CCCCCC";

  });
  console.log("edit details deu certo");

}

function restart(){
  localStorage.clear();
  location.reload();
}

function saveNewNode(){

  //console.log("print do que está no localStorage:");
  data = JSON.parse(localStorage.csvData);
  nodeId = localStorage.getItem("selectedNodeId"); 
  //console.log(data);

  //console.log("print dos valores do details")
  var contenteditable =  $("span").find('[contenteditable]');
  contenteditableArray = Object.values(contenteditable);


  var aux = new Array();
  contenteditableArray.forEach(function(e){
    str = (e.innerHTML);
    aux.push(str);
    });
  aux.pop();
  aux[aux.length - 1]= nodeId;


  var aux_keys = Object.getOwnPropertyNames(data[0]);
  //console.log(aux_keys);
  var new_data  = {};
  var atributes = [];
  aux_keys.forEach(element => {
    new_data[element] = "";
    atributes.push(element);
  });


  for (let i = 0; i < aux.length; i++){
    let key = atributes[i];
    new_data[key] = aux[i];
  };

  //console.log(new_data)

 data.forEach(function(el){
    if(el["leafId"] == nodeId){
      el = new_data;
      let key = el["leafId"];
      data[key] = el;
    }
  });
  aux_keys.pop();
  console.log(aux_keys);
  data["columns"] = aux_keys;
  console.log("Esses são os dados com os valores do nó editado");
  console.log(data);
  localStorage.setItem("csvData", JSON.stringify(data));

  done(data);

  document.getElementById('downloadCsvData').style.visibility = 'visible';

  document.getElementById('downloadJsonData').style.visibility = 'visible';

}

function done(d){

  $("#vis").html("");
  $("#details").html("");
  $("#tree_ordering").html("");

  console.log("dentro do done");
  console.log(d); // temos q esperar dar restart?
  redrawTree(d);
}

function donwloadCsvData(){
  console.log("dentro do download data");
  
  var data = JSON.parse(localStorage.csvData);
  var filename = "editedData.csv";

  function arrayToCSV(objArray) {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

    return array.reduce((str, next) => {
        str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
        return str;
       }, str);
  }
  csv_data = arrayToCSV(data);
  console.log(csv_data);
  var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv_data));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function donwloadJsonData(){
  console.log("dentro do download data");
  
  var data = JSON.parse(localStorage.csvData);
  var filename = "editedData.json";
  var myJsonString = JSON.stringify(data);
  
  let csv_data = myJsonString;


  console.log(csv_data);
  var element = document.createElement('a');
    element.setAttribute('href', "data:text/json;charset=utf-8," + encodeURIComponent(csv_data));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function clearDetails(d) {
  const item = d.data[1][0];
  var titles = Object.keys(item);
  var values  = Object.values(item);
  for(var i = 0; i < titles.length;i++){
    // Get the element you want to remove
    var el = document.getElementsByClassName("details");
    $(el).remove();
  };
  console.log("limpar e mostrar outros detalhes deu certo");
}

function unselectNodes() {
  d3.select("#vis").select("svg").selectAll("circle")
    .attr("stroke-width", 0)
    .attr("stroke", "none");
}

function getOrdering(data) {
  col = data.columns;
  col.forEach(function(element){
     $( "#tree_ordering" ).append( $("<div class=\"card-body tree-card\" draggable=\"true\"><span>" + element + "</span></div>" ) );
  });
  col.forEach(function(element){
    var aux = "id=\"";
    var aux1 = "\"";
    var el = element.replace(" ", "\ ");
    $( "#details" ).append( $("<div class=\"row\"><div class=\"col mb-2\"><b>" + element + "</b></div><div class=\"col\"><span " + aux + el + aux1 + "></span></div></div>" ) );
  });
  let cards = document.querySelectorAll('#tree_ordering .tree-card');
  results = [];
  cards.forEach(function(card) {
    const span = card.getElementsByTagName("span")
    //console.log(span[0].childNodes[0].data);
    results.push(span[0].childNodes[0].data); // insere o nome do card
  });


 return results;
}

var resultado = [];

function eraseOrder(){
  console.log("dentro do erase");

  let cards = document.querySelectorAll('#tree_ordering .tree-card');
  results =[];
  cards.forEach(function(card) {
    const span = card.getElementsByTagName("span")
    results.push(span[0].childNodes[0].data); // insere o nome do card
  });
  
  localStorage.setItem("hierarchySize", results.length);
  resultado.push(results.length);
  resultado.push(localStorage.getItem('hierarchySize'));
  console.log(resultado);


  // Bizu: pegar o tamanho do vetor de header e deletar o número de elementos que tem
  // tentativa 1 do Bizu

  var pai = document.getElementById("tree_ordering");
  console.log( pai.length);
  for( i = resultado[0]/2; i < resultado[resultado.length - 2] ; i++){
    console.log(i);
    pai.children[i].style.display = 'none';  
  }
  var pai = document.getElementById("details");
  //console.log(results.length);
  for(var i = resultado[0]/2; i < resultado[resultado.length - 2]; i++){
    pai.children[i].style.display = 'none';    
  }

 

  console.log("saindo do erase");

  return
}


var size = [];

function buildGroup(data, items) {  

  
  let cards = document.querySelectorAll('#tree_ordering .tree-card');
  results =[];
  cards.forEach(function(card) {
    const span = card.getElementsByTagName("span")
    results.push(span[0].childNodes[0].data); // insere o nome do card
  });
  
  localStorage.setItem("size", results.length);
  size.push(results.length);
  size.push(localStorage.getItem('hierarchySize'));
  console.log(size);

  if(size[0] == 2) {
    return d3.group(data, d => d[items[0]], d => d[items[1]]);
  }
  else if (size[0] == 3) {
    return d3.group(data, d => d[items[0]], d => d[items[1]], d => d[items[2]]);
  }
  else if (size[0] == 4) {
    return d3.group(data, d => d[items[0]], d => d[items[1]], d => d[items[2]], d => d[items[3]]);
  }
  else if (size[0] == 5) {
    return d3.group(data, d => d[items[0]], d => d[items[1]],
      d => d[items[2]], d => d[items[3]], d => d[items[4]]);
  }
  else if (size[0] == 6) {
    return d3.group(data, d => d[items[0]], d => d[items[1]],
      d => d[items[2]], d => d[items[3]], d => d[items[4]], d => d[items[5]]);
  }
  else if (size[0] == 7) {
    return d3.group(data, d => d[items[0]], d => d[items[1]],
      d => d[items[2]], d => d[items[3]], d => d[items[4]], d => d[items[5]], d => d[items[6]]);
  }
  else if (size[0] == 8) {
    return d3.group(data, d => d[items[0]], d => d[items[1]],
      d => d[items[2]], d => d[items[3]], d => d[items[4]], d => d[items[5]], d => d[items[6]], d => d[items[7]]);
  }
  else if (size[0] == 9) {
    return d3.group(data, d => d[items[0]], d => d[items[1]],
      d => d[items[2]], d => d[items[3]], d => d[items[4]], d => d[items[5]], d => d[items[6]], d => d[items[7]], d => d[items[8]]);
  }
  else if (size[0] == 10) {
    return d3.group(data, d => d[items[0]], d => d[items[1]],
      d => d[items[2]], d => d[items[3]], d => d[items[4]], d => d[items[5]], d => d[items[6]], d => d[items[7]], d => d[items[8]], d => d[items[9]]);
  }
   
   

}

function redrawTree(data) {
 
  console.log("no redraw, printando o data recebido pelo parsefile : ");
  console.log(data);
   
    //console.log("importou dado");
    //data = d3.csvParse(await FileAttachment("tree@10.csv").text())
    d3.select("#vis").select("svg").remove();

    // define the svgBase, attaching a class for styling and the zoomListener
    var svgBase = d3.select('#vis').append('svg')
    .attr('width', width)
    .attr('height', height)
    .on('mousedown', mousedown);

    // Group which holds all nodes and manages pan, zoom, rotate
    var svgGroup = svgBase.append('g')
      .attr('transform', 'translate(' + curX + ',' + curY + ')');
  

    // const svg = d3.select("#vis")
    //   .append("svg")
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("viewBox", [-width / 2, -height / 2, width, height]);

    var diagonal = d3.linkRadial()
      .angle(function(d) {
        return d.x/ 180 * Math.PI;
      })
      .radius(function(d) {
        return d.y;
      });

    // const tree = d3.tree()
    //   .size([2 * Math.PI, radius])
    //   .separation((a, b) => (a.parent == b.parent ? 2 : 3) / a.depth)

    const tree = d3.tree()
      // .nodeSize([4.5, 120])
      .size([360, Math.min(width, height) / 2 - 50])
      .separation(function(a, b) {
        return a.depth === 0 ? 1 : (a.parent == b.parent ? 1 : 2) / a.depth;
    });

    d3.select("#vis") // set up document events
      .on('wheel', wheel); // zoom
    d3.select(document)
      .on('keydown', keydown)
      .on('keyup', keyup);
    //d3.select(window).on('resize', resize);
    d3.selectAll('.toolbutton')
      .on('mousedown', tooldown)
      .on('mouseup', toolup);
    // d3.select('#selection').on('mousedown', switchroot);
    // d3.select('#contextmenu').on('mouseup', menuSelection);

    const defs = svgBase
      .append("defs")
      .append("clipPath")
      .attr("id", "image-clip")
      .append("circle")
      .attr("r", NODE_DIAMETER-1);

    const groupByOrder = buildGroup(data, getOrdering(data));
    //console.log("print do groupbyorder");
    //console.log(groupByOrder);
    const datah = d3.hierarchy([null, groupByOrder], childrenAccessorFn)
      .sort((a, b) => b.value - a.value);


      //console.log("print do datah");
      //console.log(datah);
    
    var root = tree(datah);

    root.x0 = curY;
    root.y0 = 0;
    
    selectNode(root); // current selected node
    
    update(root, true); // Layout the tree initially and center on the root node
    update(root, true);

    function update(source, transition) {
      //console.log("update", source, transition)
      var duration = transition ?
        (d3.event && d3.event.altKey ? DURATION * 4 : DURATION) : 0;
  
      // Compute the new tree layout.
      var nodes = datah.descendants();
      var links = datah.links();

      //console.log(links);  
      
      // Update the view
      svgGroup.transition().duration(duration)
        .attr('transform',
          'rotate(' + curR + ' ' + curX + ' ' + curY +
          ')translate(' + curX + ' ' + curY +
          ')scale(' + curZ + ')');
  
      // Update the nodes…
      var node = svgGroup.selectAll('g.node')
        .data(nodes, function(d) {
          //console.log(nodes)
          //console.log(d)
          return d.id || (d.id = ++counter);
        });
  
      // Enter any new nodes at the parent's previous position
      var nodeEnter = node.enter().insert('g', ':first-child')
          .attr('class', 'node')
          .attr('transform', 'rotate(' + (source.x0 - 90) + ')translate(' + source.y0 + ')')
          .on('click', click).on('dblclick', dblclick);//.on('contextmenu', showContextMenu);
          // .on('mousedown', suppress);
  
      nodeEnter.append('circle')
        .attr('r', 1e-6)
        .style('fill', function(d) {
          return d._children ? HAS_CHILDREN_COLOR : 'white';
        });
  
      nodeEnter.append('text')
        .text(function(d) {
          if(d.height != 0) {
            if (d.data[0] && d.data[0].length > 10) {
              return d.data[0].substring(0, 10) + "...";
            }
            return d.data[0];
          } else {
            return "";
          }
        })
        .style('opacity', 0.9)
        .style('fill-opacity', 0)
        .attr('transform', function() {
            return ((source.x0 + curR) % 360 <= 180 ?
                'translate(8)scale(' :
                'rotate(180)translate(-8)scale('
              ) + reduceZ() + ')';
        });
      
      nodeEnter.append("image")
        .attr("xlink:href", function (d) {
          if (d.height == 0 && d.data[0] != '') {
            return d.data[0];
          }
        })
        .attr("x", function (d) {
          return -image_size;
        })
        .attr("y", function (d) {
          return -image_size;
        })
        .attr("height", image_size * 2)
        .attr("width", image_size * 2)
        .attr("pointer-events", "none")
        .attr("clip-path", "url(#image-clip)");
      // update existing graph nodes
  
      // Change the circle fill depending on whether it has children and is collapsed
      node.select('circle')
        .attr('r', NODE_DIAMETER * reduceZ())
        .style('fill', function(d) {
            return d._children ? HAS_CHILDREN_COLOR : 'white';
        }).attr('stroke', function(d) {
            return d.selected ? SELECTED_COLOR : 'steelblue';
        }).attr('stroke-width', function(d) {
            return d.selected ? 3 : 1.5;
        });
        
      node.select('circle')
        .append('title')
          .text(function(d) {
            if(d.height != 0) {
              return d.data[0];
            } else {
              return "";
            }
          });
  
      node.select('text')
        .attr('text-anchor', function(d) {
            return (d.x + curR) % 360 <= 180 ? 'start' : 'end';
        }).attr('transform', function(d) {
            return ((d.x + curR) % 360 <= 180 ?
                'translate(8)scale(' :
                'rotate(180)translate(-8)scale('
              ) + reduceZ() +')';
        }).attr('fill', function(d) {
            return d.selected ? SELECTED_COLOR : 'black';
        }).attr('dy', '.35em');
  
      var nodeUpdate = node.transition().duration(duration)
        .delay( transition ? function(d, i) {
            return i * STAGGERN +
              Math.abs(d.depth - curNode.depth) * STAGGERD; }  : 0)
        .attr('transform', function(d) {
            return 'rotate(' + (d.x - 90) + ')translate(' + d.y + ')';
        });
  
      nodeUpdate.select('circle')
        .attr('r', NODE_DIAMETER * reduceZ());
        // .style('fill', function(d) {
        //   return d._children ? HAS_CHILDREN_COLOR : 'white';
        // });
  
      nodeUpdate.select('text')
        .style('fill-opacity', 1);
  
      // Transition exiting nodes to the parent's new position and remove
      var nodeExit = node.exit().transition().duration(duration)
        .delay( transition ? function(d, i) {
            return i * STAGGERN; } : 0)
        .attr('transform', function() {
          return 'rotate(' + (source.x - 90) +')translate(' + source.y + ')';
      }).remove();
  
      nodeExit.select('circle').attr('r', 0);
      nodeExit.select('text').style('fill-opacity', 0);
  
      // Update the links…
      var link = svgGroup.selectAll('path.link')
        .data(links, function(d) {
          return d.target.id;
        });
  
      // Enter any new links at the parent's previous position
      link.enter().insert('path', 'g')
          .attr('class', 'link')
          .attr('d', function() {
          //console.log(source);  
          var o = {
              x: source.x0,
              y: source.y0
          };
          return diagonal({
              source: o,
              target: o
          });
      });
  
      // Transition links to their new position
      link.transition().duration(duration)
        .delay( transition ? function(d, i) {
            return i * STAGGERN +
              Math.abs(d.source.depth - curNode.depth) * STAGGERD;
              // Math.max(0, d.source.depth - curNode.depth) * STAGGERD;
            } : 0)
        .attr('d', diagonal);
  
      // Transition exiting nodes to the parent's new position
      link.exit().transition().duration(duration)
          .attr('d', function() {
            var o = {
              x: source.x0,
              y: source.y0
            };
            return diagonal({
              source: o,
              target: o
            });
        }).remove();
  
      // Stash the old positions for transition
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    } // end update  
      // Helper functions for collapsing and expanding nodes
      
    function toggleLabels() {
      LABELS_ON = !LABELS_ON;
      var node = d3.select('#vis').select('svg').select('g').selectAll('g.node');
      node.select('text')
        .style('fill-opacity', function(d) {
          if (d.selected) {
          return 1;
          } else {
            return LABELS_ON ? 1 : 0; 
          } 
      });
    }  
    // Toggle expand / collapse
    function toggle(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    }
  
    function toggleTree(d) {
      if (d.children) {
        collapseTree(d);
      } else {
        expandTree(d);
      }
    }
  
    function expand(d) {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
    }
  
    // expand all children, whether expanded or collapsed
    function expandTree(d) {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (d.children) {
        d.children.forEach(expandTree);
      }
    }
  
    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      }
    }
  
    // collapse all children
    function collapseTree(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      }
      if (d._children) {
        d._children.forEach(collapseTree);
      }
    }
  
    // expand one level of tree
    function expand1Level(d) {
      var q = [d]; // non-recursive
      var cn;
      var done = null;
      while (q.length > 0) {
        cn = q.shift();
        if (done !== null && done < cn.depth) { return; }
        if (cn._children) {
          done = cn.depth;
          cn.children = cn._children;
          cn._children = null;
          cn.children.forEach(collapse);
        }
        if (cn.children) { q = q.concat(cn.children); }
      }
      // no nodes to open
    }
     // highlight selected node
    function selectNode(node) {
      if (curNode) {
        delete curNode.selected;
      }
      curNode = node;
      var nodeId = node.id;
      //localStorage.setItem("selectedNodeId", String(nodeId));
      curNode.selected = true;
      curPath = []; // filled in by fullpath
      //d3.select('#selection').html(fullpath(node));
      
    }
  
    // for displaying full path of node in tree
    function fullpath(d, idx) {
      idx = idx || 0;
      curPath.push(d);
      return (d.parent ? fullpath(d.parent, curPath.length) : '') +
        '/<span class="nodepath'+(d.data.name === root.data.name ? ' highlight' : '')+
        '" data-sel="'+ idx +'" title="Set Root to '+ d.data.name +'">' +
        d.data.name + '</span>';
    }
  
    // d3 event handlers
  
    function switchroot() {
      d3.event.preventDefault();
      var pathelms = document.querySelectorAll('#selection .nodepath');
      for (var i = 0; i < pathelms.length; i++) {
        pathelms[i].classList.remove('highlight');
      }
      var target = d3.event.target;
      var node = curPath[+target.dataset.sel];
      console.log(node);
      if (d3.event.shiftKey) {
        if (curNode !== node) {
          selectNode(node);
        }
      } else {
        root = node;
        target.classList.add('highlight');
      }
      update(root, true);
    }
  
    function resize() { // window resize
      var oldwidth = width;
      var oldheight = height;
      width = window.innerWidth - 20;
      height = window.innerHeight - 20;
      tree.size([360, Math.min(width, height) / 2 - 120]);
      svgBase.attr('width', width).attr('height', height);
      curX += (width - oldwidth) / 2;
      curY += (height - oldheight) / 2;
      svgGroup.attr('transform', 'rotate(' + curR + ' ' + curX + ' ' + curY +
          ')translate(' + curX + ' ' + curY + ')scale(' + curZ + ')');
      update(root);
    }
  
    function click(d) { // select node
      if (d3.event.defaultPrevented || d === curNode) { return; } // suppressed
      d3.event.preventDefault();
      selectNode(d);
      update(d);
      clearDetails(d);
      localStorage.setItem("selectedNodeId", curNode["data"][1][0]["leafId"]);
      if(d.height == 0){
        showDetails(d);
      } else {
        clearDetails(d);
      }

    }
  
    function dblclick(d) {  // Toggle children of node
      if (d3.event.defaultPrevented) { return; } // click suppressed
      d3.event.preventDefault();
      if (d3.event.shiftKey) {
        expand1Level(d); // expand node by one level
      } else {
        toggle(d);
      }
      // console.log("will call update", d)
      update(d, true);
      update(d, true);
    }
  
    function tooldown(d) {  // tool button pressed
      d3.event.preventDefault();
      d3.select(d3.event.target).on('mouseout', toolup);
      var key = +d3.event.target.dataset.key;
      keydown(Math.abs(key), key < 0 || d3.event.shiftKey);
    }
  
    function toolup() {  // tool button released
      d3.event.preventDefault();
      d3.select(d3.event.target).on('mouseout', null);
      keyup(Math.abs(+d3.event.target.dataset.key));
    }
  
    // right click, show context menu and select this node
    function showContextMenu(d) {
      d3.event.preventDefault();
      d3.selectAll('.expcol').text(d.children ? 'Collapse' : 'Expand');
      d3.select('#contextmenu').style({
        left: (d3.event.pageX + 3) + 'px',
        top: (d3.event.pageY + 8) + 'px',
        display: 'block'
      });
      d3.select(document).on('mouseup', hideContextMenu);
      selectNode(d);
      update(d);
    }
  
    function hideContextMenu() {
      d3.select('#contextmenu').style('display', 'none');
      d3.select(document).on('mouseup', null);
    }
  
    function menuSelection() {
      d3.event.preventDefault();
      var key = +d3.event.target.dataset.key;
      keydown(Math.abs(key), key < 0 || d3.event.shiftKey);
    }
  
    var startposX, startposY; // initial position on mouse button down for pan
  
    function mousedown() {  // pan
      d3.event.preventDefault();
      if (d3.event.which !== 1 || d3.event.ctrlKey) { return; } // ignore other mouse buttons
      startposX = curX - d3.event.clientX;
      startposY = curY - d3.event.clientY;
      d3.select(document).on('mousemove', mousemove, true);
      d3.select(document).on('mouseup', mouseup, true);
    }
  
    function mousemove() {
      d3.event.preventDefault();
      curX = startposX + d3.event.clientX;
      curY = startposY + d3.event.clientY;
      setview();
    }
  
    function mouseup() {
      d3.select(document).on('mousemove', null);
      d3.select(document).on('mouseup', null);
    }
  
    var keysdown = [];  // which keys are currently down
    var moveX = 0, moveY = 0, moveZ = 0, moveR = 0; // animations
    var aniRequest = null;
  
    function wheel() {  // mousewheel
      d3.event.preventDefault();
      d3.event.stopPropagation();
      var dz, newZ;
      var slow = d3.event.altKey ? 0.25 : 1;
      if (d3.event.wheelDeltaY !== 0) {  // up-down
        dz = Math.pow(1.0, d3.event.wheelDeltaY * 0.001 * slow);
        newZ = limitZ(curZ * dz);
        dz = newZ / curZ;
        curZ = newZ;
  
        curX -= (d3.event.clientX - curX) * (dz - 1);
        curY -= (d3.event.clientY - curY) * (dz - 1);
        setview();
      }
      if (d3.event.wheelDeltaX !== 0) {  // left-right
        curR = limitR(curR + d3.event.wheelDeltaX * 0.01 * slow);
        update(root);
      }
    }
  
    // keyboard shortcuts
    function keydown(key, shift) {
      if (!key) {
        key = d3.event.which;  // fake key
        shift = d3.event.shiftKey;
      }
      var parch; // parent's children
      var slow = d3.event.altKey ? 0.25 : 1;
      if (keysdown.indexOf(key) >= 0) { return; } // defeat auto repeat
      switch (key) {
        case KEY_PLUS: // zoom in
          moveZ = ZOOM_INC * slow;
          break;
        case KEY_MINUS: // zoom out
          moveZ = -ZOOM_INC * slow;
          break;
        case KEY_SLASH: // toggle root to selection
          toggleLabels()
          // root = root === curNode ? datah : curNode;
          // update(root, true);
          // curPath = []; // filled in by fullpath
          // //d3.select('#selection').html(fullpath(curNode));
          return;
        case KEY_PAGEUP: // rotate counterclockwise
          moveR = -ROT_INC * slow;
          break;
        case KEY_PAGEDOWN: // zoom out
          moveR = ROT_INC * slow; // rotate clockwise
          break;
        case KEY_LEFT: // left arrow
          if (shift) { // move selection to parent
            if (!curNode) {
              selectNode(root);
            } else if (curNode.parent) {
              selectNode(curNode.parent);
            }
            update(curNode);
            return;
          }
          moveX = -PAN_INC * slow;
          break;
        case KEY_UP: // up arrow
          if (shift) { // move selection to previous child
            if (!curNode) {
              selectNode(root);
            } else if (curNode.parent) {
              parch = curNode.parent.children;
              selectNode(parch[(parch.indexOf(curNode) +
                  parch.length - 1) % parch.length]);
            }
            update(curNode);
            return false;
          }
          moveY = -PAN_INC * slow;
          break;
        case KEY_RIGHT: // right arrow
          if (shift) { // move selection to first/last child
            if (!curNode) {
              selectNode(root);
            } else {
              if (curNode.children) {
                selectNode(curNode.children[d3.event.altKey ?
                    curNode.children.length - 1 : 0]);
              }
            }
            update(curNode);
            return false;
          }
          moveX = PAN_INC * slow;
          break;
        case KEY_DOWN: // down arrow
          if (shift) { // move selection to next child
            if (!curNode) {
              selectNode(root);
            } else if (curNode.parent) {
              parch = curNode.parent.children;
              selectNode(parch[(parch.indexOf(curNode) + 1) % parch.length]);
            }
            update(curNode);
            return;
          }
          moveY = PAN_INC * slow;
          break;
        case KEY_SPACE: // expand/collapse node
          if (!curNode) {
            selectNode(root);
          }
          toggle(curNode);
          update(curNode, true);
          return;
        case KEY_RETURN: // expand/collapse tree
          if (!curNode) {
            selectNode(root);
          }
          if (shift) {
            expandTree(curNode);
          } else {
            expand1Level(curNode);
          }
          update(curNode, true);
          return;
        case KEY_HOME: // reset transform
          if (shift) {
            root = treeRoot;
          }
          curX = width / 2;
          curY = height / 2;
          curR = limitR(90 - root.x);
          curZ = 1;
          update(root, true);
          return;
        case KEY_END: // zoom to selection
          if (!curNode) { return; }
          curX = width / 2 - curNode.y * curZ;
          curY = height / 2;
          curR = limitR(90 - curNode.x);
          update(curNode, true);
          return;
        default: return;  // ignore other keys
      } // break jumps to here
      keysdown.push(key);
      // start animation if anything happening
      if (keysdown.length > 0 && aniRequest === null) {
        aniRequest = requestAnimationFrame(frame);
      }
    }
  
    function keyup(key) {
      key = key || d3.event.which;
      var pos = keysdown.indexOf(key);
      if (pos < 0) { return; }
  
      switch (key) {
        case KEY_PLUS: // zoom out
        case KEY_MINUS: // zoom in
          moveZ = 0;
          break;
        case KEY_PAGEUP: // rotate CCW
        case KEY_PAGEDOWN: // rotate CW
          moveR = 0;
          break;
        case KEY_LEFT: // left arrow
        case KEY_RIGHT: // right arrow
          moveX = 0;
          break;
        case KEY_UP: // up arrow
        case KEY_DOWN: // down arrow
          moveY = 0;
          break;
      }
      keysdown.splice(pos, 1);  // remove key
      if (keysdown.length > 0 || aniRequest === null) { return; }
      cancelAnimationFrame(aniRequest);
      aniRequest = aniTime = null;
    }
  
    var aniTime = null;
  
    // update animation frame
    function frame(frametime) {
      var diff = aniTime ? (frametime - aniTime) / 16 : 0;
      aniTime = frametime;
  
      var dz = Math.pow(1.2, diff * moveZ);
      var newZ = limitZ(curZ * dz);
      dz = newZ / curZ;
      curZ = newZ;
      curX += diff * moveX - (width / 2- curX) * (dz - 1);
      curY += diff * moveY - (height / 2 - curY) * (dz - 1);
      curR = limitR(curR + diff * moveR);
      setview();
      aniRequest = requestAnimationFrame(frame);
    }
  
    // enforce zoom extent
    function limitZ(z) {
      return Math.max(Math.min(z, MAX_ZOOM), MIN_ZOOM);
    }
  
    // keep rotation between 0 and 360
    function limitR(r) {
      return (r + 360) % 360;
    }
  
    // limit size of text and nodes as scale increases
    function reduceZ() {
      return Math.pow(1.1, -curZ);
    }
  
    // set view with no animation
    function setview() {
        svgGroup.attr('transform', 'rotate(' + curR + ' ' + curX + ' ' + curY +
            ')translate(' + curX + ' ' + curY + ')scale(' + curZ + ')');
        svgGroup.selectAll('text')
            .attr('text-anchor', function(d) {
                return (d.x + curR) % 360 <= 180 ? 'start' : 'end';
            })
            .attr('transform', function(d) {
                return ((d.x + curR) % 360 <= 180 ?
                    'translate(8)scale(' :
                    'rotate(180)translate(-8)scale('
                  ) + reduceZ() +')';
            });
        svgGroup.selectAll('circle').attr('r', NODE_DIAMETER * reduceZ());
    }

    console.log("saindo do redraw");  
}

function addEventListener(data) {
  
  let dragSrcEl = null;

  function handleDragStart(e) {
    this.style.opacity = '0.4';

    dragSrcEl = this;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    console.log("dragstart");
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';

    return false;
  }

  function handleDragEnter(e) {
    this.classList.add('over');
  }

  function handleDragLeave(e) {
    this.classList.remove('over');
  }

  function handleDrop(e) {
     
    
    if (e.stopPropagation) {
      e.stopPropagation(); // stops the browser from redirecting.
    }

    if (dragSrcEl != this) {
      dragSrcEl.innerHTML = this.innerHTML;
      this.innerHTML = e.dataTransfer.getData('text/html');
    }
    
    redrawTree(data);

    eraseOrder();
    return false;
  }

  function handleDragEnd(e) {
    this.style.opacity = '1';

    items.forEach(function (item) {
      item.classList.remove('over');
    });
  }


  let items = document.querySelectorAll('.tree-card');
  items.forEach(function (item) {
    item.addEventListener('dragstart', handleDragStart, false);
    item.addEventListener('dragenter', handleDragEnter, false);
    item.addEventListener('dragover', handleDragOver, false);
    item.addEventListener('dragleave', handleDragLeave, false);
    item.addEventListener('drop', handleDrop, false);
    item.addEventListener('dragend', handleDragEnd, false);
  });
}

var reader = new FileReader();  

function loadFile() { 
  var file = document.querySelector('input[type=file]').files[0];      
  reader.addEventListener("load", parseFile, false);
  if (file) {
    reader.readAsText(file);
  }  
  

  
}
    
function parseFile(){

  var data = d3.csvParse(reader.result, function(d){
    doesColumnExist = d.hasOwnProperty("someColumn");
    return d;   
  });
  console.log("printando o dado recebido no upload:");
  console.log(data);
  data.forEach(function(el, i=0){
   //console.log(el);
   el["leafId"] = i.toString();

   //console.log(typeof(el["leafId"]));
   i = i + 1;
  });

  redrawTree(data);
  // saving data on localStorage:
  localStorage.setItem("csvData", JSON.stringify(data));
  //to recover data use: var data = JSON.parse(localStorage.csvData); 
  addEventListener(data);
}
  
  

  