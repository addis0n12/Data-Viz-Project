const width = 700;
const height = 550;

const svg = d3.select("#map")
  .attr("width", width)
  .attr("height", height);

Promise.all([
  d3.json("Neighborhood_Statistical_Area_(NSA)_Boundaries.geojson"), // GeoJSON file
  d3.json("data/heatmapData.json") // Data file
]).then(([geoData, data]) => {
  // Create a Mercator projection that fits the data
  const projection = d3.geoIdentity()
    .reflectY(true)
    .fitExtent([[20, 20], [width - 20, height - 20]], geoData)

  const path = d3.geoPath().projection(projection);

  // Aggregate 911 call data
  const callCounts = new Map(data);
  // const callCounts = d3.rollup(
  //   data,
  //   v => v.length,
  //   d => d.Neighborhood
  // );
  const callCountLookup = Object.fromEntries(callCounts);

  // Define color scale based on call counts
  const maxCalls = d3.max(callCounts.values());
  const colorScale = d3.scaleSequential()
    .domain([0, maxCalls])
    .interpolator(d3.interpolateBlues);

  //Draw map
  svg.append("g")
    .selectAll(".Neighborhood")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("class", "Neighborhood")
    .attr("d", d => path(d))
    .attr("fill", d => {
      const calls = callCountLookup[d.properties.Name] || 0;
      return colorScale(calls);
    })
    .attr("stroke", "black")
    .append("title")
    .text(d => `${d.properties.Name}: ${callCountLookup[d.properties.Name] || 0} calls`);

  //Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 75}, ${height - 225})`);

  const legendScale = d3.scaleLinear()
    .domain([0, d3.max([...callCounts.values()])])
    .range([0, 100]);

  const legendAxis = d3.axisRight(legendScale).ticks(5);
  
  legend.selectAll("rect")
    .data(d3.range(0, 1, 0.1))
    .enter().append("rect")
    .attr("y", (d, i) => i * 10)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => colorScale(d * d3.max([...callCounts.values()])));

  legend.append("g")
    .attr("transform", "translate(10, 0)")
    .call(legendAxis);
}).catch(error => {
  console.error("Error loading data:", error);
});
