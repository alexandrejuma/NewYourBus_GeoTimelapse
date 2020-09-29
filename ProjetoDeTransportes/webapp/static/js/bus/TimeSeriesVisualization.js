function drawTimeSeries(lineData) {
    var height = 200;
    var width = 700;
    var hEach = 40;

    var margin = { top: 20, right: 15, bottom: 25, left: 25 };

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    var svg = d3.select('#timeseries').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // set the ranges
    var x = d3.scaleTime().range([0, width]);

    x.domain(d3.extent(lineData, function (d) { return d.colapsed_ts; }));


    var y = d3.scaleLinear().range([height, 0]);


    y.domain([d3.min(lineData, function (d) { return d.AVG_DelayInSecs; }) - 5, 100]);

    var valueline = d3.line()
        .x(function (d) { return x(d.colapsed_ts); })
        .y(function (d) { return y(d.AVG_DelayInSecs); })
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .data([lineData])
        .attr("class", "line")
        .attr("d", valueline);

    //  var xAxis_woy = d3.axisBottom(x).tickFormat(d3.timeFormat("Week %V"));
    var xAxis_woy = d3.axisBottom(x).ticks(11).tickFormat(d3.timeFormat("%Y%m%d%H")).tickValues(lineData.map(d => d.colapsed_ts));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis_woy);

    //  Add the Y Axis
    //  svg.append("g").call(d3.axisLeft(y));

    svg.selectAll(".dot")
        .data(lineData)
        .enter()
        .append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d) { return x(d.colapsed_ts) })
        .attr("cy", function (d) { return y(d.AVG_DelayInSecs) })
        .attr("r", 5);


    svg.selectAll(".text")
        .data(lineData)
        .enter()
        .append("text") // Uses the enter().append() method
        .attr("class", "label") // Assign a class for styling
        .attr("x", function (d, i) { return x(d.colapsed_ts) })
        .attr("y", function (d) { return y(d.AVG_DelayInSecs) })
        .attr("dy", "-5")
        .text(function (d) { return d.AVG_DelayInSecs; });

    svg.append('text')
        .attr('x', 10)
        .attr('y', -5)
        .text('Almaty'); 
}