//https://codepen.io/mromanoff/pen/dPYeMv
var HorizontalBarGraph = function(el, series) {
    this.el = d3.select(el);
    this.series = series;
  };
  
  HorizontalBarGraph.prototype.draw = function() {
    var x = d3.scaleLinear()
      .domain([0, d3.max(this.series, function(d) { return d.AVG_DelayInSecs })])
      .range([0, 100]);
  
    var segment = this.el
      .selectAll(".horizontal-bar-graph-segment")
        .data(this.series)
      .enter()
        .append("div").classed("horizontal-bar-graph-segment", true);
  
    segment
      .append("div").classed("horizontal-bar-graph-label", true)
        .text(function(d) { return d.DestinationName });
  
    segment
      .append("div").classed("horizontal-bar-graph-value", true)
        .append("div").classed("horizontal-bar-graph-value-bar", true)
          .style("background-color", function(d) { return '#6699ff' })
          .text(function(d) { return d.AVG_DelayInSecs ?   (Math.round(d.AVG_DelayInSecs * 100) / 100).toFixed(2) + " (s)": "" })
          .transition()
            .duration(1000)
            .style("min-width", function(d) { return x(d.AVG_DelayInSecs) + "%" });
  
  };
  
    function mydraw(data) {
      var graph = new HorizontalBarGraph('#graph',data);
    graph.draw();
    }