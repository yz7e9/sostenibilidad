"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import type { Variables } from "@/data/variables";
import type { SimState } from "@/lib/useEcoSimulation";
import { isPickupDay } from "@/lib/useEcoSimulation";

interface House {
  id: string;
  blockX: number;
  blockZ: number;
  side: string;
  buildingMesh: THREE.Mesh;
  buildingHeight: number;
  roadPos: { x: number; z: number };
  hasTrash: boolean;
  trashMesh: THREE.Group | null;
  assignedTo: string | null;
}

interface Intersection {
  id: string;
  x: number;
  z: number;
  neighbors: Intersection[];
}

interface Vehicle {
  mesh: THREE.Group;
  state: string;
  path: { x: number; z: number }[] | null;
  pathIdx: number;
  target: House | null;
  stopsQueue: House[];   // paradas adicionales planificadas
  routeColor: number;    // color asignado en modo optimizado
  collectTimer: number;
  hasTrash: boolean;
  homePos: { x: number; z: number };
  lastSmoke: number;
}

const STREETS = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5];
const BLOCK_CENTERS = [-6, -3, 0, 3, 6];
const SHOP_BLOCK = { x: 0, z: 0 };
const ROAD_HALF = 0.5;
const BLOCK_HALF = 1.25;

const ROUTE_COLORS = [
  0x0099ff, // azul brillante
  0xff3322, // rojo vivo
  0x00cc55, // verde esmeralda
  0xffaa00, // ámbar dorado
  0xcc44ff, // violeta
  0xff0077, // rosa fuerte
  0x00ddee, // cyan
  0xff6600, // naranja
];

function vehicleColors(vehiculo: string) {
  if (vehiculo === "diesel") return { body: 0x3a3a3a, cab: 0x4a4a4a };
  if (vehiculo === "hibrido") return { body: 0x5a7a8a, cab: 0x6a8a9a };
  return { body: 0x2a7fb8, cab: 0x3a9acc };
}

function createVehicleMesh(vehiculo: string) {
  const c = vehicleColors(vehiculo);
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.4, 0.5),
    new THREE.MeshLambertMaterial({ color: c.body }),
  );
  body.position.set(-0.05, 0.32, 0);
  body.userData.role = "body";
  g.add(body);
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.34, 0.46),
    new THREE.MeshLambertMaterial({ color: c.cab }),
  );
  cab.position.set(0.42, 0.36, 0);
  cab.userData.role = "cab";
  g.add(cab);
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.18, 0.3),
    new THREE.MeshLambertMaterial({ color: 0xb8dce8 }),
  );
  win.position.set(0.63, 0.4, 0);
  g.add(win);
  const wm = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const wg = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10);
  for (const [wx, wz] of [[-0.3, 0.25], [0.42, 0.25], [-0.3, -0.25], [0.42, -0.25]]) {
    const w = new THREE.Mesh(wg, wm);
    w.rotation.x = Math.PI / 2;
    w.position.set(wx, 0.1, wz);
    g.add(w);
  }
  const trashInd = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.18),
    new THREE.MeshLambertMaterial({ color: 0xd97757 }),
  );
  trashInd.position.set(-0.25, 0.6, 0);
  trashInd.visible = false;
  trashInd.userData.role = "trash";
  g.add(trashInd);
  return g;
}

interface Props {
  variables: Variables;
  sim: SimState;
  onPickup: (count: number) => void;
  onWebglStatus?: (ok: boolean) => void;
  debug?: boolean;
}

