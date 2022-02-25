
const timestampDay = 1000 * 60 * 60 * 24;

class ProjectUpdater {
  constructor(graph, params) {
    this.graph = graph;
    this.calculatedNodes = [];
    this.nodes = [];
    this.edges = [];
    this.params = params;
  }


  processStep(remaining) {
    this.setActivitiesReady();
    this.nodes = this.nodes.filter((node) => !node.ready);

    const nodesReady = this.nodes.filter((node) => {
      return node.predecessors.filter((pre) => {
        return !pre.ready;
      }).length === 0;
    });

    nodesReady.forEach((nodeReady) => {
      this.updateStartingDate(nodeReady);
      this.calculatedNodes.push(nodeReady);
    });

    if (this.nodes.length > 0 && this.nodes.length !== remaining) {
      this.processStep(this.nodes.length);
    }
  }


  setActivitiesReady() {
    this.nodes.forEach(activity => {
      if (activity.predecessors && activity.predecessors.length === 0) {
        activity.ready = true;
      }
    });
  }


  updateStartingDate(node) {
    // retrieve the greatest end date of predecessors
    const { predecessors } = node;
    let minStartDate = 0;
    predecessors.forEach((predecessor) => {
      if (predecessor.properties[this.params.ENDPROP] > minStartDate) {
        minStartDate = predecessor.properties[this.params.ENDPROP];
      }
    });
    node.properties[this.params.STARTPROP] = minStartDate + timestampDay;
    node.properties[this.params.ENDPROP] = node.properties[this.params.STARTPROP] + node.properties[this.params.DURATIONPROP] * timestampDay;

    node.predecessors = [];
  }


  splitNodesAndEdges(graphData) {
    graphData.forEach((elt) => {
      if (elt.start) {
        this.edges.push(elt);
      } else {
        elt.predecessors = [];
        this.nodes.push(elt);
      }
    });
  }


  updateProjectGraph() {
    this.splitNodesAndEdges(this.graph);
    this.edges.forEach((edge) => {
      const predecessor = this.nodes.find((node) => node.identity === edge.end);
      const successor = this.nodes.find((node) => node.identity === edge.start);
      successor.predecessors.push(predecessor);
    });

    if (this.nodes.length > 0) {
      this.processStep(this.nodes.length);
    }
  }
}

module.exports = ProjectUpdater;
