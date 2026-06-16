import { useRef, useEffect, useCallback } from 'react';
import type { FamilyMember } from '@/store/useFamilyStore';

interface TreeNode {
  member: FamilyMember;
  x: number;
  y: number;
  children: TreeNode[];
  spouse: TreeNode | null;
}

interface FamilyTreeCanvasProps {
  members: FamilyMember[];
  onMemberClick: (member: FamilyMember) => void;
}

const NODE_W = 160;
const NODE_H = 72;
const H_GAP = 40;
const V_GAP = 100;
const SPOUSE_GAP = 20;

const MALE_BG = '#6B4C3B';
const FEMALE_BG = '#8B5E6B';
const DECEASED_OVERLAY = 'rgba(0,0,0,0.25)';
const GOLD = '#C9A96E';
const CREAM = '#F5F0EB';
const LINE_COLOR = '#C9A96E';

function buildTree(members: FamilyMember[]): TreeNode[] {
  const memberMap = new Map<string, FamilyMember>();
  members.forEach((m) => memberMap.set(m.id, m));

  const childIds = new Set(members.filter((m) => m.relationType === 'child' && m.relatedToId).map((m) => m.id));
  const spouseOf = new Map<string, string>();
  members.forEach((m) => {
    if (m.relationType === 'spouse' && m.relatedToId) {
      spouseOf.set(m.id, m.relatedToId);
      spouseOf.set(m.relatedToId, m.id);
    }
  });

  const roots = members.filter((m) => !childIds.has(m.id) && !spouseOf.has(m.id));
  if (roots.length === 0 && members.length > 0) {
    roots.push(members[0]);
  }

  const visited = new Set<string>();
  const nodeMap = new Map<string, TreeNode>();

  function createNode(member: FamilyMember): TreeNode {
    if (nodeMap.has(member.id)) return nodeMap.get(member.id)!;
    const node: TreeNode = { member, x: 0, y: 0, children: [], spouse: null };
    nodeMap.set(member.id, node);
    return node;
  }

  function buildChildren(parentId: string, parentNode: TreeNode) {
    if (visited.has(parentId)) return;
    visited.add(parentId);

    const spouseMember = members.find(
      (m) => m.relationType === 'spouse' && m.relatedToId === parentId
    );
    if (spouseMember) {
      parentNode.spouse = createNode(spouseMember);
      visited.add(spouseMember.id);
    }

    const children = members.filter(
      (m) => m.relationType === 'child' && m.relatedToId === parentId
    );
    children.forEach((child) => {
      const childNode = createNode(child);
      parentNode.children.push(childNode);
      buildChildren(child.id, childNode);
    });
  }

  const treeRoots: TreeNode[] = [];
  roots.forEach((r) => {
    if (!visited.has(r.id)) {
      const node = createNode(r);
      treeRoots.push(node);
      buildChildren(r.id, node);
    }
  });

  members.forEach((m) => {
    if (!visited.has(m.id)) {
      const node = createNode(m);
      treeRoots.push(node);
      buildChildren(m.id, node);
    }
  });

  return treeRoots;
}

