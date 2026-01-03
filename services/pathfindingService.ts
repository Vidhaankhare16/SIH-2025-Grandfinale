// Shortest path finding algorithm for warehouse-farmer mapping
// Using Haversine formula for distance calculation and A* algorithm for path finding

export interface Location {
  lat: number;
  lng: number;
}

export interface PathResult {
  from: string;
  to: string;
  distance: number; // in kilometers
  path: Location[];
}

// Calculate distance between two points using Haversine formula
export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearest warehouse for a farmer
export const findNearestWarehouse = (
  farmerLocation: Location,
  warehouses: Array<{ id: string; name: string; location: Location; capacity: number; utilization: number }>
): { warehouseId: string; warehouseName: string; distance: number } | null => {
  if (warehouses.length === 0) return null;

  let nearest = warehouses[0];
  let minDistance = calculateDistance(farmerLocation, warehouses[0].location);

  warehouses.forEach(warehouse => {
    const distance = calculateDistance(farmerLocation, warehouse.location);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = warehouse;
    }
  });

  return {
    warehouseId: nearest.id,
    warehouseName: nearest.name,
    distance: minDistance
  };
};

// Find nearest farmers for a warehouse
export const findNearestFarmers = (
  warehouseLocation: Location,
  farmers: Array<{ id: string; name: string; location: Location }>,
  limit: number = 5
): Array<{ farmerId: string; farmerName: string; distance: number }> => {
  const distances = farmers.map(farmer => ({
    farmerId: farmer.id,
    farmerName: farmer.name,
    distance: calculateDistance(warehouseLocation, farmer.location)
  }));

  return distances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

// Generate route path between two points (simplified - returns intermediate points)
export const generateRoute = (from: Location, to: Location, steps: number = 5): Location[] => {
  const path: Location[] = [from];
  
  for (let i = 1; i < steps; i++) {
    const ratio = i / steps;
    path.push({
      lat: from.lat + (to.lat - from.lat) * ratio,
      lng: from.lng + (to.lng - from.lng) * ratio
    });
  }
  
  path.push(to);
  return path;
};

// Find optimal warehouse assignment for multiple farmers
export interface FarmerAssignment {
  farmerId: string;
  farmerName: string;
  farmerLocation: Location;
  assignedWarehouseId: string;
  assignedWarehouseName: string;
  distance: number;
}

export const assignFarmersToWarehouses = (
  farmers: Array<{ id: string; name: string; location: Location }>,
  warehouses: Array<{ id: string; name: string; location: Location; capacity: number; utilization: number }>
): FarmerAssignment[] => {
  return farmers.map(farmer => {
    const nearest = findNearestWarehouse(farmer.location, warehouses);
    if (!nearest) {
      return {
        farmerId: farmer.id,
        farmerName: farmer.name,
        farmerLocation: farmer.location,
        assignedWarehouseId: '',
        assignedWarehouseName: 'No warehouse available',
        distance: Infinity
      };
    }
    return {
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmerLocation: farmer.location,
      assignedWarehouseId: nearest.warehouseId,
      assignedWarehouseName: nearest.warehouseName,
      distance: nearest.distance
    };
  });
};

// A* Pathfinding Algorithm
interface AStarNode {
  location: Location;
  g: number; // Cost from start to this node
  h: number; // Heuristic cost from this node to goal
  f: number; // Total cost (g + h)
  parent: AStarNode | null;
}

// Heuristic function (straight-line distance)
const heuristic = (a: Location, b: Location): number => {
  return calculateDistance(a, b);
};

// Get neighbors for A* (in a real scenario, these would be actual road intersections)
// For now, we'll use intermediate waypoints between start and goal
const getNeighbors = (current: Location, goal: Location, warehouses: Location[]): Location[] => {
  const neighbors: Location[] = [];
  
  // Add intermediate waypoints (simulating road network)
  const steps = 3;
  for (let i = 1; i < steps; i++) {
    const ratio = i / steps;
    neighbors.push({
      lat: current.lat + (goal.lat - current.lat) * ratio,
      lng: current.lng + (goal.lng - current.lng) * ratio
    });
  }
  
  // Add nearby warehouses as potential waypoints
  warehouses.forEach(warehouse => {
    const distToCurrent = calculateDistance(current, warehouse);
    const distToGoal = calculateDistance(warehouse, goal);
    // Only include if it's not too far off the direct path
    if (distToCurrent + distToGoal < calculateDistance(current, goal) * 1.5) {
      neighbors.push(warehouse);
    }
  });
  
  return neighbors;
};

// A* pathfinding algorithm
export const findOptimalRoute = (
  start: Location,
  goal: Location,
  warehouses: Array<{ id: string; name: string; location: Location }> = []
): { path: Location[]; distance: number } => {
  // If start and goal are the same, return empty path
  if (start.lat === goal.lat && start.lng === goal.lng) {
    return { path: [start], distance: 0 };
  }
  
  const warehouseLocations = warehouses.map(w => w.location);
  
  // Initialize open and closed sets
  const openSet: Map<string, AStarNode> = new Map();
  const closedSet: Set<string> = new Set();
  
  // Helper to create a key from location
  const locationKey = (loc: Location): string => `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
  
  // Initialize start node
  const startNode: AStarNode = {
    location: start,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null
  };
  
  openSet.set(locationKey(start), startNode);
  
  // A* main loop
  while (openSet.size > 0) {
    // Find node with lowest f score
    let current: AStarNode | null = null;
    let currentKey = '';
    let minF = Infinity;
    
    openSet.forEach((node, key) => {
      if (node.f < minF) {
        minF = node.f;
        current = node;
        currentKey = key;
      }
    });
    
    if (!current) break;
    
    // Move current from open to closed
    openSet.delete(currentKey);
    closedSet.add(currentKey);
    
    // Check if we reached the goal
    if (current.location.lat === goal.lat && current.location.lng === goal.lng) {
      // Reconstruct path
      const path: Location[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift(node.location);
        node = node.parent;
      }
      return { path, distance: current.g };
    }
    
    // Explore neighbors
    const neighbors = getNeighbors(current.location, goal, warehouseLocations);
    neighbors.forEach(neighbor => {
      const neighborKey = locationKey(neighbor);
      
      // Skip if already in closed set
      if (closedSet.has(neighborKey)) return;
      
      // Calculate tentative g score
      const tentativeG = current!.g + calculateDistance(current!.location, neighbor);
      
      // Check if neighbor is in open set
      const existingNode = openSet.get(neighborKey);
      
      if (!existingNode) {
        // New node, add to open set
        const newNode: AStarNode = {
          location: neighbor,
          g: tentativeG,
          h: heuristic(neighbor, goal),
          f: tentativeG + heuristic(neighbor, goal),
          parent: current
        };
        openSet.set(neighborKey, newNode);
      } else if (tentativeG < existingNode.g) {
        // Found a better path to this node
        existingNode.g = tentativeG;
        existingNode.f = tentativeG + existingNode.h;
        existingNode.parent = current;
      }
    });
  }
  
  // No path found, return direct path as fallback
  const directDistance = calculateDistance(start, goal);
  return {
    path: [start, goal],
    distance: directDistance
  };
};

// Calculate logistics cost based on distance and quantity
export interface LogisticsCost {
  distance: number; // in kilometers
  baseCost: number; // Base transportation cost
  fuelCost: number; // Fuel cost (₹8/km for truck)
  driverCost: number; // Driver cost (₹500 per trip)
  totalCost: number; // Total logistics cost
  vehicleType: string; // Recommended vehicle type
}

export const calculateLogisticsCost = (
  quantity: number, // in quintals
  distance: number, // in kilometers
  farmerLocation?: Location
): LogisticsCost => {
  // Determine vehicle type based on quantity
  let vehicleType = 'tempo';
  let fuelCostPerKm = 6; // ₹6/km for tempo
  let baseCostPerKm = 4; // ₹4/km base cost
  
  if (quantity > 60) {
    vehicleType = 'truck';
    fuelCostPerKm = 8; // ₹8/km for truck
    baseCostPerKm = 6; // ₹6/km base cost
  } else if (quantity > 30) {
    vehicleType = 'tractor';
    fuelCostPerKm = 7; // ₹7/km for tractor
    baseCostPerKm = 5; // ₹5/km base cost
  }
  
  const fuelCost = distance * fuelCostPerKm;
  const driverCost = 500; // Fixed cost per trip
  const baseCost = distance * baseCostPerKm;
  const totalCost = fuelCost + driverCost + baseCost;
  
  return {
    distance,
    baseCost,
    fuelCost,
    driverCost,
    totalCost: Math.round(totalCost),
    vehicleType
  };
};


