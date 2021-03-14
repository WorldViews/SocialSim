(function (window) {
    "use strict";

    class Sim {

        constructor(graph, model, params, synth) {
            console.log("Sim.constructor", graph, model, params);
            this.startStamp = new Date();
            console.log("started at", this.startStamp);
            this.gen = 0;
            this.running = false;
            this.params = params;
            this.graph = graph;
            //this.data = graph.data;
            this.model = model;
            if (model.selectedActions == null)
                model.selectedActions = model.actions;
            this.synth = synth;
            this.useMidi = false;
            this.nodeById = {};
            var inst = this;
            graph.data.nodes.forEach(n => inst.nodeById[n.id] = n);
            graph.data.edges.forEach(e => {
                e.srcNode = inst.nodeById[e.source];
                e.dstNode = inst.nodeById[e.target];
            })
            this.reset();
        }

        reset() {
            let params = this.params;
            this.gen = 0;
            this.setState({
                arousal: params.arousalBaseline,
                volatility: params.emotionalVolatility,
                happiness: params.emotionalBaseline,
                susceptability: params.susceptability
            });
            this.graph.data.nodes.forEach(node => node.receivedActions = []);
            this.graph.data.edges.forEach(edge => edge.act = null);
            if (params.initFun)
                params.initFun(this);
            //this.updateAppearance();
        }

        /*
        updateAppearance() {
            var inst = this;
            this.graph.data.nodes.forEach(node => inst.updateNodeAppearance(node));
            this.graph.data.edges.forEach(edge => inst.updateEdgeAppearance(edge));
        }

        updateNodeAppearance(node) {
            node.style = { fill: this.getColor(node.happiness, node.arousal) };
        }

        updateEdgeAppearance(edge) {
            var action = edge.act;
            if (action == "smile") {
                edge.style = { stroke: "green", lineWidth: 3 };
            }
            else if (action == "scowl") {
                edge.style = { stroke: "red", lineWidth: 3 };
            }
            else {
                edge.style = { stroke: "gray", lineWidth: 1 };
            }
        }
        */

        getData() {
            return this.data;
        }

        // set given attribute value for all nodes
        setState(vals, nodeIds) {
            var inst = this;
            let nodes = this.graph.data.nodes;
            if (nodeIds)
                nodes = nodeIds.map(id => inst.nodeById[id]);
            for (let node of nodes) {
                for (var key in vals)
                    node[key] = vals[key];
                //console.log("setState", node.id, node.happiness);
            }
        }

        // return array of component values for given state component
        // in same order as nodes
        getStateValues(component) {
            return this.graph.data.nodes.map( n => n[component]);
        }

        updateState() {
            this.debug = false;
            if (this.debug)
                debugger;
            this.gen++;
            let data = this.data;
            //console.log("updateState");
            this.updateNodeStates();
            this.produceActions();
            this.handleActions();
            return this.data;
        }

        // this first handles intrinsic changes in state that
        // occur independently of interactions.
        updateNodeStates() {
            var inst = this;
            let nodes = this.graph.data.nodes;
            nodes.forEach(node => {
                node.happiness = inst.clamp(node.happiness + node.volatility * (Math.random() - 0.5), 0, 1);
                //node.style = { fill: inst.getColor(node.happiness, node.arousal) };
            });
        }

        produceActions() {
            //let edges = this.data.edges;
            var inst = this;
            this.graph.data.nodes.forEach(node => node.receivedActions = []);
            this.graph.data.edges.forEach(edge => {
                let n1 = edge.srcNode;
                let n2 = edge.dstNode;
                if (!n1 || !n2) {
                    console.log("edge not initialized correctly");
                    return;
                }
                /*
                n1 = n1.defaultCfg.model; // should find 'correct' way to do this...
                n2 = n2.defaultCfg.model;
                if (!n1 || !n2)
                    return;
                */              
                inst.chooseActions(edge, n1, n2);
                inst.chooseActions(edge, n2, n1);
            });
        }

        // This produces possible actions of agent n1 towards n2
        // which are places on queue of actions peformed on n2.
        chooseActions(edge, n1, n2) {
            let inst = this;
            let actions = this.model.selectedActions;
            let stroke = "gray";
            let lineWidth = 1;
            edge.act = null;
            var h = n1.happiness;
            //console.log("edge", n1, h, n2);
            if (n1.arousal > Math.random()) {
                for (var action of actions) {
                    if (action == "smile" && h > Math.random()) {
                        //console.log("smile", n1, n2);
                        edge.act = action;
                        stroke = "green";
                        lineWidth = 3;
                        n2.receivedActions.push(action);
                    }
                    if (action == "scowl" && h < Math.random()) {
                        //console.log("smile", n1, n2);
                        edge.act = action;
                        stroke = "red";
                        lineWidth = 3;
                        n2.receivedActions.push(action);
                    }
                }
            }
            //edge.style = { stroke, lineWidth };
        }

        setEdgeAppearance(edge) {
            var action = edge.act;
            if (action == "smile") {
                edge.style = { stroke: "green", lineWidth: 3 };
            }
            else if (action == "scowl") {
                edge.style = { stroke: "red", lineWidth: 3 };
            }
            else {
                edge.style = { stroke: "gray", lineWidth: 1 };
            }
        }

        handleActions() {
            var inst = this;
            this.graph.data.nodes.forEach(node => inst.handleReceivedActions(node, node.receivedActions));
        }

        handleReceivedActions(node, actions) {
            var inst = this;
            var LIFE = true;
            if (this.model.actionsUpdate) {
                return this.model.actionsUpdate(this, node, actions);
            }
            for (var action of actions) {
                if (action == "smile")
                    node.happiness = inst.clamp(node.happiness + this.params.susceptability, 0, 1);
                if (action == "scowl")
                    node.happiness = inst.clamp(node.happiness - this.params.susceptability, 0, 1);
                if (inst.useMidi > 0) {
                    let note = 50 + Math.floor(node.happiness * 30);
                    //let note = 60 + numSmiles % 5;
                    this.synth.noteOn(1, note, 100);
                    this.synth.noteOff(1, note, 0.1);
                }
            }
        }

        getColor(h, arousal) {
            var r = Math.floor(250 * (1 - h));
            var g = Math.floor(250 * h);
            var b = 125;
            //return "rgb("+r+","+g+","+b+")";
            var a = 0.25 + 0.75 * arousal;
            return "rgba(" + r + "," + g + "," + b + "," + a + ")";
        }

        clamp(v, low, high) {
            if (v < low)
                return low;
            if (v > high)
                return high;
            return v;
        }


        //********************************************************/
        // This next section contains various static funtions that
        // might better be moved to another class

        static test() {
            console.log("static test 1 called");

            var grid4x5 = Sim.genGridGraph(4, 5, 180);
            var grid = Sim.genGridGraph(6, 8, 120);
            console.log("grid", grid);
            console.log("------------------------");
            let ranGeo25 = Sim.genRandomGeoGraph(25, 100);
            console.log("ranGeo25", ranGeo25)
            console.log("------------------------");

            let model = { components: ["happiness"], actions: ["smile"]};
            let params = Sim.getDefaultParams();
            let data = {data: grid, layout: 'force'}
            let sim = new Sim(data, model, params);
            Sim.sim = sim; // for debugging, can get this in dev console
            console.log("sim", sim);
            console.log("------------------------");
            sim.reset(params);
            let n1 = sim.graph.data.nodes[0];
            sim.setState({happiness: 1}, [n1.id]);
            console.log("sim", sim);
            console.log("------------------------");
            sim.updateState();
            console.log("sim", sim);
            console.log("------------------------");
            sim.updateState();
            console.log("sim", sim);
            console.log("------------------------");
            sim.updateState();
            console.log("sim", sim);
            console.log("------------------------");
            for (var i=0; i<50; i++) {
                sim.updateState()
                var hv = sim.getStateValues("happiness");
                console.log(sim.gen, "happiness", hv);
            }
            return "finished";
        }

        static getDefaultParams() {
            return {
                delay: 0.0,
                emotionalBaseline: 0.0,
                arousalBaseline: 0.5,
                emotionalVolatility: 0.0,
                susceptability: 0.1
              };
        }
        // Gerate a set of nodes corresponding to points
        // on a grid.   Nodes within a threshold distance
        // will be assigned as neighbors
        static genGridGraph(nrows, ncols, dthresh) {
            let findNeighbors = Sim.findNeighbors;
            if (dthresh == null)
                dthresh = 120;
            var nodes = [];
            var edges = [];
            var width = 800;
            var height = 600;
            var w = width / ncols;
            var h = height / nrows;
            var cx = width / 2;
            var cy = height / 2;
            var x0 = cx - (ncols * w) / 2;
            var y0 = cy - (nrows * h) / 2;
            var idx = 0;
            for (let j = 0; j < ncols; j++) {
                for (let i = 0; i < nrows; i++) {
                    var id = "a" + i + "_" + j;
                    var x = x0 + w * j;
                    var y = y0 + h * i;
                    nodes.push({ id, x, y, size: 20 });
                }
            }
            nodes.forEach(node => {
                let neighbors = findNeighbors(node, dthresh, nodes);
                neighbors.forEach(node2 => {
                    edges.push({ source: node.id, target: node2.id });
                });
            });
            return { nodes, edges };
        }

        static genRandomGeoGraph(n, dthresh) {
            let uniform = Sim.uniform;
            var nodes = [];
            var edges = [];
            var w = 800;
            var h = 600;
            for (var i = 0; i < n; i++) {
                var node = { id: "n" + i, index: i, x: uniform(0, w), y: uniform(0, h), size: 20 };
                nodes.push(node);
            }
            nodes.forEach(node => {
                let neighbors = Sim.findNeighbors(node, dthresh, nodes);
                neighbors.forEach(node2 => {
                    edges.push({ source: node.id, target: node2.id });
                });
            });
            return { nodes, edges };
        }

        // return uniformly distributed number in range [a,b]
        // note that this relies on Math.random which is not seedable
        // for having reproducible monte carlo tests, it would be nice
        // to use a RNG that allows seeds to be provided.
        static uniform(a, b) {
            return a + Math.random() * (b - a);
        }

        static dist(n1, n2) {
            var dx = n1.x - n2.x;
            var dy = n1.y - n2.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        // find all noders withing distance d of the given node
        static findNeighbors(node, d, nodes) {
            var dist = Sim.dist;
            var neighbors = nodes.filter(n2 => n2.id < node.id && dist(node, n2) < d);
            return neighbors;
        }


    }


    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = Sim;
    }
    else if (typeof define === 'function' && define.amd) {
        define(function () {
            return Sim;
        });
    }
    else {
        window.Sim = Sim;
    }

})(this);
