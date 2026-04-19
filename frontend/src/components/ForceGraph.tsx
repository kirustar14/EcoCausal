import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { GraphLink, GraphNode, NodeType } from "@/lib/mock-analyze";

type Props = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const TYPE_COLOR: Record<NodeType, string> = {
  pollutant: "var(--ink)",
  gene: "color-mix(in oklab, var(--ink) 55%, var(--paper))",
  pathway: "color-mix(in oklab, var(--ink) 28%, var(--paper))",
  outcome: "var(--paper)",
};

const TYPE_TEXT: Record<NodeType, string> = {
  pollutant: "var(--paper)",
  gene: "var(--paper)",
  pathway: "var(--ink)",
  outcome: "var(--ink)",
};

type SimNode = GraphNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { weight: number };

export function ForceGraph({ nodes, links }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const parent = ref.current.parentElement;
    const width = parent?.clientWidth ?? 600;
    const height = parent?.clientHeight ?? 480;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = links.map((l) => ({ ...l }));

    const sim = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((l) => 110 - l.weight * 30)
          .strength((l) => 0.3 + l.weight * 0.4),
      )
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<SimNode>().radius((d) => 26 + (d.weight ?? 0.5) * 14));

    const defs = svg.append("defs");
    const arrow = defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto");
    arrow.append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", "var(--ink)").attr("opacity", 0.4);

    const link = svg
      .append("g")
      .attr("stroke", "var(--ink)")
      .attr("stroke-opacity", 0.25)
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke-width", (d) => 1 + d.weight * 1.5)
      .attr("marker-end", "url(#arrow)");

    const node = svg
      .append("g")
      .selectAll<SVGGElement, SimNode>("g")
      .data(simNodes)
      .join("g")
      .style("cursor", "grab")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    node
      .append("circle")
      .attr("r", (d) => 18 + (d.weight ?? 0.5) * 10)
      .attr("fill", (d) => TYPE_COLOR[d.type])
      .attr("stroke", "var(--ink)")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);

    node
      .append("text")
      .text((d) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => 18 + (d.weight ?? 0.5) * 10 + 16)
      .attr("font-family", "var(--font-mono)")
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("fill", "var(--ink)")
      .style("paint-order", "stroke")
      .style("stroke", "var(--paper)")
      .style("stroke-width", "3px");

    node
      .append("text")
      .text((d) => d.type[0].toUpperCase())
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-family", "var(--font-mono)")
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .attr("fill", (d) => TYPE_TEXT[d.type]);

    node.append("title").text((d) => `${d.type}: ${d.label}`);

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);

      node.attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    return () => {
      sim.stop();
    };
  }, [nodes, links]);

  return <svg ref={ref} className="h-full w-full" />;
}