function layoutTree(roots: TreeNode[]): { nodes: TreeNode[]; width: number; height: number } {
  const allNodes: TreeNode[] = [];

  function getSubtreeWidth(node: TreeNode): number {
    const spouseWidth = node.spouse ? NODE_W + SPOUSE_GAP : 0;
    if (node.children.length === 0) return NODE_W + spouseWidth;

    let childrenWidth = 0;
    node.children.forEach((child, i) => {
      childrenWidth += getSubtreeWidth(child);
      if (i < node.children.length - 1) childrenWidth += H_GAP;
    });

    return Math.max(NODE_W + spouseWidth, childrenWidth);
  }

  function positionNode(node: TreeNode, cx: number, cy: number) {
    node.y = cy;

    if (node.spouse) {
      node.x = cx - (NODE_W + SPOUSE_GAP) / 2;
      node.spouse.x = cx + (NODE_W + SPOUSE_GAP) / 2;
      node.spouse.y = cy;
      allNodes.push(node.spouse);
    } else {
      node.x = cx - NODE_W / 2;
    }

    allNodes.push(node);

    if (node.children.length > 0) {
      const childY = cy + NODE_H + V_GAP;
      const widths = node.children.map((c) => getSubtreeWidth(c));
      const totalWidth = widths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * H_GAP;
      let startX = cx - totalWidth / 2;

      node.children.forEach((child, i) => {
        const childCx = startX + widths[i] / 2;
        positionNode(child, childCx, childY);
        startX += widths[i] + H_GAP;
      });
    }
  }

  let offsetX = 0;
  const rootWidths = roots.map((r) => getSubtreeWidth(r));
  const totalRootWidth = rootWidths.reduce((a, b) => a + b, 0) + (roots.length - 1) * H_GAP * 2;

  roots.forEach((root, i) => {
    const cx = offsetX + rootWidths[i] / 2 + 100;
    positionNode(root, cx, 80);
    offsetX += rootWidths[i] + H_GAP * 2;
  });

  let maxX = 0, maxY = 0;
  allNodes.forEach((n) => {
    maxX = Math.max(maxX, n.x + NODE_W + 100);
    maxY = Math.max(maxY, n.y + NODE_H + 100);
  });

  return { nodes: allNodes, width: Math.max(maxX, totalRootWidth + 200), height: maxY };
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function FamilyTreeCanvas({ members, onMemberClick }: FamilyTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ offsetX: 0, offsetY: 0, scale: 1 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
  const nodesRef = useRef<TreeNode[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY, scale } = transformRef.current;
    const nodes = nodesRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const drawnConnections = new Set<string>();

    nodes.forEach((node) => {
      if (node.spouse) {
        const key = [node.member.id, node.spouse.member.id].sort().join('-');
        if (!drawnConnections.has(key)) {
          drawnConnections.add(key);
          const y = node.y + NODE_H / 2;
          const x1 = node.x + NODE_W;
          const x2 = node.spouse.x;

          ctx.strokeStyle = GOLD;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x1, y + 3);
          ctx.lineTo(x2, y + 3);
          ctx.stroke();

          const heartX = (x1 + x2) / 2;
          ctx.fillStyle = GOLD;
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('♥', heartX, y - 4);
        }
      }

      if (node.children.length > 0) {
        const parentCx = node.spouse
          ? (node.x + NODE_W + node.spouse.x) / 2
          : node.x + NODE_W / 2;
        const parentBottom = node.y + NODE_H;

        node.children.forEach((child) => {
          const childCx = child.x + NODE_W / 2;
          const childTop = child.y;
          const midY = parentBottom + (childTop - parentBottom) / 2;

          ctx.strokeStyle = LINE_COLOR;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(parentCx, parentBottom);
          ctx.lineTo(parentCx, midY);
          ctx.lineTo(childCx, midY);
          ctx.lineTo(childCx, childTop);
          ctx.stroke();
        });
      }
    });

    nodes.forEach((node) => {
      const isMale = node.member.gender === 'male';
      const isDeceased = !!node.member.deathDate;
      const isHovered = hoveredRef.current === node.member.id;

      const bgColor = isMale ? MALE_BG : FEMALE_BG;

      if (isHovered) {
        ctx.save();
        ctx.shadowColor = GOLD;
        ctx.shadowBlur = 12;
        drawRoundedRect(ctx, node.x - 3, node.y - 3, NODE_W + 6, NODE_H + 6, 12);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      drawRoundedRect(ctx, node.x, node.y, NODE_W, NODE_H, 10);
      ctx.fillStyle = bgColor;
      ctx.fill();

      if (isDeceased) {
        drawRoundedRect(ctx, node.x, node.y, NODE_W, NODE_H, 10);
        ctx.fillStyle = DECEASED_OVERLAY;
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✝', node.x + NODE_W - 14, node.y + 16);
      }

      ctx.fillStyle = CREAM;
      ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.member.name, node.x + NODE_W / 2, node.y + NODE_H / 2 - 10);

      ctx.fillStyle = 'rgba(245,240,235,0.7)';
      ctx.font = '11px "Noto Sans SC", sans-serif';
      ctx.fillText(node.member.birthDate || '', node.x + NODE_W / 2, node.y + NODE_H / 2 + 12);
    });

    ctx.restore();
  }, []);

  const getNodeAt = useCallback((canvasX: number, canvasY: number): TreeNode | null => {
    const { offsetX, offsetY, scale } = transformRef.current;
    const x = (canvasX - offsetX) / scale;
    const y = (canvasY - offsetY) / scale;

    for (const node of nodesRef.current) {
      if (x >= node.x && x <= node.x + NODE_W && y >= node.y && y <= node.y + NODE_H) {
        return node;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const roots = buildTree(members);
    const { nodes, width, height } = layoutTree(roots);
    nodesRef.current = nodes;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    if (rect.width < width) {
      transformRef.current.offsetX = 20;
    } else {
      transformRef.current.offsetX = (rect.width - width * transformRef.current.scale) / 2;
    }
    transformRef.current.offsetY = 20;

    draw();
  }, [members, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const { scale, offsetX, offsetY } = transformRef.current;
      const newScale = Math.min(Math.max(scale * delta, 0.3), 3);

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      transformRef.current.scale = newScale;
      transformRef.current.offsetX = mx - (mx - offsetX) * (newScale / scale);
      transformRef.current.offsetY = my - (my - offsetY) * (newScale / scale);

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    const handleMouseDown = (e: MouseEvent) => {
      dragRef.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: transformRef.current.offsetX,
        startOffsetY: transformRef.current.offsetY,
      };
      canvas.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current.dragging) {
        transformRef.current.offsetX = dragRef.current.startOffsetX + (e.clientX - dragRef.current.startX);
        transformRef.current.offsetY = dragRef.current.startOffsetY + (e.clientY - dragRef.current.startY);
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(draw);
      } else {
        const rect = canvas.getBoundingClientRect();
        const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
        const newHovered = node?.member.id || null;
        if (newHovered !== hoveredRef.current) {
          hoveredRef.current = newHovered;
          canvas.style.cursor = node ? 'pointer' : 'grab';
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(draw);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const wasDragging = dragRef.current.dragging;
      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);

      dragRef.current.dragging = false;
      canvas.style.cursor = 'grab';

      if (wasDragging && dx < 5 && dy < 5) {
        const rect = canvas.getBoundingClientRect();
        const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
        if (node) onMemberClick(node.member);
      }
    };

    const handleMouseLeave = () => {
      dragRef.current.dragging = false;
      hoveredRef.current = null;
      canvas.style.cursor = 'grab';
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw, getNodeAt, onMemberClick]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-brown-50 rounded-xl border border-brown-100 overflow-hidden">
      <canvas ref={canvasRef} className="cursor-grab" />
      {members.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-brown-300 text-lg font-serif">
          暂无成员，请添加家族成员
        </div>
      )}
    </div>
  );
}
