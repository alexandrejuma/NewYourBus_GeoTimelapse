var margin = {top: 10, right: 30, bottom: 40, left: 60},
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


  // Now I can use this dataset:
  function mydraw(inputData) {
    var parseTime = d3.timeParse("%Y%m%d%H");
   var data =  inputData.map(function(d){return {time: parseTime(d.colapsed_ts), value:d.AVG_DelayInSecs} })

    // Add X axis --> it is a date format d3.extent(data, function(d) { return d3.timeFormat("%Y-%m-%d")(d.colapsed_ts); })
    var x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { return d.time; }))
      .range([ 0, width ]);
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.value; }))
      .range([ height, 0 ]);
    svg.append("g")
      .call(d3.axisLeft(y));

    // Add the line
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()         
        .x(function(d) { return x(d.time) })
        .y(function(d) { return y(d.value) })
        )

    // create a tooltip
    var Tooltip = d3.select("#my_dataviz")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")

      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = function(d) {
        Tooltip
          .style("opacity", 1)
      }
      var mousemove = function(d) {
        Tooltip
          .html("Delay: " + d.value + "\n (" + d.time + ")")
          .style("left", (d3.mouse(this)[0]+70) + "px")
          .style("top", (d3.mouse(this)[1]) + "px")
      }
      var mouseleave = function(d) {
        Tooltip
          .style("opacity", 0)
      }

    // Add the points 
    svg
      .append("g")
      .selectAll("dot")
      .data(data)
      .enter()
      .append("circle")
        .attr("class", "myCircle")
        .attr("cx", function(d) { return x(d.time) } )
        .attr("cy", function(d) { return y(d.value) } )
        .attr("r", 8)
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 3)
        .attr("fill", "white")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

      svg.append("text")
          .style("font-size", "14px")
          .attr("text-anchor", "middle")
          .attr("transform", "translate(" + (width / 2) + "," + (height - (margin.bottom - 74)) + ")")
          .text("Date");

      svg.append("text")
          .style("font-size", "14px")
          .attr("class", "y label")
          .attr("text-anchor", "middle")
          .attr("transform", "translate(" + (margin.left - 94) + "," + (height / 2) + ")rotate(-90)")
          .text("Average Delay");
}