const width = 1000;
const height = 800;

const svg = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

Promise.all([
  d3.json("Neighborhood_Statistical_Area_(NSA)_Boundaries.geojson"), // GeoJSON file
  d3.csv("fixedDataset.csv") // CSV file
]).then(([geoData, csvData]) => {
  // Log bounds to verify geographic extent
  const bounds = d3.geoBounds(geoData);//[[-76.711, 39.197], [-76.529, 39.372]];   //d3.geoBounds(geoData);
  console.log("GeoJSON Bounds:", bounds); // Should show valid Baltimore area bounds

  //console.log("Sample Geometry:", geoData.features[0].geometry);
  console.log("Sample Geometry Coordinates:", geoData.features[0].geometry.coordinates[0]);


  // Create a Mercator projection that fits the data
  const projection = d3.geoMercator()
    .fitExtent([[20, 20], [width - 20, height - 20]], geoData)
    .scale(150000)
    .center([-76.612, 39.290])

  console.log("Sample Projection:", projection([-76.612, 39.290])); // Baltimore coordinates

  const path = d3.geoPath().projection(projection);

  // Aggregate 911 call data
  const callCounts = d3.rollup(
    csvData,
    v => v.length,
    d => d.Neighborhood
  );
  const callCountLookup = Object.fromEntries(callCounts);

  // Define color scale based on call counts
  const maxCalls = d3.max(callCounts.values());
  const colorScale = d3.scaleSequential()
    .domain([0, maxCalls])
    .interpolator(d3.interpolateBlues); // Cant figure this out

  // Draw map
  svg.selectAll(".Neighborhood")
    .data(geoData.features)
    .join("path")
    .attr("class", "Neighborhood")
    .attr("fill", "none")
    // .attr("stroke-width", 1); // Adjust width as needed
    // .attr("fill", d => {
    //   const calls = callCountLookup[d.properties.Name] || 0;
    //   console.log(calls, colorScale(calls));
    //   return colorScale(calls);
    // })
    .attr("d", d => path(d))
    // .attr("fill", d => {
    //   const calls = callCountLookup[d.properties.Name] || 0;
    //   return colorScale(calls);
    // }) // Cant figure this out
    .attr("stroke", "black")
    .append("title")
    .text(d => `${d.properties.Name}: ${callCountLookup[d.properties.Name] || 0} calls`);

  // Debug paths
  //console.log("Sample Path:", path(geoData.features[0]));
}).catch(error => {
  console.error("Error loading data:", error);
});
