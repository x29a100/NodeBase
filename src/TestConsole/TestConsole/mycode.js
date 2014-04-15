﻿var metaNodes = [];
var rootID;

$(function () {

    /*d3.select("#footer")
        .style("height", "0px")
        .style("min-height", "0px");
    d3.select("#menu")
        .style("width", "0px")
        .style("min-width", "0px");*/

    rootID = "@1";

    loadNode(rootID);

    setMode();

});




function openmenu() {
    alert(metaNodes.length);
}

function getNode(id) {
    if (!!!id) return;
    for (var i = 0; i < metaNodes.length; i++) {
        if ((metaNodes[i].query == id) || (metaNodes[i].id == id)) {
            return metaNodes[i];
        }
    }
}

function deleteNode(id) {
    if (!!!id) return;
    for (var i = 0; i < metaNodes.length; i++) {
        if ((metaNodes[i].query == id) || (metaNodes[i].id == id)) {
            metaNodes.splice(i, 1);
            return;
        }
    }
}




function loadNode(query, n) {

    var host = "http://localhost:82/";
    $.ajax({
        type: "GET",
        url: host + query,
        success: function (get) {

            var nodesArr = get.split('\n\n');
            var expr = /^((.*?)\^)?(.*?)?(@(.*?))(\$(.*?))?(:(.*?))?(\?(.*?))?(#(.*?))?((\|)(.*?))?(\n(.*?))?$/g;
            var group = expr.exec(nodesArr[0]);
            if (group == null)
                return;
            nodesArr.shift();


            var paramsArr = !!group[11] ? group[11].split('&') : [];

            var focusNode = getNode(group[4]);

            if (!!!focusNode) {
                //create
                metaNodes.push({
                    query: "",
                    source: group[2],
                    name: group[3],
                    id: group[4],
                    sysparams: group[7],
                    ftype: group[9],
                    params: paramsArr,
                    value: !!!group[14] ? group[13] : undefined,
                    ftrue: !!group[14] ? group[13] : undefined,
                    felse: group[16],
                    next: group[18],
                    local: nodesArr
                });
                focusNode = metaNodes[metaNodes.length - 1];
            }
            else {
                //update
                focusNode.query = "";
                focusNode.source = group[2];
                focusNode.name = group[3];
                focusNode.id = group[4];
                focusNode.sysparams = group[7];
                focusNode.ftype = group[9],
                focusNode.params = paramsArr;
                focusNode.value = !!!group[14] ? group[13] : undefined,
                focusNode.ftrue = !!group[14] ? group[13] : undefined,
                focusNode.felse = group[16];
                focusNode.next = group[18];
                focusNode.local = nodesArr;
            }
        },
        error: function (request, error) {
            if (!!!n) n = 1;
            if (n < 3) {
                loadNode(query, n + 1)
            }else {
                deleteTree(query);
            }
        }
    });

}


function deleteTree(id) {
    var node = getNode(id);
    if (!!!node) return;
    if (!!node.local) {
        for (var i = 0; i < node.local.length; i++)
            deleteTree(node.local[i]);
    }
    if (!!node.next) {
        deleteTree(node.next);
    }
    if (!!node.params) {
        for (var i = 0; i < node.params.length; i++)
            deleteTree(node.params[i]);
    }
    if (!!node.value) {
        deleteTree(node.value);
    }
    if (!!node.ftype) {
        deleteTree(node.ftype);
    }

    if (!!node.ftrue) {
        deleteTree(node.ftrue);
    }
    if (!!node.felse) {
        deleteTree(node.felse);
    }
    deleteNode(node.id);
}


function loadLinks(node) {


    var height = !!node.height ? node.height : 0;

    if (node.query != "") return;

    if (!!node.local) {//and expand true
        for (var i = 0; i < node.local.length; i++) {
            metaNodes.push({query: node.local[i], color: "red", parentLocal: node.id});
            loadNode(node.local[i]);
        }
    }

    if (!!node.next) {
        metaNodes.push({query: node.next, color: "green", prev: node.id });
        loadNode(node.next);
    }

    if (!!node.params) {
        for (var i = 0; i < node.params.length; i++) {
            metaNodes.push({ query: node.params[i], color: "orange", parentParams: node.id });
            loadNode(node.params[i]);
        }
    }

    if (!!node.value) {
        if (node.value.indexOf('@') != -1) {
            metaNodes.push({ query: node.value, color: "blue", parentValue: node.id });
            loadNode(node.value);
        }
    }

    if (!!node.ftype) {
        metaNodes.push({ query: node.ftype, color: "purple", parentType: node.id });
        loadNode(node.ftype);
    }

    if (!!node.ftrue) {
        metaNodes.push({ query: node.ftrue, color: "white", parentTrue: node.id });
        loadNode(node.ftrue);
    }

    if (!!node.felse) {
        metaNodes.push({ query: node.felse, color: "black", parentElse: node.id });
        loadNode(node.felse);
    }
}


var D = 40;
var R = D / 2;
var dist = 10;
var dRight = D + dist;
var dDown = D + dist;

function setHeight(root) {
    if (!!!root) return;
    var height = 0;

    if (!!root.local) {
        for (var i = 0; i < root.local.length; i++) {
            var node = getNode(root.local[i]);
            if (!!!node) continue;
            setHeight(node);
            height += dDown + node.height;
        }
    }
    if (!!root.next) {
        var node = getNode(root.next);
        if (!!node) {
            setHeight(node);
            height += dDown + node.height;
        }
    }

    root.height = height;
}


function setPosition(root) {
    if (!!!root) return;

    

    var x = !!root.x ? root.x : 0,
        y = !!root.y ? root.y : 0;
    var top = 0;
    var right = 0;


    if (!!root.ftype) {
        var node = getNode(root.ftype);
        if (!!node) {

            if (!!root.expand ? root.expand : false) {
                if (!(!!(node.dragging) && (node.dragging))) {
                    node.y = y + R;
                    node.x = x + R;
                }
                setPosition(node);
            }
            else {
                deleteTree(node.id);
            }
        }
    }

    if (!!root.local) {
        for (var i = 0; i < root.local.length; i++) {
            var node = getNode(root.local[i]);
            if (!!!node) continue;
            

            if (!!root.expand ? root.expand : false) {
                top += dDown;
                if (!(!!(node.dragging) && (node.dragging))) {
                    node.y = y + top;
                    node.x = x + dRight;
                }
                setPosition(node);
                top += node.height;
            }
            else {
                deleteTree(node.id);
            }
        }
    }

    if (!!root.params) {
        right += dRight + root.labelWidth;
        for (var i = 0; i < root.params.length; i++) {
            var node = getNode(root.params[i]);
            if (!!!node) continue;
            
            if (!!root.expand ? root.expand : false) {
                if (!(!!(node.dragging) && (node.dragging))) {
                    node.y = y + top;
                    node.x = x + right;
                }
                setPosition(node);
                right += dRight + node.labelWidth;
            }
            else {
                deleteTree(node.id);
            }
        }
    }


    if (!!root.ftrue) {
        var node = getNode(root.ftrue);
        if (!!node) {

            if (!!root.expand ? root.expand : false) {

                if (!(!!(node.dragging) && (node.dragging))) {
                    node.y = y + top - dDown;
                    node.x = x + right + dRight;
                }
                setPosition(node);
            }
            else {
                deleteTree(node.id);
            }
        }
    }


    if (!!root.felse) {
        var node = getNode(root.felse);
        if (!!node) {

            if (!!root.expand ? root.expand : false) {

                if (!(!!(node.dragging) && (node.dragging))) {
                    node.y = y + top + dDown;
                    node.x = x + right + dRight;
                }
                setPosition(node);
            }
            else {
                deleteTree(node.id);
            }
        }
    }


    if (!!root.value) {
        var node = getNode(root.value);
        if (!!node) {

            if (!!root.expand ? root.expand : false) {

                if (!(!!(node.dragging) && (node.dragging))) {
                    node.y = y + top;
                    node.x = x + right;
                }
                setPosition(node);
                right += dRight + node.labelWidth;
            }
            else {
                deleteTree(node.id);
            }
        }
    }




    if (!!root.next) {

        var node = getNode(root.next);
        if (!!node) {
            if (!!root.expand ? root.expand : false) {
                top += dDown;
                if (!(!!(node.dragging) && (node.dragging))) {
                    node.y = y + top;
                    node.x = x;
                }
                setPosition(node);
                top += node.height;
            }
            else {
                deleteTree(node.id);
            }
        }
    }

}

var mode = 1;


var timerCounter = 0;


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
            .scaleExtent([-10, 20])
            .on("zoom", zoomed)
            ;
           
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
            .call(zoom)
            .on("dblclick.zoom", null)
            ;
                   
        var rect = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all");

        svg = svg.append("g");

        function zoomed() {
            svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            svg.selectAll("text").each(function (d) { d.labelWidth = this.getComputedTextLength(); }); //update label width
            update();
        }

        function dragstarted(d) {
            d.dragging = true;
            d3.event.sourceEvent.stopPropagation();
            //d3.select(this).classed("dragging", true);
        }
        
        function dragged(d) {
            d3.select(this).attr("transform", function (d) { return "translate(" + (d.x = d3.event.x) + "," + (d.y = d3.event.y) + ")"; });
            update();
            document.getElementById("footer").innerHTML = d.x;
        }

        function dragended(d) {
            d.dragging = false;
            //d3.select(this).classed("dragging", false);
        }

        d3.selection.prototype.moveToFront = function () {
            return this.each(function () {
                this.parentNode.appendChild(this);
            });
        };

        d3.selection.prototype.moveToBack = function () {
            return this.each(function () {
                var firstChild = this.parentNode.firstChild;
                if (firstChild) {
                    this.parentNode.insertBefore(this, firstChild);
                }
            });
        };
        

        setInterval(update, 300);
        
        function update() {



            setHeight(getNode(rootID));
            setPosition(getNode(rootID));

            var g = svg.selectAll("g")
                .data(metaNodes);

            //delete
            g.exit().remove();

            //create
            var nodeGroup = g
                .enter()
                .append("g")
                .call(drag)
                .on("dblclick", function (d) {
                    d.expand = !!d.expand ? !d.expand : true;
                    if (d.expand) {
                        loadLinks(d);
                        update();
                    }
                })
                .style("cursor", "pointer")
                ;

            g.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });


            var circle = nodeGroup
                .append("circle")
                .attr("r", 20)
                .attr("fill", function (d) { return d.color; })
                .attr("opacity", 0.5)
                ;

            var path = nodeGroup.selectAll("path")
                .data(pie(viewAttr))
                .enter()
                .append("path")
                .attr("fill", function (d, i) { return color(i) })
                .attr("d", arc)
                .each(function (d) { this._current = d; })
                ;
                

            

            var label = nodeGroup
                .append("text")
                .attr("font-size", "14px");

           
            //udpate
            svg.selectAll("text")
                .text(function (d) { return d.name; })
                .attr("transform", function () { return "translate(" + R + "," + 0 + ")"; })
                .each(function (d) { d.labelWidth = this.getComputedTextLength(); })
                ;

           /*var params = nodeGroup
                .append("circle")
                .attr("r", 20)
                .attr("fill", function () { return "red"; })
                .attr("class", "params")
                ;

           svg.selectAll(".params")
                .attr("transform", function (d) { return "translate(" + (d.labelWidth + R + dist + R) + "," + 0 + ")"; })
                ;
                
                */
           svg.selectAll("g")
                .attr("opacity", function (d) { return d.query == "" ? 1 : 0.3; })
                .selectAll("path")
                .data(pie(viewAttr))
                    



            /*.transition()
            .duration(500)
            .attrTween("d", function (a) {
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



