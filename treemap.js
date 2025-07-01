const tooltip2 = d3.select("#tooltip2");

let counter = 0;
function generateUniqueId(prefix = "leaf") {
  return `${prefix}-${counter++}`;
}

function mouseOver(event, d) {
  tooltip2
    .style("opacity", 1)
    .html(() => {
      const ancestors = d.ancestors().reverse();
      if (d.depth === 1) {
        // Region
        return `Region: ${d.data.name}<br>Total Deaths: ${d.value}`;
      } else if (d.depth === 2) {
        // Subregion
        return `Subregion: ${d.data.name}<br>Total Deaths: ${d.value}`;
      } else if (d.depth === 3) {
        // Country
        return `Country: ${d.data.name}<br>Deaths: ${d.value}`;
      }
    })
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY + 10 + "px");
}

function mouseOut() {
  tooltip2.style("opacity", 0);
}

function createTreemap(data) {
  // Specify the chart’s dimensions.
  const container = d3.select("#treemap-chart");
  const width = container.node().clientWidth;  
  const height = width * 0.9;

  const existingSvg = container.select("svg");
  if (!existingSvg.empty()) {
    existingSvg.remove();
  }

  // This custom tiling function adapts the built-in binary tiling function
  // for the appropriate aspect ratio when the treemap is zoomed-in.
  function tile(node, x0, y0, x1, y1) {
    d3.treemapBinary(node, 0, 0, width, height);
    for (const child of node.children) {
      child.x0 = x0 + (child.x0 / width) * (x1 - x0);
      child.x1 = x0 + (child.x1 / width) * (x1 - x0);
      child.y0 = y0 + (child.y0 / height) * (y1 - y0);
      child.y1 = y0 + (child.y1 / height) * (y1 - y0);
    }
  }

  // Compute the layout.
  const hierarchy = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);
  const root = d3.treemap().tile(tile)(hierarchy);

  // Create the scales.
  const x = d3.scaleLinear().rangeRound([0, width]);
  const y = d3.scaleLinear().rangeRound([0, height]);

  // Formatting utilities.
  const format = d3.format(",d");
  const name = (d) =>
    d
      .ancestors()
      .reverse()
      .map((d) => d.data.name)
      .join("/");

  // Create the SVG container.
  const svg = container
    .append("svg")
    .attr("viewBox", [0.5, -40.5, width, height + 30])
    .attr("width", width + 30)
    .attr("height", height + 30)
    .attr("style", "max-width: 100%; height: auto;")
    .style("font", "10px sans-serif");

  // Add zoom and pan behavior
  const zoom = d3
    .zoom()
    .scaleExtent([1, 8]) 
    .translateExtent([[0, 0], [width, height - 20]])
    .on("zoom", (event) => {
      // Apply zoom and pan transform to the entire group
      group.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Display the root.
  let group = svg.append("g").call(render, root);

  function render(group, root) {
    const node = group
      .selectAll("g")
      .data(root.children.concat(root))
      .join("g");

    node
      .filter((d) => (d === root ? d.parent : d.children))
      .attr("cursor", "pointer")
      .on("click", (event, d) => (d === root ? zoomout(root) : zoomin(d)));

    node.on("mouseover", mouseOver).on("mouseout", mouseOut);

    function shuffleArray(array) {
      return array.sort(() => Math.random() - 0.5);
    }

    // Create a random color scale
    const shuffledColors = shuffleArray(d3.schemeCategory10); // Shuffle the color scheme
    const ColorScale = d3.scaleOrdinal(shuffledColors);

    node
      .append("rect")
      .attr("id", (d) => (d.leafUid = generateUniqueId("leaf")).id)
      .attr("fill", (d) => {
        if (d === root) return "#ffff";
        else return ColorScale(d.data.name);
      })
      .attr("stroke", "#fff");

    node
      .append("clipPath")
      .attr("id", (d) => (d.clipUid = generateUniqueId("clip")).id)
      .append("use")
      .attr("xlink:href", (d) => d.leafUid.href);

    node
      .append("text")
      .attr("clip-path", (d) => d.clipUid)
      .attr("font-weight", (d) => (d === root ? "bold" : null))
      .selectAll("tspan")
      .data((d) => {
        // Show the name of the node and its value
        return d === root
          ? [] // Do not show root label inside its rectangle
          : [d.data.name, format(d.value)];
      })
      .join("tspan")
      .attr("x", 3)
      .attr("font-size", "6px")
      .attr(
        "y",
        (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
      )
      .attr("fill-opacity", (d, i, nodes) =>
        i === nodes.length - 1 ? 0.7 : null
      )
      .attr("font-weight", (d, i, nodes) =>
        i === nodes.length - 1 ? "normal" : null
      )
      .text((d) => d);

    node
      .filter((d) => d === root) // Only apply to the root node
      .append("text")
      .attr("x", 3) // Positioning the root label
      .attr("y", 20) // Adjust y-position for the root label
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(function (d) {
        // Show the full hierarchy and the total deaths
        return `${name(d)}: ${format(d.value)}`;
      });

    group.call(position, root);
  }

  function position(group, root) {
    group
      .selectAll("g")
      .attr("transform", (d) =>
        d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`
      )
      .select("rect")
      .attr("width", (d) => (d === root ? width : x(d.x1) - x(d.x0)))
      .attr("height", (d) => (d === root ? 30 : y(d.y1) - y(d.y0)));
  }

  // When zooming in, draw the new nodes on top, and fade them in.
  function zoomin(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = (group = svg.append("g").call(render, d));

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    svg
      .transition()
      .duration(750)
      .call((t) => group0.transition(t).remove().call(position, d.parent))
      .call((t) =>
        group1
          .transition(t)
          .attrTween("opacity", () => d3.interpolate(0, 1))
          .call(position, d)
      );
  }

  // When zooming out, draw the old nodes on top, and fade them out.
  function zoomout(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = (group = svg.insert("g", "*").call(render, d.parent));

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    svg
      .transition()
      .duration(750)
      .call((t) =>
        group0
          .transition(t)
          .remove()
          .attrTween("opacity", () => d3.interpolate(1, 0))
          .call(position, d)
      )
      .call((t) => group1.transition(t).call(position, d.parent));
  }
}

function updateChart2(year) {
  d3.json(`Sunburst_Treemap_Dataset\\${year}_data.json`).then(createTreemap);
}

d3.select("#year").on("change", function () {
  updateChart2(this.value);
});

// Load initial year
updateChart2(2000);