export default function EcoScene({ variables, sim, onPickup, onWebglStatus, debug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const camRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const housesRef = useRef<House[]>([]);
  const intersectionsRef = useRef<Intersection[]>([]);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const workerMeshesRef = useRef<THREE.Group[]>([]);
  const smokeParticlesRef = useRef<THREE.Mesh[]>([]);
  const routeGroupsRef = useRef<Map<number, THREE.Group>>(new Map());
  const variablesRef = useRef(variables);
  variablesRef.current = variables;
  const [webglOk, setWebglOk] = useState(true);
  const lastDayRef = useRef(0);
  const animTimeRef = useRef(0);
  const lastTimeRef = useRef(0);

  const camera = useRef({ azimuth: Math.PI / 4, elevation: Math.PI / 4, d: 9 });

  const updateCamera = useCallback(() => {
    const cam = camRef.current;
    const c = camera.current;
    if (!cam) return;
    const R = 22;
    const x = R * Math.cos(c.elevation) * Math.cos(c.azimuth);
    const y = R * Math.sin(c.elevation);
    const z = R * Math.cos(c.elevation) * Math.sin(c.azimuth);
    cam.position.set(x, y, z);
    cam.lookAt(0, 0, 0);
    const canvas = canvasRef.current;
    if (canvas && canvas.clientWidth && canvas.clientHeight) {
      const ratio = canvas.clientWidth / canvas.clientHeight;
      cam.left = -c.d * ratio;
      cam.right = c.d * ratio;
      cam.top = c.d;
      cam.bottom = -c.d;
      cam.updateProjectionMatrix();
    }
  }, [canvasRef]);

  // ---- A* PATHFINDING ----
  const nearestIntersection = useCallback((x: number, z: number) => {
    const intersections = intersectionsRef.current;
    let best: Intersection | null = null, bestD = Infinity;
    for (const n of intersections) {
      const d = Math.abs(n.x - x) + Math.abs(n.z - z);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  }, []);

  function astar(start: Intersection | null, goal: Intersection | null) {
    if (!start || !goal) return null;
    if (start.id === goal.id) return [start];
    const open = [start];
    const cameFrom = new Map<string, Intersection>();
    const g = new Map<string, number>([[start.id, 0]]);
    const h = (n: Intersection) => Math.abs(n.x - goal.x) + Math.abs(n.z - goal.z);
    const f = new Map<string, number>([[start.id, h(start)]]);

    while (open.length) {
      let bestI = 0;
      for (let i = 1; i < open.length; i++) {
        if ((f.get(open[i].id) ?? Infinity) < (f.get(open[bestI].id) ?? Infinity)) bestI = i;
      }
      const current = open.splice(bestI, 1)[0];
      if (current.id === goal.id) {
        const path = [current];
        let c: Intersection | undefined = current;
        while (c && cameFrom.has(c.id)) { c = cameFrom.get(c.id); if (c) path.unshift(c); }
        return path;
      }
      for (const nb of current.neighbors) {
        const cost = Math.abs(current.x - nb.x) + Math.abs(current.z - nb.z);
        const tentative = (g.get(current.id) ?? Infinity) + cost;
        if (tentative < (g.get(nb.id) ?? Infinity)) {
          cameFrom.set(nb.id, current);
          g.set(nb.id, tentative);
          f.set(nb.id, tentative + h(nb));
          if (!open.find((o) => o.id === nb.id)) open.push(nb);
        }
      }
    }
    return null;
  }

  // Calcula el path A* de un punto a una casa
  function pathToHouse(fromX: number, fromZ: number, house: House) {
    const start = nearestIntersection(fromX, fromZ);
    const goal = nearestIntersection(house.roadPos.x, house.roadPos.z);
    const intPath = astar(start, goal);
    if (!intPath) return null;
    return [
      ...intPath.map((n) => ({ x: n.x, z: n.z })),
      { x: house.roadPos.x, z: house.roadPos.z },
    ];
  }

  // ---- BUILD SCENE ----
  const buildScene = useCallback(() => {
    const scene = sceneRef.current!;
    housesRef.current = [];
    intersectionsRef.current = [];
    vehiclesRef.current = [];
    workerMeshesRef.current = [];
    smokeParticlesRef.current = [];

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 22),
      new THREE.MeshLambertMaterial({ color: 0x5db840 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const STREET_LEN = 17;
    const streetMat = new THREE.MeshLambertMaterial({ color: 0x484850 });
    for (const s of STREETS) {
      const hStreet = new THREE.Mesh(new THREE.PlaneGeometry(STREET_LEN, ROAD_HALF * 2), streetMat);
      hStreet.rotation.x = -Math.PI / 2;
      hStreet.position.set(0, 0.01, s);
      scene.add(hStreet);
      const vStreet = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, STREET_LEN), streetMat);
      vStreet.rotation.x = -Math.PI / 2;
      vStreet.position.set(s, 0.01, 0);
      scene.add(vStreet);
    }

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf5e060 });
    const LIM = STREET_LEN / 2 - 0.4;
    for (const s of STREETS) {
      for (let i = -LIM; i < LIM; i += 0.8) {
        const dh = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.04), lineMat);
        dh.rotation.x = -Math.PI / 2;
        dh.position.set(i + 0.4, 0.02, s);
        scene.add(dh);
        const dv = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.3), lineMat);
        dv.rotation.x = -Math.PI / 2;
        dv.position.set(s, 0.02, i + 0.4);
        scene.add(dv);
      }
    }

    let nid = 0;
    const map = new Map<string, Intersection>();

    // Paso 1: nodos en todas las intersecciones de calles
    for (const sx of STREETS) {
      for (const sz of STREETS) {
        const node: Intersection = { id: `n${nid++}`, x: sx, z: sz, neighbors: [] };
        intersectionsRef.current.push(node);
        map.set(`${sx}_${sz}`, node);
      }
    }

    // Paso 2: nodos intermedios en la calle justo delante de cada bloque.
    // Esto evita que el último segmento del path corte en diagonal por edificios.
    // Para cada bloque (bx, bz), hay 4 puntos de acceso: uno en cada calle adyacente.
    //   Norte/Sur: (bx, bz±1.5) sobre la calle horizontal
    //   Este/Oeste: (bx±1.5, bz) sobre la calle vertical
    for (const bx of BLOCK_CENTERS) {
      for (const bz of BLOCK_CENTERS) {
        for (const [nx, nz] of [
          [bx, bz - 1.5], [bx, bz + 1.5],   // calles horizontales N y S
          [bx - 1.5, bz], [bx + 1.5, bz],   // calles verticales W y E
        ]) {
          const key = `${nx}_${nz}`;
          if (!map.has(key)) {
            const node: Intersection = { id: `a${nid++}`, x: nx, z: nz, neighbors: [] };
            intersectionsRef.current.push(node);
            map.set(key, node);
          }
        }
      }
    }

    // Paso 3: conectar todos los nodos de cada calle ordenándolos por posición.
    // Así los nodos intermedios quedan encadenados correctamente entre intersecciones.
    for (const sz of STREETS) {
      const row = intersectionsRef.current
        .filter((n) => Math.abs(n.z - sz) < 0.001)
        .sort((a, b) => a.x - b.x);
      for (let i = 0; i < row.length - 1; i++) {
        row[i].neighbors.push(row[i + 1]);
        row[i + 1].neighbors.push(row[i]);
      }
    }
    for (const sx of STREETS) {
      const col = intersectionsRef.current
        .filter((n) => Math.abs(n.x - sx) < 0.001)
        .sort((a, b) => a.z - b.z);
      for (let i = 0; i < col.length - 1; i++) {
        col[i].neighbors.push(col[i + 1]);
        col[i + 1].neighbors.push(col[i]);
      }
    }

    let rng = 137;
    function rnd() { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; }

    function buildResidentialBlock(cx: number, cz: number) {
      const stripLen = BLOCK_HALF * 2 - 0.4;
      const stripDepth = 0.7;
      const sides = [
        { name: "N", x: cx, z: cz - BLOCK_HALF + stripDepth / 2, w: stripLen, d: stripDepth, roadX: cx, roadZ: cz - BLOCK_HALF - ROAD_HALF },
        { name: "S", x: cx, z: cz + BLOCK_HALF - stripDepth / 2, w: stripLen, d: stripDepth, roadX: cx, roadZ: cz + BLOCK_HALF + ROAD_HALF },
        { name: "E", x: cx + BLOCK_HALF - stripDepth / 2, z: cz, w: stripDepth, d: stripLen, roadX: cx + BLOCK_HALF + ROAD_HALF, roadZ: cz },
        { name: "W", x: cx - BLOCK_HALF + stripDepth / 2, z: cz, w: stripDepth, d: stripLen, roadX: cx - BLOCK_HALF - ROAD_HALF, roadZ: cz },
      ];
      const palette = [
        0xf5c060, 0xe87850, 0x70c890, 0x60a8d8,
        0xf09060, 0xd4a030, 0x80c060, 0xe07080,
      ];

      for (const side of sides) {
        const h = 0.9 + rnd() * 1.8;
        const color = palette[Math.floor(rnd() * palette.length)];
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(side.w, h, side.d),
          new THREE.MeshLambertMaterial({ color }),
        );
        building.position.set(side.x, h / 2, side.z);
        scene.add(building);

        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(side.w + 0.06, 0.06, side.d + 0.06),
          new THREE.MeshLambertMaterial({ color: 0x9e6840 }),
        );
        roof.position.set(side.x, h + 0.03, side.z);
        scene.add(roof);

        const winMat = new THREE.MeshLambertMaterial({ color: 0xc4e8f0 });
        const isHor = side.w > side.d;
        const winCount = Math.floor((isHor ? side.w : side.d) * 2);
        for (let i = 0; i < winCount; i++) {
          const t = (i + 0.5) / winCount - 0.5;
          const wx = isHor ? side.x + t * side.w : side.x + (side.x > cx ? 0.36 : -0.36);
          const wz = isHor ? side.z + (side.z > cz ? 0.36 : -0.36) : side.z + t * side.d;
          for (let row = 0; row < Math.max(1, Math.floor(h / 0.6)); row++) {
            const w = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.04), winMat);
            if (!isHor) w.geometry = new THREE.BoxGeometry(0.04, 0.18, 0.12);
            w.position.set(wx, 0.4 + row * 0.55, wz);
            if (w.position.y > h - 0.2) continue;
            scene.add(w);
          }
        }

        housesRef.current.push({
          id: `${cx}_${cz}_${side.name}`,
          blockX: cx, blockZ: cz, side: side.name,
          buildingMesh: building, buildingHeight: h,
          roadPos: { x: side.roadX, z: side.roadZ },
          hasTrash: false, trashMesh: null, assignedTo: null,
        });
      }

      const patio = new THREE.Mesh(
        new THREE.PlaneGeometry(BLOCK_HALF * 2 - stripDepth * 2 - 0.1, BLOCK_HALF * 2 - stripDepth * 2 - 0.1),
        new THREE.MeshLambertMaterial({ color: 0x48b838 }),
      );
      patio.rotation.x = -Math.PI / 2;
      patio.position.set(cx, 0.03, cz);
      scene.add(patio);

      if (rnd() < 0.7) {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.05, 0.25, 6),
          new THREE.MeshLambertMaterial({ color: 0x7a5530 }),
        );
        trunk.position.set(cx, 0.12, cz);
        scene.add(trunk);
        const lc = [0x38b848, 0x4acd5a, 0x28a038][Math.floor(rnd() * 3)];
        const leaves = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 8, 6),
          new THREE.MeshLambertMaterial({ color: lc }),
        );
        leaves.position.set(cx, 0.4, cz);
        scene.add(leaves);
      }
    }

    function buildShopBlock(cx: number, cz: number) {
      const shop = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(BLOCK_HALF * 2 - 0.2, 1.3, BLOCK_HALF * 2 - 0.2),
        new THREE.MeshLambertMaterial({ color: 0x2d7a4f }),
      );
      base.position.y = 0.65;
      shop.add(base);
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(BLOCK_HALF * 2 - 0.1, 0.12, BLOCK_HALF * 2 - 0.1),
        new THREE.MeshLambertMaterial({ color: 0x1f5a3a }),
      );
      roof.position.y = 1.36;
      shop.add(roof);
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.28, 0.06),
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
      );
      sign.position.set(0, 1.05, BLOCK_HALF - 0.05);
      shop.add(sign);
      const winMat = new THREE.MeshLambertMaterial({ color: 0xc4dde2 });
      for (let i = -1; i <= 1; i++) {
        for (const [px, pz, sx, sz] of [[i * 0.7, BLOCK_HALF - 0.05, 0.4, 0.04], [i * 0.7, -(BLOCK_HALF - 0.05), 0.4, 0.04]]) {
          const ww = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.4, sz), winMat);
          ww.position.set(px, 0.55, pz);
          shop.add(ww);
        }
        for (const [px, pz] of [[-(BLOCK_HALF - 0.05), i * 0.7], [BLOCK_HALF - 0.05, i * 0.7]]) {
          const ws = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.4), winMat);
          ws.position.set(px, 0.55, pz);
          shop.add(ws);
        }
      }
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.7, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x3a2a1a }),
      );
      door.position.set(0, 0.35, BLOCK_HALF - 0.03);
      shop.add(door);
      shop.position.set(cx, 0, cz);
      scene.add(shop);
      buildWorkers(cx, cz, 1.45, variables);
    }

    for (const bx of BLOCK_CENTERS) {
      for (const bz of BLOCK_CENTERS) {
        if (bx === SHOP_BLOCK.x && bz === SHOP_BLOCK.z) buildShopBlock(bx, bz);
        else buildResidentialBlock(bx, bz);
      }
    }

    let rng2 = 137;
    function rnd2() { rng2 = (rng2 * 9301 + 49297) % 233280; return rng2 / 233280; }
    for (const node of intersectionsRef.current) {
      const ix = STREETS.indexOf(node.x);
      const iz = STREETS.indexOf(node.z);
      if (ix === 0 || ix === STREETS.length - 1 || iz === 0 || iz === STREETS.length - 1) continue;
      if (Math.abs(node.x) < 2 && Math.abs(node.z) < 2) continue;
      if (rnd2() < 0.6) {
        const corner = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.5 + rnd2() * 0.6, 0.4),
          new THREE.MeshLambertMaterial({ color: 0xd4c890 }),
        );
        const offX = (rnd2() < 0.5 ? -1 : 1) * 1.0;
        const offZ = (rnd2() < 0.5 ? -1 : 1) * 1.0;
        corner.position.set(node.x + offX, corner.geometry.parameters.height / 2, node.z + offZ);
        scene.add(corner);
      }
    }

    spawnVehicles(variables);
  }, [variables]);

  function spawnVehicles(v: Variables) {
    const scene = sceneRef.current;
    if (!scene) return;
    for (const ve of vehiclesRef.current) { if (ve.mesh) scene.remove(ve.mesh); }
    vehiclesRef.current = [];
    clearAllRouteGroups();

    const parkSlots: { x: number; z: number }[] = [];
    const offsets = [0, 0.8, -0.8, 1.6, -1.6];
    const sideTemplates = [
      (off: number) => ({ x: off, z: BLOCK_HALF + ROAD_HALF }),
      (off: number) => ({ x: BLOCK_HALF + ROAD_HALF, z: off }),
      (off: number) => ({ x: off, z: -BLOCK_HALF - ROAD_HALF }),
      (off: number) => ({ x: -BLOCK_HALF - ROAD_HALF, z: off }),
    ];
    for (let i = 0; i < v.numVehicles + 5; i++) {
      parkSlots.push(sideTemplates[i % 4](offsets[Math.floor(i / 4)] || 0));
    }

    for (let i = 0; i < v.numVehicles; i++) {
      const mesh = createVehicleMesh(v.tipoVehiculo);
      const slot = parkSlots[i % parkSlots.length];
      mesh.position.set(slot.x, 0, slot.z);
      scene.add(mesh);
      vehiclesRef.current.push({
        mesh, state: "idle",
        path: null, pathIdx: 0,
        target: null, stopsQueue: [], routeColor: 0,
        collectTimer: 0, hasTrash: false,
        homePos: { x: slot.x, z: slot.z },
        lastSmoke: 0,
      });
    }
    for (const h of housesRef.current) h.assignedTo = null;
  }

  function buildWorkers(cx: number, cz: number, baseY: number, v: Variables) {
    const scene = sceneRef.current;
    if (!scene) return;
    for (const w of workerMeshesRef.current) scene.remove(w);
    workerMeshesRef.current = [];
    for (let i = 0; i < v.numTrabajadores; i++) {
      const ang = (i / Math.max(v.numTrabajadores, 1)) * Math.PI * 2;
      const r = v.numTrabajadores > 4 ? 0.85 : 0.55;
      const g = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.22, 8),
        new THREE.MeshLambertMaterial({ color: 0xf5f0e8 }),
      );
      body.position.y = 0.11;
      g.add(body);
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        new THREE.MeshLambertMaterial({ color: 0xe8c4a0 }),
      );
      head.position.y = 0.3;
      g.add(head);
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.085, 0.04, 8),
        new THREE.MeshLambertMaterial({ color: 0x2d7a4f }),
      );
      cap.position.y = 0.37;
      g.add(cap);
      g.position.set(cx + Math.cos(ang) * r, baseY, cz + Math.sin(ang) * r * 0.85);
      g.userData = { bob: Math.random() * Math.PI * 2 };
      scene.add(g);
      workerMeshesRef.current.push(g);
    }
  }

  // ---- TRASH SYSTEM ----
  const trashHousesAvailable = useCallback(() =>
    housesRef.current.filter((h) => h.hasTrash && h.assignedTo === null), []);

  const spawnTrashAt = useCallback((house: House) => {
    if (house.hasTrash) return;
    house.hasTrash = true;
    const bx = house.buildingMesh.position.x;
    const bz = house.buildingMesh.position.z;
    const bh = house.buildingHeight;
    const markerY = bh + 1.2;
    const group = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6),
      new THREE.MeshBasicMaterial({ color: 0xd97757 }),
    );
    pole.position.set(bx, bh + 0.55, bz);
    group.add(pole);
    const diamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshLambertMaterial({ color: 0xd97757, emissive: 0x7a2c1a, emissiveIntensity: 0.35 }),
    );
    diamond.position.set(bx, markerY, bz);
    group.add(diamond);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.32, 16),
      new THREE.MeshBasicMaterial({ color: 0xd97757, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(bx, markerY - 0.05, bz);
    group.add(ring);
    group.userData = { spin: Math.random() * Math.PI, baseY: markerY, diamond, ring };
    sceneRef.current?.add(group);
    house.trashMesh = group;
  }, []);

  const pickupTrashAt = useCallback((house: House) => {
    if (!house.hasTrash) return false;
    if (house.trashMesh) {
      house.trashMesh.traverse((o) => {
        const obj = o as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      sceneRef.current?.remove(house.trashMesh);
      house.trashMesh = null;
    }
    house.hasTrash = false;
    house.assignedTo = null;
    return true;
  }, []);

  const onNewDayInternal = useCallback(() => {
    const empty = housesRef.current.filter((h) => !h.hasTrash);
    const toSpawn = Math.min(4, empty.length);
    for (let i = 0; i < toSpawn; i++) {
      const idx = Math.floor(Math.random() * empty.length);
      spawnTrashAt(empty[idx]);
      empty.splice(idx, 1);
    }
    if (isPickupDay(sim.day, variables.frecuenciaSemanal)) {
      dispatchVehicles();
    }
  }, [spawnTrashAt, sim.day, variables.frecuenciaSemanal]);

  // Modo normal: asigna la casa más cercana sin plan previo
  function assignNextTrash(v: Vehicle) {
    const available = trashHousesAvailable();
    if (available.length === 0) return false;
    let best: House | null = null, bestD = Infinity;
    for (const h of available) {
      const d = Math.abs(h.roadPos.x - v.mesh.position.x) + Math.abs(h.roadPos.z - v.mesh.position.z);
      if (d < bestD) { bestD = d; best = h; }
    }
    if (!best) return false;
    const p = pathToHouse(v.mesh.position.x, v.mesh.position.z, best);
    if (!p) return false;
    v.path = p;
    v.pathIdx = 0;
    v.target = best;
    v.state = "moving";
    best.assignedTo = String(v.mesh.id);
    return true;
  }

  // ---- VISUALIZACIÓN DE RUTAS ----

  // Calcula el camino completo por calles encadenando A* entre paradas consecutivas
  function fullRoutePath(
    startX: number,
    startZ: number,
    stops: House[],
  ): { x: number; z: number }[] {
    const pts: { x: number; z: number }[] = [];
    let cx = startX, cz = startZ;
    for (const stop of stops) {
      const start = nearestIntersection(cx, cz);
      const goal = nearestIntersection(stop.roadPos.x, stop.roadPos.z);
      const intPath = astar(start, goal);
      if (intPath) {
        const seg = intPath.map((n) => ({ x: n.x, z: n.z }));
        // evitar duplicar el punto de unión entre segmentos
        if (pts.length === 0) pts.push(...seg);
        else pts.push(...seg.slice(1));
      }
      pts.push({ x: stop.roadPos.x, z: stop.roadPos.z });
      cx = stop.roadPos.x;
      cz = stop.roadPos.z;
    }
    return pts;
  }

  function clearRouteGroup(meshId: number) {
    const scene = sceneRef.current;
    const group = routeGroupsRef.current.get(meshId);
    if (group) {
      scene?.remove(group);
      group.traverse((o) => {
        const obj = o as THREE.Mesh;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material && !Array.isArray(obj.material)) obj.material.dispose();
      });
      routeGroupsRef.current.delete(meshId);
    }
  }

  function clearAllRouteGroups() {
    for (const [id] of routeGroupsRef.current) clearRouteGroup(id);
  }

  // Construye la visualización siguiendo el camino por calles (waypoints ya calculados con A*)
  function buildRouteGroup(
    waypoints: { x: number; z: number }[], // path completo siguiendo calles
    stops: House[],                          // sólo para los marcadores numerados
    color: number,
  ): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) continue;
      const angle = Math.atan2(dz, dx);
      const mx = (from.x + to.x) / 2;
      const mz = (from.z + to.z) / 2;

      // Tira de color visible
      const strip = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.28), mat);
      strip.position.set(mx, 0.07, mz);
      strip.rotation.y = -angle;
      group.add(strip);

      // Borde blanco para contraste
      const glow = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.10), glowMat);
      glow.position.set(mx, 0.11, mz);
      glow.rotation.y = -angle;
      group.add(glow);

      // Flecha de dirección a mitad del segmento
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.28, 4),
        new THREE.MeshBasicMaterial({ color }),
      );
      arrow.rotation.x = Math.PI / 2;
      arrow.rotation.z = -angle + Math.PI / 2;
      arrow.position.set(mx, 0.14, mz);
      group.add(arrow);
    }

    // Marcadores de parada con número visual (altura = número de parada)
    stops.forEach((stop, idx) => {
      const stopColor = color;
      // Disco base
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.07, 12),
        new THREE.MeshBasicMaterial({ color: stopColor, transparent: true, opacity: 0.95 }),
      );
      disc.position.set(stop.roadPos.x, 0.08, stop.roadPos.z);
      group.add(disc);

      // Anillo blanco
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.28, 0.38, 14),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(stop.roadPos.x, 0.12, stop.roadPos.z);
      group.add(ring);

      // Columna vertical con altura = número de parada (1, 2, 3…)
      const colH = 0.22 + idx * 0.20;
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, colH, 6),
        new THREE.MeshBasicMaterial({ color: stopColor }),
      );
      col.position.set(stop.roadPos.x, 0.14 + colH / 2, stop.roadPos.z);
      group.add(col);

      // Esfera en la punta
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      tip.position.set(stop.roadPos.x, 0.14 + colH + 0.07, stop.roadPos.z);
      group.add(tip);
    });

    return group;
  }

  // Reconstruye la visualización para las paradas que le quedan al vehículo
  function rebuildRouteDisplay(v: Vehicle) {
    if (!variablesRef.current.optimizacionRutas || !v.routeColor) return;
    clearRouteGroup(v.mesh.id);
    const remaining = v.target ? [v.target, ...v.stopsQueue] : [...v.stopsQueue];
    if (remaining.length === 0) return;
    const roadPath = fullRoutePath(v.mesh.position.x, v.mesh.position.z, remaining);
    if (roadPath.length < 2) return;
    const grp = buildRouteGroup(roadPath, remaining, v.routeColor);
    sceneRef.current?.add(grp);
    routeGroupsRef.current.set(v.mesh.id, grp);
  }

  // ---- DISPATCH ----

  // Modo optimizado: greedy multi-parada. Cada vehículo recoge casas cercanas en una
  // sola ruta sin volver a base entre ellas. El límite de distancia entre paradas
  // evita asignar casas lejanas cuando otro vehículo está más cerca.
  function planMultiStops(
    fromPos: { x: number; z: number },
    pool: House[],
    maxStops = 3,
    maxDist = 5.5,
  ): House[] {
    const stops: House[] = [];
    let cur = fromPos;
    for (let s = 0; s < maxStops; s++) {
      let best: House | null = null, bestD = Infinity, bestIdx = -1;
      for (let i = 0; i < pool.length; i++) {
        const h = pool[i];
        const d = Math.abs(h.roadPos.x - cur.x) + Math.abs(h.roadPos.z - cur.z);
        if (d < bestD && d <= maxDist) { bestD = d; best = h; bestIdx = i; }
      }
      if (!best) break;
      pool.splice(bestIdx, 1);
      stops.push(best);
      cur = best.roadPos;
    }
    return stops;
  }

  function dispatchVehicles() {
    const optimized = variablesRef.current.optimizacionRutas;

    if (!optimized) {
      for (const v of vehiclesRef.current) {
        if (v.state === "idle") assignNextTrash(v);
      }
      return;
    }

    // Ordena vehículos por distancia a la basura más cercana para que el más cercano
    // elija primero sus paradas y el lejano no "robe" trabajo del cercano.
    const idleVehicles = vehiclesRef.current
      .filter((v) => v.state === "idle")
      .sort((a, b) => {
        const distA = Math.min(...housesRef.current
          .filter((h) => h.hasTrash && !h.assignedTo)
          .map((h) => Math.abs(h.roadPos.x - a.mesh.position.x) + Math.abs(h.roadPos.z - a.mesh.position.z)));
        const distB = Math.min(...housesRef.current
          .filter((h) => h.hasTrash && !h.assignedTo)
          .map((h) => Math.abs(h.roadPos.x - b.mesh.position.x) + Math.abs(h.roadPos.z - b.mesh.position.z)));
        return distA - distB;
      });

    const pool = housesRef.current.filter((h) => h.hasTrash && !h.assignedTo);
    const scene = sceneRef.current;

    const dispatched: Array<{ v: Vehicle; target: House; stopsQueue: House[]; path: ReturnType<typeof pathToHouse> }> = [];

    idleVehicles.forEach((v, colorIdx) => {
      if (pool.length === 0) return;
      const stops = planMultiStops({ x: v.mesh.position.x, z: v.mesh.position.z }, pool);
      if (stops.length === 0) return;

      const color = ROUTE_COLORS[colorIdx % ROUTE_COLORS.length];
      stops.forEach((h) => (h.assignedTo = String(v.mesh.id)));
      v.routeColor = color;

      const firstPath = pathToHouse(v.mesh.position.x, v.mesh.position.z, stops[0]);
      if (!firstPath) { stops.forEach((h) => (h.assignedTo = null)); return; }

      dispatched.push({ v, target: stops[0], stopsQueue: stops.slice(1), path: firstPath });

      // Mostrar ruta completa siguiendo las calles antes de salir
      if (scene) {
        const roadPath = fullRoutePath(v.mesh.position.x, v.mesh.position.z, stops);
        if (roadPath.length >= 2) {
          const grp = buildRouteGroup(roadPath, stops, color);
          scene.add(grp);
          routeGroupsRef.current.set(v.mesh.id, grp);
        }
      }
    });

    // Todos salen a la vez tras ver las rutas
    setTimeout(() => {
      for (const { v, target, stopsQueue, path } of dispatched) {
        if (v.state !== "idle" || !path) continue;
        v.target = target;
        v.stopsQueue = stopsQueue;
        v.path = path;
        v.pathIdx = 0;
        v.state = "moving";
      }
    }, 900);
  }

  function sendVehicleHome(v: Vehicle) {
    clearRouteGroup(v.mesh.id);
    v.stopsQueue = [];
    const start = nearestIntersection(v.mesh.position.x, v.mesh.position.z);
    const goal = nearestIntersection(v.homePos.x, v.homePos.z);
    const intPath = astar(start, goal);
    if (!intPath) { v.state = "idle"; return; }
    v.path = [...intPath.map((n) => ({ x: n.x, z: n.z })), { x: v.homePos.x, z: v.homePos.z }];
    v.pathIdx = 0;
    v.target = null;
    v.state = "returning";
  }

  function spawnSmoke(v: Vehicle) {
    const scene = sceneRef.current;
    if (!scene) return;
    const world = new THREE.Vector3(-0.5, 0.22, 0.2).applyMatrix4(v.mesh.matrixWorld);
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshBasicMaterial({
        color: variablesRef.current.tipoVehiculo === "diesel" ? 0x2a2a2a : 0x666666,
        transparent: true, opacity: 0.55,
      }),
    );
    p.position.copy(world);
    p.userData = { life: 0, maxLife: 60, vy: 0.018 };
    scene.add(p);
    smokeParticlesRef.current.push(p);
  }

  function updateVehicles(dt: number) {
    const speed = variablesRef.current.optimizacionRutas ? 3.0 : 2.2;
    const optimized = variablesRef.current.optimizacionRutas;
    let pickupCount = 0;

    for (const v of vehiclesRef.current) {
      if (v.state === "idle") continue;

      if (v.state === "collecting") {
        v.collectTimer += dt;
        if (v.collectTimer >= 0.8) {
          if (v.target) {
            if (pickupTrashAt(v.target)) pickupCount++;
            v.hasTrash = true;
            for (const c of v.mesh.children) {
              const m = c as THREE.Mesh;
              if (m.userData?.role === "trash") m.visible = true;
            }
          }
          v.collectTimer = 0;

          // ¿Hay más paradas planificadas?
          if (v.stopsQueue.length > 0) {
            const nextStop = v.stopsQueue.shift()!;
            const nextPath = pathToHouse(v.mesh.position.x, v.mesh.position.z, nextStop);
            if (nextPath) {
              v.path = nextPath;
              v.pathIdx = 0;
              v.target = nextStop;
              v.state = "moving";
              if (optimized) rebuildRouteDisplay(v);
            } else {
              sendVehicleHome(v);
            }
          } else if (!optimized && assignNextTrash(v)) {
            // Modo sin optimización: busca siguiente basura disponible
          } else {
            v.hasTrash = false;
            for (const c of v.mesh.children) {
              const m = c as THREE.Mesh;
              if (m.userData?.role === "trash") m.visible = false;
            }
            sendVehicleHome(v);
          }
        }
        continue;
      }

      if (!v.path || v.pathIdx >= v.path.length) {
        if (v.state === "returning") {
          v.state = "idle";
          v.hasTrash = false;
          for (const c of v.mesh.children) {
            const m = c as THREE.Mesh;
            if (m.userData?.role === "trash") m.visible = false;
          }
        } else {
          if (v.target && v.target.hasTrash) {
            clearRouteGroup(v.mesh.id); // segmento actual cumplido
            v.state = "collecting";
          } else {
            v.state = "idle";
            v.target = null;
          }
        }
        continue;
      }

      const wp = v.path[v.pathIdx];
      const dx = wp.x - v.mesh.position.x;
      const dz = wp.z - v.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.06) {
        v.mesh.position.x = wp.x;
        v.mesh.position.z = wp.z;
        v.pathIdx++;
      } else {
        const step = Math.min(speed * dt, d);
        v.mesh.position.x += (dx / d) * step;
        v.mesh.position.z += (dz / d) * step;
        const desiredRot = Math.atan2(-dz, dx);
        let cur = v.mesh.rotation.y;
        let delta = desiredRot - cur;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        v.mesh.rotation.y = cur + delta * Math.min(1, dt * 8);
      }

      if (variablesRef.current.tipoVehiculo !== "electrico") {
        v.lastSmoke += dt;
        const rate = variablesRef.current.tipoVehiculo === "diesel" ? 0.08 : 0.25;
        if (v.lastSmoke >= rate) { spawnSmoke(v); v.lastSmoke = 0; }
      }
    }
    if (pickupCount > 0) onPickup(pickupCount);
  }

  function updateSmoke() {
    const arr = smokeParticlesRef.current;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.userData.life++;
      p.position.y += p.userData.vy;
      p.scale.multiplyScalar(1.025);
      (p.material as THREE.Material).opacity = Math.max(0, 0.55 * (1 - p.userData.life / p.userData.maxLife));
      if (p.userData.life >= p.userData.maxLife) {
        sceneRef.current?.remove(p);
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
        arr.splice(i, 1);
      }
    }
  }

  // ---- INIT ----
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const cam = new THREE.OrthographicCamera(-9, 9, 9, -9, 0.1, 100);
    camRef.current = cam;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      if (!debug) { setWebglOk(false); onWebglStatus?.(false); }
      return;
    }
    const canvas = renderer.domElement;
    canvas.width = 800;
    canvas.height = 450;
    canvas.className = "w-full";
    canvas.style.aspectRatio = "16 / 9";
    canvas.style.display = "block";
    canvas.style.background = "linear-gradient(180deg, #5aaee8 0%, #90ccf5 45%, #c0e8a0 100%)";
    containerRef.current!.appendChild(canvas);
    canvasRef.current = canvas;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      updateCamera();
    }

    scene.add(new THREE.AmbientLight(0xfff8e8, 1.0));
    const sun = new THREE.DirectionalLight(0xfff5d8, 1.1);
    sun.position.set(10, 18, 8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb0d8ff, 0.35);
    fill.position.set(-8, 6, -10);
    scene.add(fill);

    buildScene();
    updateCamera();

    const houses = housesRef.current;
    for (let i = 0; i < 3; i++) {
      const h = houses[Math.floor(Math.random() * houses.length)];
      if (h && !h.hasTrash) spawnTrashAt(h);
    }
    setTimeout(() => {
      if (variablesRef.current.optimizacionRutas) dispatchVehicles();
      else for (const v of vehiclesRef.current) { if (v.state === "idle") assignNextTrash(v); }
    }, 200);

    const cvs = canvas;
    let dragging = false, lastX = 0, lastY = 0, pinchDist = 0;
    const onDown = (x: number, y: number) => { dragging = true; lastX = x; lastY = y; cvs.style.cursor = "grabbing"; };
    const onMove = (x: number, y: number) => {
      if (!dragging) return;
      camera.current.azimuth += (x - lastX) * 0.006;
      camera.current.elevation = Math.max(0.15, Math.min(Math.PI / 2 - 0.02, camera.current.elevation + (y - lastY) * 0.005));
      lastX = x; lastY = y;
      updateCamera();
    };
    const onUp = () => { dragging = false; cvs.style.cursor = "grab"; };

    cvs.style.cursor = "grab";
    cvs.addEventListener("mousedown", (e) => onDown(e.clientX, e.clientY));
    window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
    window.addEventListener("mouseup", onUp);
    cvs.addEventListener("mouseleave", onUp);
    cvs.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) onDown(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2) pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }, { passive: true });
    cvs.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }
      else if (e.touches.length === 2) {
        e.preventDefault();
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (pinchDist > 0) { camera.current.d = Math.max(4, Math.min(20, camera.current.d * (pinchDist / d))); updateCamera(); }
        pinchDist = d;
      }
    }, { passive: false });
    cvs.addEventListener("touchend", onUp);
    cvs.addEventListener("wheel", (e) => {
      e.preventDefault();
      camera.current.d = Math.max(4, Math.min(20, camera.current.d * Math.pow(1.0015, e.deltaY)));
      updateCamera();
    }, { passive: false });
    window.addEventListener("resize", resize);
    resize();

    lastTimeRef.current = performance.now();
    let animFrame = 0;
    function animate() {
      const now = performance.now();
      const rawDt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      if (rawDt > 0.5) { animFrame = requestAnimationFrame(animate); return; }
      const dt = sim.paused ? 0 : rawDt * sim.speed;
      animTimeRef.current += dt;
      updateVehicles(dt);
      updateSmoke();
      for (const h of housesRef.current) {
        if (h.trashMesh) {
          const ud = h.trashMesh.userData;
          const bob = Math.sin(animTimeRef.current * 2.5 + ud.spin) * 0.08;
          ud.diamond.position.y = ud.baseY + bob;
          ud.diamond.rotation.y = animTimeRef.current * 1.5;
          ud.diamond.rotation.x = animTimeRef.current * 0.6;
          const pulse = 1 + Math.sin(animTimeRef.current * 3 + ud.spin) * 0.15;
          ud.ring.scale.set(pulse, pulse, pulse);
          ud.ring.material.opacity = 0.5 + Math.sin(animTimeRef.current * 3 + ud.spin) * 0.2;
        }
      }
      for (const w of workerMeshesRef.current) {
        w.position.y = 1.45 + Math.sin(animTimeRef.current * 2 + w.userData.bob) * 0.02;
      }
      renderer.render(scene, cam);
      animFrame = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animFrame);
      const gl = renderer.getContext();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      renderer.dispose();
      canvas.parentNode?.removeChild(canvas);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (!variables.optimizacionRutas) clearAllRouteGroups();
    if (vehiclesRef.current.length !== variables.numVehicles) {
      spawnVehicles(variables);
    } else {
      const c = vehicleColors(variables.tipoVehiculo);
      for (const v of vehiclesRef.current) {
        for (const child of v.mesh.children) {
          const m = child as THREE.Mesh;
          if (m.userData?.role === "body") (m.material as THREE.MeshLambertMaterial).color.setHex(c.body);
          if (m.userData?.role === "cab") (m.material as THREE.MeshLambertMaterial).color.setHex(c.cab);
        }
      }
    }
    if (workerMeshesRef.current.length !== variables.numTrabajadores) {
      buildWorkers(SHOP_BLOCK.x, SHOP_BLOCK.z, 1.45, variables);
    }
  }, [variables]);

  useEffect(() => {
    if (sim.day !== lastDayRef.current && sim.day > 1) {
      lastDayRef.current = sim.day;
      onNewDayInternal();
    }
  }, [sim.day, onNewDayInternal]);

  useEffect(() => { lastDayRef.current = 1; }, []);

  if (!webglOk) return null;
  return <div ref={containerRef} className="w-full" style={{ aspectRatio: "16 / 9" }} />;
}
