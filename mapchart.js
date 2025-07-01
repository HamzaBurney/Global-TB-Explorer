const container = d3.select("#mapchart");
const width = container.node().clientWidth; // Subtracting 50 for margin or padding

const height = 500;
const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)

const tooltip4 = d3.select("#tooltip4");

// Map projection
const projection = d3.geoMercator()
    .center([0, 20])
    .scale(width / 2 / Math.PI)
    .translate([width/2, height / 2]);

// Path generator
const path = d3.geoPath().projection(projection);

// Create a color scale with specific colors for regions
const color = d3.scaleOrdinal()
    .domain(["Americas", "Africa", "Asia", "Oceania", "Europe"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]); // Red, Green, Yellow, Blue, Purple

// Create a size scale for bubbles
const size = d3.scaleSqrt().range([1, 50]);

// Add year options dynamically
const yearSelector = d3.select("#year");

// Add a zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8]) // Limit zoom levels
    .translateExtent([[0, 0], [width, height]]) // Limit panning
    .on("zoom", zoomed);

svg.call(zoom);

// Create a group for map elements (to be transformed by zoom)
const g = svg.append("g");

// Initialize map and data
Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
]).then(([dataGeo]) => {
    // Draw country boundaries
    g.append("g")
        .selectAll("path")
        .data(dataGeo.features)
        .join("path")
        .attr("fill", "#b8b8b8")
        .attr("d", path)
        .style("stroke", "#000") // Add black stroke for boundaries
        .style("opacity", 0.7);

    // Create an interactive legend inside the SVG
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20, 20)"); // Position the legend

    const regions = ["Asia", "Africa", "Europe", "Americas", "Oceania"];
    const activeRegions = new Set(regions); // Track active regions

    function filterRegions(region) {
        // const region = d3.select(this).select("span").text();
        const isSelected = activeRegions.has(region);
        if (activeRegions.size > 1) {
            activeRegions.clear();
            activeRegions.add(region);
            filterForceDirected(region);
        }
        else {
            if (isSelected) {
                activeRegions.clear();
                activeRegions.add(regions[0]);
                activeRegions.add(regions[1]);
                activeRegions.add(regions[2]);
                activeRegions.add(regions[3]);
                activeRegions.add(regions[4]);
                filterForceDirected('all');
            }
            else {
                activeRegions.clear();
                activeRegions.add(region);
                filterForceDirected(region);
            }
        }

        updateChart(yearSelector.node().value); // Refresh chart
        // Update legend opacity
        legendItems.each(function(d) {
            d3.select(this).style("opacity", activeRegions.has(d) ? 1 : 0.5);
        });
        
    }
    // Legend items creation
    const legendItems = legend.selectAll(".legend-item")
        .data(regions)
        .enter().append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`)
        .style("cursor", "pointer")
        .on("click", function(event, d) {  // Properly handle event and data (d)
            filterRegions(d);
        });

    // Create colored rectangles for the legend
    legendItems.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => color(d));

    // Create text labels for the legend
    legendItems.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text(d => d);

    // Function to update chart with selected year's data
    const updateChart = (year) => {
        const csvFile = `MapChart_Dataset\\${year}_Data.csv`;
        d3.csv(csvFile).then(data => {
            // Update scales based on data
            const valueExtent = d3.extent(data, d => +d.Tuberculosis_Deaths);
            size.domain(valueExtent);

            // Filter data based on active regions
            const filteredData = data.filter(d => activeRegions.has(d.region));

            // Bind data to circles
            const circles = g.selectAll("circle").data(filteredData, d => d.country);

            // Exit
            circles.exit().remove();

            // Enter + Update
            circles.join("circle")
                .attr("cx", d => projection([+d.longitude, +d.latitude])[0])
                .attr("cy", d => projection([+d.longitude, +d.latitude])[1])
                .attr("r", d => size(+d.Tuberculosis_Deaths))
                .style("fill", d => color(d.region)) // Use custom colors for regions
                .style("stroke", d => (+d.Tuberculosis_Deaths > 2000 ? "black" : "none"))
                .style("stroke-width", 1)
                .style("fill-opacity", 0.7)
                .on("mouseover", (event, d) => {
                    tooltip4.transition().duration(200).style("opacity", 1);
                    tooltip4.html(`Country: ${d.Country}<br>Deaths: ${d.Tuberculosis_Deaths}<br>Region: ${d.region}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY + 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip4.transition().duration(200).style("opacity", 0);
                });
        });
    };

    // Event listener for year selection
    yearSelector.on("change", function () {
        const selectedYear = this.value;
        updateChart(selectedYear);
    });

    // Load initial year
    updateChart(2000);
});

// Function to handle zoom behavior
function zoomed(event) {
    g.attr("transform", event.transform);
}
