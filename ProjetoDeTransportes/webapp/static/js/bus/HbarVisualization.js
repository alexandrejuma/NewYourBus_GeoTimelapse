// ------------------------------------------------------------------
function drawBarChart(data) {
    console.log("Hello from drawBarChart!")
    console.log(data)
    // set the dimensions and margins of the graph
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }
    const width = 480 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    // set the ranges
    const y = d3.scaleBand()
        .range([height, 0])
        .padding(0.1);

    const x = d3.scaleLinear()
        .range([0, width]);

    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("#barchart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    data.forEach(function (d) {
        d.AVG_DelayInSecs = +d.AVG_DelayInSecs;
    });

    // Scale the range of the data in the domains
    x.domain([0, d3.max(data, function (d) { return d.AVG_DelayInSecs; })])
    y.domain(data.map(function (d) { return d.DestinationName; }));
    //y.domain([0, d3.max(data, function(d) { return d.AVG_DelayInSecs; })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        //.attr("x", function(d) { return x(d.AVG_DelayInSecs); })
        .attr("width", function (d) { return x(d.AVG_DelayInSecs); })
        .attr("y", function (d) { return y(d.DestinationName); })
        .attr("height", y.bandwidth());

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
}