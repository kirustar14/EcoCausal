import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { GraphLink, GraphNode, NodeType } from "@/lib/mock-analyze";

type Props = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const TYPE_FILL: Record<NodeType, string> = {
  pollutant: "#FAECE7",
  gene:      "#EEEDFE",
  pathway:   "#FEF3C7",
  outcome:   "#E1F5EE",
};

const TYPE_STROKE: Record<NodeType, string> = {
  pollutant: "#D85A30",
  gene:      "#7F77DD",
  pathway:   "#BA7517",
  outcome:   "#1D9E75",
};

const TYPE_TEXT: Record<NodeType, string> = {
  pollutant: "#993C1D",
  gene:      "#3C3489",
  pathway:   "#633806",
  outcome:   "#085041",
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
    const width  = parent?.clientWidth  ?? 600;
    const height = parent?.clientHeight ?? 480;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = links.map((l) => ({ ...l }));

    const radius = (d: SimNode) =>
      d.type === "pollutant" || d.type === "outcome" ? 38 : 30;

    const sim = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(120)
          .strength(0.4),
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<SimNode>().radius((d) => radius(d) + 16));

    // Arrow marker
    const defs = svg.append("defs");
    const arrow = defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -4 10 8")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto");
    arrow
      .append("path")
      .attr("d", "M0,-3L8,0L0,3")
      .attr("fill", "var(--ink, #333)")
      .attr("opacity", 0.35);

    // Edges
    const link = svg
      .append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", "var(--ink, #333)")
      .attr("stroke-opacity", (d) => 0.15 + d.weight * 0.3)
      .attr("stroke-width", (d) => 0.8 + d.weight * 2)
      .attr("marker-end", "url(#arrow)");

    // Node groups
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

    // Circle with colored fill + stroke
    node
      .append("circle")
      .attr("r", radius)
      .attr("fill",   (d) => TYPE_FILL[d.type]   ?? "#f5f5f5")
      .attr("stroke", (d) => TYPE_STROKE[d.type] ?? "#999")
      .attr("stroke-width", 2);

    // ── THE FIX: actual label inside the circle, not the type letter ──
    node
      .append("text")
      .text((d) => {
        // Fit label inside circle — approx 4.5px per char
        const maxChars = Math.floor(radius(d) / 4.5);
        return d.label.length > maxChars
          ? d.label.slice(0, maxChars - 1) + "…"
          : d.label;
      })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("font-size", (d) => (radius(d) > 34 ? 11 : 9))
      .attr("font-weight", 600)
      .attr("fill", (d) => TYPE_TEXT[d.type] ?? "#333")
      .style("paint-order", "stroke")
      .style("stroke", (d) => TYPE_FILL[d.type] ?? "#fff")
      .style("stroke-width", "3px")
      .style("pointer-events", "none");

    // Tooltip with full label
    node.append("title").text((d) => `${d.type}: ${d.label}`);

    sim.on("tick", () => {
      // Shorten edges so arrowhead stops at circle edge
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => {
          const s = d.source as SimNode;
          const t = d.target as SimNode;
          const dx = (t.x ?? 0) - (s.x ?? 0);
          const dy = (t.y ?? 0) - (s.y ?? 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return (t.x ?? 0) - (dx / dist) * (radius(t) + 4);
        })
        .attr("y2", (d) => {
          const s = d.source as SimNode;
          const t = d.target as SimNode;
          const dx = (t.x ?? 0) - (s.x ?? 0);
          const dy = (t.y ?? 0) - (s.y ?? 0);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return (t.y ?? 0) - (dy / dist) * (radius(t) + 4);
        });

      node.attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    return () => {
      sim.stop();
    };
  }, [nodes, links]);

  return <svg ref={ref} className="h-full w-full" />;
}