﻿var metaNodes = [];

$(function () {

    loadNode("@1");

    setMode();
});


function openmenu() {
    alert(metaNodes.length);
}

function indexOf(id) {
    for (var i = 0; i < metaNodes.length; i++) {
        if ((metaNodes[i].query == id) | (metaNodes[i].id == id)) {
            return metaNodes[i];
        }
    }
}

function loadNode(query) {
    var host = "http://localhost:82/";
    $.ajax({
        type: "GET",
        url: host + query,
        success: function (get) {

            var nodesArr = get.split('\n\n');
            var expr = /^((.*?)\^)?(.*?)?(@(.*?))(\$(.*?))?(\?(.*?))?(#(.*?))?(\|(.*?))?(\n(.*?))?$/g;
            var groups = expr.exec(nodesArr[0]);
            if (groups == null)
                return;
            nodesArr.shift();


            var paramsArr = !!groups[9] ? groups[9].split('&') : [];

            var focusNode = indexOf(groups[4]);

            if (!!!focusNode) {
                //create
                metaNodes.push({
                    query: "",
                    parent: groups[2],
                    name: groups[3],
                    id: groups[4],
                    sysparams: groups[7],
                    params: paramsArr,
                    value: groups[11],
                    felse: groups[13],
                    next: groups[15],
                    local: nodesArr
                });
                focusNode = metaNodes[metaNodes.length - 1];
            }
            else {
                //update
                focusNode.query = "";
                focusNode.parent = groups[2];
                focusNode.name = groups[3];
                focusNode.id = groups[4];
                focusNode.sysparams = groups[7];
                focusNode.params = paramsArr;
                focusNode.value = groups[11];
                focusNode.felse = groups[13];
                focusNode.next = groups[15];
                focusNode.local = nodesArr;
            }

            if (!!focusNode.local)
                for (var i = 0; i < focusNode.local.length; i++) {
                    metaNodes.push({
                        query: focusNode.local[i],
                        x: !!focusNode.x ? focusNode.x + 50 : 50,
                        y: !!focusNode.y ? focusNode.y + (i * 50) + 50 : (i * 50) + 50,
                        color: "red"
                    });
                    loadNode(nodesArr[i]);
                }

            /*
          
            if (!!focusNode.params)
                for (var i = 0; i < focusNode.params.length; i++) {
                    metaNodes.push({
                        query: focusNode.params[i],
                        x: !!focusNode.x ? focusNode.x + (i * 40) + 40 : (i * 40) + 40,
                        y: !!focusNode.y ? focusNode.y - 20 : -20,
                        color: "orange"
                    });
                    loadNode(focusNode.params[i]);
                }

            if (!!focusNode.value) {
                metaNodes.push({
                    query: focusNode.value,
                    x: !!focusNode.x ? focusNode.x + 40 : 40,
                    y: !!focusNode.y ? focusNode.y : 0,
                    color: "blue"
                });
                loadNode(focusNode.value);
            }*/

            if (!!focusNode.next) {
                metaNodes.push({
                    query: focusNode.next,
                    x: !!focusNode.x ? focusNode.x : 0,
                    y: !!focusNode.y ? focusNode.y + 40 : 40,
                    color: "black"
                });
                loadNode(focusNode.next);
            }


        },
        error: function (request, error) {
            sleep(3000);
            loadNode(query);
        }
    });
    
}


var mode = 1;


function setMode() {


    if (mode == 1) {

        var viewAttr = [20, 3, 5, 12];




        var startInnerRadius = 12;
        var startOuterRadius = 20;
        var margin = { top: 0, right: 0, bottom: 0, left: 0 },
            width = document.getElementById('content').clientWidth,
            height = document.getElementById('content').clientHeight;


        var color = d3.scale.category20();

        var pie = d3.layout.pie()
                .sort(null);

        var arc = d3.svg.arc()
                .innerRadius(startInnerRadius)
                .outerRadius(startOuterRadius);
                
        var zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on("zoom", zoomed);
           
        var drag = d3.behavior.drag()
            .origin(function (d) { return d; })
            .on("dragstart", dragstarted)
            .on("drag", dragged)
            .on("dragend", dragended);

        var svg = d3.select("#content").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
            .call(zoom);
                   
        var rect = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all");

        svg = svg.append("g");

        function zoomed() {
            svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }
        
        function dragged(d) {
            d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
            document.getElementById("footer").innerHTML = d.x;
        }

        
        function dragended(d) {
            d3.select(this).classed("dragging", false);
        }
        

        setInterval(update, 500);

        function update() {
        
  /*g = svg.selectAll("g")
    .data(blocks);

  gEnter = g.enter().append("g")
    .call(drag);

  g.attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });

  gEnter.append("rect")
    .attr("height", 100)
    .attr("width", 100);*/

            var g = svg.selectAll("g")
                .data(metaNodes);
            //create
            var nodeGroup = g
                .enter()
                .append("g")
                
                //.on('click', function (d) { alert(JSON.stringify(d)); })
                ;

            g.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

            var path = nodeGroup.selectAll("path")
                .data(pie(viewAttr))
                .enter()
                .append("path")
                .attr("fill", function (d, i) { return color(i) })
                .attr("d", arc)
                .each(function (d) { this._current = d; })
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
                .call(drag);

            var circle = nodeGroup
                .append("circle")
                .attr("r", 20)
                .attr("fill", function (d) { return d.color; })
                .attr("opacity", 0.5)
                /*.attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; })
                .call(drag)*/
           ;
            nodeGroup.call(drag);
            /*var label = nodeGroup.append("text")
               .text(function (d) { return JSON.stringify(d.params); });*/


            //udpate

            var newRadius = viewAttr[0];

            for (var i = 1; i < viewAttr.length; i++) {
                viewAttr[i] = Math.floor(Math.random() * 10) + 1;

            svg.selectAll("g")
                    .attr("opacity", function (d) { return d.query == "" ? "1" : "0.3"; })
                    .selectAll("path")
                    .data(pie(viewAttr))
                    .transition()
                    .duration(500)
                    /*.attrTween("d", function (a) {
                var i = d3.interpolate(this._current, a),
                k = d3.interpolate(arc.outerRadius()(), newRadius);
                this._current = i(0);
                return function (t) {
                    return arc.innerRadius(k(t) / 4).outerRadius(k(t))(i(t));
                };
            })*/;
        }

        
        }
    }






    if (mode == 2) {

        var treeData = { 
            "name": "A",    
            "children": [
                        { "name": "A1" },
                        { "name": "A2" },
                        { 
                            "name": "A3",   
                            "children": [{ 
                                    "name": "A31", 
                                    "children": [
                                        { "name": "A311" },
                                        { "name": "A312" }
                                    ]
                             }]
                        }]
        };

        // Create a svg canvas
        var vis = d3.select("#content").append("svg:svg")
                .attr("width", 400)
                .attr("height", 300)
                .append("g")
                .attr("transform", "translate(40, 0)"); // shift everything to the right

        // Create a tree "canvas"
        var tree = d3.layout.tree()
                .size([300, 150]);

        var diagonal = d3.svg.diagonal()
                // change x and y (for the left to right tree)
                .projection(function (d) { return [d.y, d.x]; });

        // Preparing the data for the tree layout, convert data into an array of nodes
        var nodes = tree.nodes(treeData);
        // Create an array with all the links
        var links = tree.links(nodes);

        var link = vis.selectAll("pathlink")
                .data(links)
                .enter().append("path")
                /*.attr("class", "link")*/
                .attr("d", diagonal)
                .attr("fill", "none")
                .attr("stroke", "#ccc")
                .attr("stroke-width", 3);

        var node = vis.selectAll("node")
                .data(nodes)
                .enter().append("g")
                .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; })

        // Add the dot at every node
        node.append("circle")
                .attr("r", 3.5);

        // place the name atribute left or right depending if children
        node.append("text")
                .attr("dx", function (d) { return d.children ? -8 : 8; })
                .attr("dy", 3)
                .attr("text-anchor", function (d) { return d.children ? "end" : "start"; })
                .text(function (d) { return d.name; })
    }





    
}


