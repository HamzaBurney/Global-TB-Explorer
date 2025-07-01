const tooltip3 = d3.select("#tooltip3");

var data = {
  nodes: [],
  links: [],
};
function nodeClicked(event, d) {
  // Prevent default propagation to avoid other events (like drag) to interfere
  event.stopPropagation();

  // Check if this node is currently highlighted
  const isSelected = d3.select(this).classed("highlighted");

  // Reset all nodes and links to default styles
  d3.selectAll("circle").classed("highlighted", false);
  d3.selectAll("line").classed("link-highlighted", false);

  // Toggle the highlighted state based on previous state
  if (!isSelected) {
    // This node was not highlighted, so highlight it now
    d3.select(this).classed("highlighted", true);

    console.log(d3.selectAll("line").filter((link) => link.source));
    // Highlight links connected to this node
    d3.selectAll("line")
      .filter((link) => link.source === d || link.target === d)
      .classed("link-highlighted", true);
  }
  // If it was already selected, it has been reset to 'false' by the code above
}

// function populateDropdown(regions) {
//   const existingSvg = d3.select("#region-select").selectAll("option");
//   if (!existingSvg.empty()) {
//     existingSvg.remove();
//   }

//   const select = d3.select("#region-select");
//   select.append("option").attr("value", "all").text("All Regions");
//   regions.forEach((region) => {
//     select.append("option").attr("value", region).text(region);
//   });
// }

function updateGraph(selectedRegion) {
  const filteredNodes = data.nodes.filter(
    (d) => selectedRegion === "all" || d.region === selectedRegion
  );
  const filteredLinks = data.links.filter(
    (link) =>
      filteredNodes.some((node) => node.id === link.source) &&
      filteredNodes.some((node) => node.id === link.target)
  );

  // Redraw the graph using these filtered nodes and links
  if (selectedRegion === "all") {
    loadData();
  } else {
    filteredData({ nodes: filteredNodes, links: filteredLinks });
  }
}

