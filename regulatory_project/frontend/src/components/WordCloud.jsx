import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";

export default function WordCloud({ data, width = 400, height = 300 }) {
  const svgRef = useRef();

  useEffect(() => {
    const layout = cloud()
      .size([width, height])
      .words(data.map(d => ({ text: d.text, size: d.value })))
      .padding(5)
      .rotate(() => 0)
      .fontSize(d => Math.sqrt(d.size))
      .on("end", draw);

    layout.start();

    function draw(words) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`)
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", d => d.size + "px")
        .style("fill", () => `hsl(${Math.random() * 360}, 70%, 50%)`)
        .attr("text-anchor", "middle")
        .attr("transform", d => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
        .text(d => d.text);
    }
  }, [data, width, height]);

  return <svg ref={svgRef}></svg>;
}
