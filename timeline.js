const tooltip5 = d3.select("#tooltip5");
d3.json("Timeline_Dataset\\final_data.json").then((data) => {
  // Prepare data for year
  const yearSlider = document.getElementById("yearSlider");
  // Do this:
  const yearLabel = d3.select("#yearLabel"); // Use D3 to select the element

  const container = d3.select("#timeline");
  const width = container.node().clientWidth;
  const height = 600;
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);
  

  // Define color scale based on the unique regions
  const regionColor = d3
    .scaleOrdinal()
    .domain(["Americas", "Africa", "Asia", "Oceania", "Europe"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]); // Color scheme

  // Scales
  const xScale = d3
    .scaleLog()
    .domain([50000, d3.max(data, (d) => d.population[19][1])])
    .range([40, width - 40]);

  const yScale = d3
    .scaleLinear()
    .domain([20, d3.max(data, (d) => d.lifeExpectancy[19][1])])
    .range([height - 40, 40]);

  const radiusScale = d3
    .scaleSqrt()
    .domain([0, d3.max(data, (d) => d.Tubercolosis_Deaths[19][1])])
    .range([5, 50]);

  // Create axes
  svg
    .append("g")
    .attr("transform", `translate(0,${height - 40})`)
    .call(d3.axisBottom(xScale).ticks(10));

  svg
    .append("g")
    .attr("transform", "translate(40,0)")
    .call(d3.axisLeft(yScale).ticks(10));

  // Create grid lines for x-axis (vertical)
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - 40})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(5)
        .tickSize(-height + 80) // Size of grid lines, extends to y-axis
        .tickFormat("") // Remove tick labels
    );

  // Create grid lines for y-axis (horizontal)
  svg
    .append("g")
    .attr("class", "grid")
    .attr("transform", "translate(40,0)")
    .call(
      d3
        .axisLeft(yScale)
        .ticks(10)
        .tickSize(-width + 80) // Size of grid lines, extends to x-axis
        .tickFormat("") // Remove tick labels
    );

  // Add X-axis title (below the x-axis)
  svg
    .append("text")
    .attr("class", "x-axis-title")
    .attr("text-anchor", "middle")
    .attr("x", width / 2) // Position it in the middle of the x-axis
    .attr("y", height - 5) // A little below the x-axis
    .text("Population"); // Title text

  // Add Y-axis title (left of the y-axis)
  svg
    .append("text")
    .attr("class", "y-axis-title")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)") // Rotate the text to align it vertically
    .attr("x", -height / 2) // Position it in the middle of the y-axis
    .attr("y", 10) // A little to the right of the y-axis
    .text("Life Expectancy (Years)"); // Title text

  // Function to update the chart with a new year
  function updateChart(year) {
    // Prepare the data for the given year
    const processedData = data.map((d) => {
      const pop = d.population.find((p) => p[0] === year)[1];
      const lifeExpectancy = d.lifeExpectancy.find((le) => le[0] === year)[1];
      const tbDeaths = d.Tubercolosis_Deaths.find((t) => t[0] === year)[1];
      const region = d.region;
      const subregion = d.subregion;

      return {
        name: d.name,
        population: pop,
        lifeExpectancy: lifeExpectancy,
        Tubercolosis_Deaths: tbDeaths,
        region: region,
        subregion: subregion,
      };
    });

    // Sort the data by population (descending) first, for positioning
    processedData.sort((a, b) => b.population - a.population);

    // Sort the data by the radius (tbDeaths) in descending order for correct layering of circles
    processedData.sort((a, b) => b.Tubercolosis_Deaths - a.Tubercolosis_Deaths);

    const circles = svg.selectAll(".bubble").data(processedData, (d) => d.name);

    // Remove old circles
    circles.exit().remove();

    // Update existing circles
    circles
      .transition() // Begin the transition
      .duration(1000) // Set the duration of the transition (1 second)
      .ease(d3.easeCubicInOut)
      .attr("cx", (d) => xScale(d.population)) // Update the x position
      .attr("cy", (d) => yScale(d.lifeExpectancy)) // Update the y position
      .attr("r", (d) => radiusScale(d.Tubercolosis_Deaths)) // Update the radius
      .style("fill", (d) => regionColor(d.region))
      .style("stroke", "black")
      .style("stroke-width", 1);

    // Append new circles (only when new data is added)
    circles
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", (d) => xScale(d.population))
      .attr("cy", (d) => yScale(d.lifeExpectancy))
      .attr("r", (d) => radiusScale(d.Tubercolosis_Deaths))
      .style("fill", (d) => regionColor(d.region))
      .style("stroke", "black")
      .style("stroke-width", 1)
      .on("mouseover", function (event, d) {
        tooltip5
          .style("opacity", 1)
          .html(
            `Country: ${d.name}<br>Region: ${d.region}<br>Subregion: ${d.subregion}<br>Deaths: ${d.Tubercolosis_Deaths}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      })
      .on("mouseout", function () {
        tooltip5.style("opacity", 0);
      });

    // Update the slider label
    yearLabel.text(year);
  }

  // Update chart when slider value changes
  yearSlider.addEventListener("input", function () {
    const year = parseInt(yearSlider.value);
    updateChart(year);
  });

  // Initial chart for year 2000
  updateChart(2000);

  // Play/Pause button logic
  let isPlaying = false;
  let playInterval;

  document
    .getElementById("playPauseBtn")
    .addEventListener("click", function () {
      if (isPlaying) {
        clearInterval(playInterval);
        this.textContent = "Play";
      } else {
        playInterval = setInterval(function () {
          let currentYear = parseInt(yearSlider.value);
          if (currentYear < 2019) {
            yearSlider.value = currentYear + 1;
            updateChart(currentYear + 1);
          } else {
            clearInterval(playInterval);
            yearSlider.value = 2000;
            updateChart(2000);
            document.getElementById("playPauseBtn").textContent = "Play";
          }
        }, 800);
        this.textContent = "Pause";
      }
      isPlaying = !isPlaying;
    });

  const regions = ["Asia", "Africa", "Europe", "Americas", "Oceania"];
  // Create the region legend
  const legend = d3.select("#legend");
  let selectedRegions = new Set(); // Keep track of selected regions
  
  function filter(region) {

    const isSelected = selectedRegions.has(region);

        // Toggle the selection status of the clicked region
        if (isSelected) {
          selectedRegions.delete(region); // Deselect region
          filterForceDirected('all');
        } else {
          selectedRegions.clear();
          selectedRegions.add(region); // Select region
          filterForceDirected(region);
        }
        // filterMap(region);

        // If no regions are selected, show all circles
        if (selectedRegions.size === 0) {
          svg.selectAll(".bubble").style("opacity", 1); // Show all circles
        } else {
          // Update circle opacity based on the selected regions
          svg.selectAll(".bubble").style("opacity", (d) => {
            return selectedRegions.has(d.region) ? 1 : 0.1; // Show only selected regions
          });
        }

  }

  regions.forEach((region) => {
    const legendItem = legend
      .append("div")
      .attr("class", "legend-item")
      .on("click", function () {
        const region = d3.select(this).select("span").text();
        filter(region);
      });

    legendItem
      .append("div")
      .attr("class", "legend-color")
      .style("background-color", regionColor(region));

    legendItem.append("span").text(region);
  });
});