function filteredData(fData) {
  const container = d3.select("#forcedirected-chart");
  const width = container.node().clientWidth;
  const height = width * 0.9;

  const existingSvg = container.select("svg");
  if (!existingSvg.empty()) {
    existingSvg.remove();
  }

  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", (event) => {
      // Apply zoom and pan transform to the entire group
      svg.attr("transform", event.transform);
    });

  // Create the SVG container.
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;")
    .call(zoom) // Apply the zoom behavior to the SVG
    .append("g");

  d3.select("#region-select").on("change", function () {
    const selectedRegion = this.value;
    updateGraph(selectedRegion);
  });

  // Specify the color scale.
  const color = d3
    .scaleOrdinal()
    .domain(["Americas", "Africa", "Asia", "Oceania", "Europe"])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]); // Color scheme

  // The force simulation mutates links and nodes, so create a copy
  // so that re-evaluating this cell produces the same result.
  const links = fData.links.map((d) => ({ ...d }));
  const nodes = fData.nodes.map((d) => ({ ...d }));

  const deathExtent = d3.extent(fData.nodes, (d) => d.Tuberculosis_Deaths);
  const radiusScale = d3.scaleSqrt().domain(deathExtent).range([5, 50]);

  // Create a simulation with several forces.
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collide",
      d3.forceCollide((d) => radiusScale(d.Tuberculosis_Deaths) + 2)
    );

  // Add a line for each link, and a circle for each node.
  const link = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll()
    .data(links)
    .join("line")
    .attr("stroke-width", (d) => d.value)
    .on("click", nodeClicked);

  const node = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(nodes)
    .join("circle")
    .attr("r", (d) => radiusScale(d.Tuberculosis_Deaths))
    .attr("fill", (d) => color(d.region))
    .on("mouseover", function (event, d) {
      tooltip3
        .style("opacity", 1)
        .html(
          `Country: ${d.id}<br>Region: ${d.region}<br>Subregion: ${d.subregion}<br>Deaths: ${d.Tuberculosis_Deaths}`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip3.style("opacity", 0);
    })
    .on("click", nodeClicked);

  // Add a drag behavior.
  node.call(
    d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
  );

  // Reheat the simulation when drag starts, and fix the subject position.
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    event.sourceEvent.stopPropagation(); // Stop propagation to prevent click event after drag
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    // if (d3.event.defaultPrevented) event.sourceEvent.stopPropagation(); // Prevent click event
  }

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => Math.max(20, Math.min(width - 20, d.source.x)))
      .attr("y1", (d) => Math.max(20, Math.min(height - 20, d.source.y)))
      .attr("x2", (d) => Math.max(20, Math.min(width - 20, d.target.x)))
      .attr("y2", (d) => Math.max(20, Math.min(height - 20, d.target.y)));

    node
      .attr("cx", (d) => Math.max(20, Math.min(width - 20, d.x)))
      .attr("cy", (d) => Math.max(20, Math.min(height - 20, d.y)));
  });
}
function loadData() {
  const container = d3.select("#forcedirected-chart");
  const width = container.node().clientWidth;
  const height = width * 0.9;

  const existingSvg = container.select("svg");
  if (!existingSvg.empty()) {
    existingSvg.remove();
  }

  const zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", (event) => {
      // Apply zoom and pan transform to the entire group
      svg.attr("transform", event.transform);
    });

  // Create the SVG container.
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;")
    .call(zoom) // Apply the zoom behavior to the SVG
    .append("g");

  d3.select("#region-select").on("change", function () {
    const selectedRegion = this.value;
    updateGraph(selectedRegion);
  });

  // Specify the color scale.
  const color = d3
  .scaleOrdinal()
  .domain(["Americas", "Africa", "Asia", "Oceania", "Europe"])
  .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]); // Color scheme

  // The force simulation mutates links and nodes, so create a copy
  // so that re-evaluating this cell produces the same result.
  const links = data.links.map((d) => ({ ...d }));
  const nodes = data.nodes.map((d) => ({ ...d }));

  const deathExtent = d3.extent(data.nodes, (d) => d.Tuberculosis_Deaths);
  const radiusScale = d3.scaleSqrt().domain(deathExtent).range([5, 50]);

  // Create a simulation with several forces.
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d) => d.id)
    )
    .force("charge", d3.forceManyBody().strength(-15))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collide",
      d3.forceCollide((d) => radiusScale(d.Tuberculosis_Deaths) + 2)
    );

  // Add a line for each link, and a circle for each node.
  const link = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll()
    .data(links)
    .join("line")
    .attr("stroke-width", (d) => d.value)
    .on("click", nodeClicked);

  const node = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(nodes)
    .join("circle")
    .attr("r", (d) => radiusScale(d.Tuberculosis_Deaths))
    .attr("fill", (d) => color(d.region))
    .on("mouseover", function (event, d) {
      tooltip3
        .style("opacity", 1)
        .html(
          `Country: ${d.id}<br>Region: ${d.region}<br>Subregion: ${d.subregion}<br>Deaths: ${d.Tuberculosis_Deaths}`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", function () {
      tooltip3.style("opacity", 0);
    })
    .on("click", nodeClicked);

  // Add a drag behavior.
  node.call(
    d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
  );

  // Reheat the simulation when drag starts, and fix the subject position.
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    event.sourceEvent.stopPropagation(); // Stop propagation to prevent click event after drag
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    // if (d3.event.defaultPrevented) event.sourceEvent.stopPropagation(); // Prevent click event
  }

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => Math.max(20, Math.min(width - 20, d.source.x)))
      .attr("y1", (d) => Math.max(20, Math.min(height - 20, d.source.y)))
      .attr("x2", (d) => Math.max(20, Math.min(width - 20, d.target.x)))
      .attr("y2", (d) => Math.max(20, Math.min(height - 20, d.target.y)));

    node
      .attr("cx", (d) => Math.max(20, Math.min(width - 20, d.x)))
      .attr("cy", (d) => Math.max(20, Math.min(height - 20, d.y)));
  });
}

function updateChart3(year) {
  data = { nodes: [], links: [] };

  d3.json(`Force-Directed_Dataset\\force_graph_${year}.json`)
    .then((d) => {
      data.nodes = d.nodes;
      data.links = d.links;
      loadData();
      const uniqueRegions = Array.from(
        new Set(data.nodes.map((d) => d.region))
      );
      // populateDropdown(uniqueRegions);
    })
    .catch((error) => {
      console.error("Error loading the data:", error);
    });
}

// d3.select("#year").on("change", function () {
//   updateChart3(this.value);
// });

// Load initial year
updateChart3(2000);
