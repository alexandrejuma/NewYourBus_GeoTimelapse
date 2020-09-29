
function drawHeatMap(data) {
    // modify if needed
    // Initialize the map
    // [40.63517, -73.960803] are the latitude and longitude
    // 10 is the zoom
    // mapid is the id of the div where the map will appear
    var mymap = L
    .map('mapid')
    .setView([40.631718,-74.036407], 10);

    // map from service provider Mapbox
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 10, // value 10 is perfect
    attribution: 'Map data &copy ; <a href="https://www.openstreetmap.org/"> OpenStreetMap</a> contributors, ' + '<a href ="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery \textcopyright <a href ="https://www.mapbox.com/">Mapbox</a>', id: 'mapbox.streets'}).addTo(mymap);


    // format information of d3.timeFormat() at https://d3-wiki.readthedocs.io/zh_CN/master/Time-Formatting/
    var formatDateIntoYear = d3.timeFormat("%Y");
    var formatDateIntoDayWithWeekday = d3.timeFormat("%A %d");
    var formatDate = d3.timeFormat("%a %d - %H:%M");
    var parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ"); // "%d-%m-%Y %H:%M"
    var directoryOfFiles = "/home/bdvapp/webapp/datasource/mta/";

    // Change this dates acording to the data to be displayed (could possibly make some automatic way of finding it out)
    // Automatic idea, get first date (index=0) of array as startDate and array.length-1 as endDate
    var startDate = new Date(2017, 5, 1), // new Date("2017-06-01"), // 0 is January, 1 is February, 5 is June, 6 is July
    endDate = new Date(2017, 5, 30, 23); // new Date("2017-06-30");

    // end edit
    var margin = {top:50, right:50, bottom:0, left:50},
    width = 960 - margin.left - margin.right, // 960
    height = 120 - margin.top - margin.bottom; // 500

    var svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);  

    ////////// slider //////////

    var moving = false;
    var currentValue = 0;
    var targetValue = (30 * 24) - 1; // 30 days times 24 hours - 1 cause 0 also counts // width

    var playButton = d3.select("#play-button");

    var popupDiv = d3.select("#mapid").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

    /*
    var busIcon = L.icon({iconUrl: 'https://i.imgur.com/0nHWJTl.png', iconSize = [30, 56], iconAnchor = [14, 56]}) // iconSize = [276, 511], iconAnchor = [129, 509] // 511 // (129/276) * 30 = 14 and (511/276) * 30 = 56
    // '../../../datasource/bus_stop_icon.png'
    console.log("Bus Icon:");
    console.log(busIcon);
    */
    

    var x = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, targetValue])
    .clamp(true);

    var slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + 50 + ")"); // height/5

    slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function() { 
            slider.interrupt();
            if(moving == false) {
                // drawCircles(true);
                update(x.invert(currentValue), false);
            }
        })
        .on("start drag", function() {
            currentValue = d3.event.x;
            //console.log(currentValue);
            currentValue = Math.max(0, currentValue);
            currentValue = Math.min(targetValue, currentValue);
            //drawCircles(false);
            update(x.invert(currentValue), false); 
        })
    );

    slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x.ticks(30))
    .enter()
    .append("g")
    .attr("class", "tick")
    .attr("transform", function(d){ return "translate(" + x(d) + ",0)"; })
    .append("text")
    .attr("y", 0)
    .attr("transform", "rotate(45)")
    .attr("text-anchor", "start")
    .text(function(d) { return formatDateIntoDayWithWeekday(d); });

    var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

    var label = slider.append("text")  
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .text(formatDate(startDate))
    .attr("transform", "translate(0," + (-25) + ")")


    ////////// plot //////////
    
    var dataset;
    var heatmap = null;
    var heatmap_data;
    var circles_drawn = null;
    var isToShowBusIcons = true;

    d3.select("#isToShowBusIcons").on("change", function(d){
        isToShowBusIcons = d3.select("#isToShowBusIcons").property("checked");
        console.log(d3.select("#isToShowBusIcons").property("checked"));
        console.log('checkbox changed');
        update(x.invert(currentValue), !isToShowBusIcons);
    });
    d3.select("#isToShowBusIcons").property('checked', true);

    console.log(data);

    function prepare(d) {
        console.log(d);
        var array_heatmap = [];
        d.forEach(function(row) {
            var destinationPoint = row.DestinationPoint.split(",");
            var averageDelayInSeconds = parseFloat(row.AVG_DelayInSecs);
            var isAverageDelayActualDelay = null;
            if(averageDelayInSeconds > 0) {
                isAverageDelayActualDelay = true;
                averageDelayInSeconds = averageDelayInSeconds;
            } else {
                if(averageDelayInSeconds < 0) {
                    isAverageDelayActualDelay = false;
                    averageDelayInSeconds = averageDelayInSeconds * -1;
                } else {
                    // the value is 0 so there is no delay
                    isAverageDelayActualDelay = "No Delay";
                    averageDelayInSeconds = averageDelayInSeconds;
                }
            }
            var averageDelayHours = parseInt((averageDelayInSeconds/(60*60))); // 60 seconds in a minute and 60 minutes in an hour
            var averageDelayMinutes = parseInt((parseInt((averageDelayInSeconds/60)) - averageDelayHours*60)); // 60 seconds in a minute
            var averageDelaySeconds = parseInt(averageDelayInSeconds - ((averageDelayHours*60*60) + (averageDelayMinutes*60)));
            
            
            array_heatmap.push({
                ScheduledArrivalTime: parseDate(row.ScheduledArrivalTimeTSHr),
                DestinationName: row.DestinationName, // added
                //DestinationPoint: row[2],
                DestinationPointLatitude: destinationPoint[0],
                DestinationPointLongitude: destinationPoint[1],
                DistinctCount_Vehicles: BigInt(row.DistinctCount_Vehicles), // added
                DistinctCount_Lines: BigInt(row.DistinctCount_Lines), // added
                //AVG_DistanceFromStopInt: parseFloat(row.AVG_DistanceFromStopInt),
                //MIN_DistanceFromStopInt: parseInt(row[6]),
                //MAX_DistanceFromStopInt: parseInt(row[7]),
                //SUM_DistanceFromStopInt: BigInt(row[8]),
                //AVG_DelayInSecs: parseFloat(row.AVG_DelayInSecs), // added
                AverageDelay_isActualDelay: isAverageDelayActualDelay,
                AverageDelay_Hours: parseInt(averageDelayHours), // added
                AverageDelay_Minutes: parseInt(averageDelayMinutes), // added
                AverageDelay_Seconds: parseInt(averageDelaySeconds), // added
                //MIN_DelayInSecs: parseFloat(row[10]),
                //MAX_DelayInSecs: parseFloat(row[11]),
                //SUM_DelayInSecs: parseFloat(row[12]),
                //RecCount: parseFloat(row[13]),
                HeatMapIntensity: parseFloat(row.HeatMapIntensity)
                //colapsed_ts: row[15]
            });
        })
        console.log("Array Heatmap:");
        console.log(array_heatmap);
        return array_heatmap;
    }

    function setupPlayButton() {
        playButton
            .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                // timer = 0;
                button.text("Play");
                //drawCircles(true);
                update(x.invert(currentValue), false);
                
            } else {
                moving = true;
                timer = setInterval(step, 100);
                button.text("Pause");
                //drawCircles(false);
                update(x.invert(currentValue), true);
            }
            console.log("Slider moving: " + moving);
        })
    }

    heatmap_data = prepare(data);
    console.log("Heatmap_data:");
    console.log(heatmap_data);
    setupPlayButton();
    
    function step() {
        update(x.invert(currentValue), false);
        currentValue = currentValue + (targetValue/targetValue); // 151
        if (currentValue > targetValue) {
            moving = false;
            currentValue = 0;
            clearInterval(timer);
            // timer = 0;
            playButton.text("Play");
            console.log("Slider moving: " + moving);
        }
    }

    function drawHeatMap(data) {
        var arrayOfPoints = setupArrayOfPointsForHeatmap(data);
        if(heatmap != null) {
            heatmap.remove();
        }

        heatmap = L.heatLayer(arrayOfPoints, {radius: 15}, {max: 1}, {blur : 15}).addTo(mymap);
    }

    function setupArrayOfPointsForHeatmap(data) {
        var array = [];
        data.forEach(function(line) {
            array.push([line.DestinationPointLatitude, line.DestinationPointLongitude, line.HeatMapIntensity]);
        })
        return array;
    }

    function update(h, isToRemoveCircles) {
        // update position and text of label according to slider scale
        handle.attr("cx", x(h));
        label.attr("x", x(h))
            .text(formatDate(h));

        console.log("Timestamp date:")
        console.log(h);

        // Filter data to draw on heatmap
        dataset = heatmap_data.filter(function(d) {
            var previousTime = new Date(h.getTime() - 1000*60*60);
            //console.log("Object date:")
            //console.log(d.ScheduledArrivalTime);
            return d.ScheduledArrivalTime > previousTime && d.ScheduledArrivalTime <= h;
        })
        console.log("Dataset");
        console.log(dataset);
        console.log(!moving && !isToRemoveCircles && isToShowBusIcons);
        drawHeatMap(dataset);
        drawCircles(dataset, !moving && !isToRemoveCircles && isToShowBusIcons);
    }

    // Heatmap
    update(x.invert(currentValue));
    //drawCircles(true);

    function drawCircles(dataset, isToDrawNewCircles) {
        clearCircles();

        if(isToDrawNewCircles) {
            // draw new circles
            circles_drawn = [];
            dataset.forEach(function(circle) {
                circles_drawn.push(new L.circle([circle.DestinationPointLatitude, circle.DestinationPointLongitude], 15, { color: 'blue', fillColor: '#0000ff', fillOpacity: 0.5}).addTo(mymap) //new L.marker([circle.DestinationPointLatitude, circle.DestinationPointLongitude], {icon: busIcon}).addTo(mymap) //new L.circle([circle.DestinationPointLatitude, circle.DestinationPointLongitude], 15, { color: 'green', fillColor: '#f03', fillOpacity: 0.5}).addTo(mymap)
                .on("mouseover", function() {
                            var styleColor = "color:blue";
                    		if(circle.AverageDelay_isActualDelay == true) {
                                styleColor = "color:red";
                            } else {
                                if(circle.AverageDelay_isActualDelay == false) {
                                    styleColor = "color:green";
                                }
                            }
                            var averageDelay = '<b>Average Delay:</b><br/><p style="' + styleColor + '">';
                            if(circle.AverageDelay_Hours > 0) {
                                averageDelay += circle.AverageDelay_Hours + ' hours, ';
                            }
                            if(circle.AverageDelay_Minutes > 0) {
                                averageDelay += circle.AverageDelay_Minutes + ' minutes and ';
                            } else {
                                if(circle.AverageDelay_Hours > 0) {
                                    averageDelay += "0 minutes and ";
                                }
                            }
                            averageDelay += circle.AverageDelay_Seconds + " seconds.</p>";
                    popupDiv.transition()		
                        .duration(200)		
                        .style("opacity", .9);		
                    popupDiv.html("Destination Name: " + circle.DestinationName + "<br/> Distinct Vehicles: " + circle.DistinctCount_Vehicles + "<br/> Distinct Lines: " + circle.DistinctCount_Lines + "<br/>" + averageDelay);	
                        //.style("left", (d3.event.pageX) + "px")		
                        //.style("top", (d3.event.pageY - 28) + "px");	
                    })					
                .on("mouseout", function() {		
                    popupDiv.transition()		
                        .duration(500)		
                        .style("opacity", 0);	
                }));
            });
        }
    }

    function clearCircles() {
        if(circles_drawn != null) {
            circles_drawn.forEach(function(circle) {
                circle.remove();
            });
            circles_drawn = null;
        }
    }

    // Markers for reference
    // Add markers
    /*
    L.marker([40.63517, -73.960803]).addTo(mymap).bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();
        
    L.circle([40.616104, -74.031143], 500, { color: 'red', fillColor: '#f03', fillOpacity: 0.5}).addTo(mymap).bindPopup("I am a circle.");

    L.polygon([[40.643169, -74.073494], [40.875008, -73.880142], [40.701748, -73.802399]]).addTo(mymap).bindPopup("I am a polygon.");

    var popup = L.popup();

    function onMapClick(e) {
        popup.setLatLng(e.latlng).setContent("You clicked the map at " + e.latlng.toString()).openOn(mymap);
    }

    mymap.on('click', onMapClick);
    */
}

