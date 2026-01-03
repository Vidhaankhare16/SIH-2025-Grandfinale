// Verification service for farmer registrations and cluster memberships
// Simulates verification against government databases

export interface VerificationResult {
  verified: boolean;
  message: string;
  details?: string;
  verifiedAt?: string;
}

/**
 * Verify if a farmer is registered on Go-Sugam portal
 * Simulates API call to Go-Sugam database
 */
export const verifyGoSugamRegistration = async (
  farmerName: string,
  location: string,
  phoneNumber?: string
): Promise<VerificationResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulated verification logic
  // In real implementation, this would call Go-Sugam API
  const registeredFarmers = [
    { name: 'Ramesh Kumar', location: 'Khordha', phone: '9876543210' },
    { name: 'Anita Patra', location: 'Cuttack', phone: '9876543211' },
    { name: 'Suresh Das', location: 'Puri', phone: '9876543212' },
    { name: 'Priya Mohanty', location: 'Ganjam', phone: '9876543213' },
    { name: 'Rajesh Behera', location: 'Bhadrak', phone: '9876543214' },
  ];
  
  // Check if farmer matches registered records
  const isRegistered = registeredFarmers.some(farmer => 
    farmer.name.toLowerCase().includes(farmerName.toLowerCase()) ||
    farmer.location.toLowerCase().includes(location.toLowerCase()) ||
    (phoneNumber && farmer.phone === phoneNumber)
  );
  
  if (isRegistered) {
    return {
      verified: true,
      message: 'Farmer is registered on Go-Sugam portal',
      details: 'Registration verified successfully. You are eligible for government schemes.',
      verifiedAt: new Date().toISOString(),
    };
  }
  
  return {
    verified: false,
    message: 'Farmer not found in Go-Sugam database',
    details: 'Please register on Go-Sugam portal (go-sugam.odisha.gov.in) to access government schemes.',
  };
};

/**
 * Verify if a farmer is part of a Value Chain Cluster
 * Simulates API call to NMEO-OP cluster database
 */
export const verifyValueChainCluster = async (
  farmerName: string,
  location: string,
  cropName?: string
): Promise<VerificationResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulated cluster database
  const clusterMembers = [
    { name: 'Ramesh Kumar', location: 'Khordha', crop: 'Groundnut', clusterId: 'NMEO-CLUSTER-001' },
    { name: 'Anita Patra', location: 'Cuttack', crop: 'Mustard', clusterId: 'NMEO-CLUSTER-002' },
    { name: 'Suresh Das', location: 'Puri', crop: 'Soybean', clusterId: 'NMEO-CLUSTER-001' },
    { name: 'Priya Mohanty', location: 'Ganjam', crop: 'Sunflower', clusterId: 'NMEO-CLUSTER-003' },
    { name: 'Rajesh Behera', location: 'Bhadrak', crop: 'Groundnut', clusterId: 'NMEO-CLUSTER-002' },
  ];
  
  // Check if farmer is in a cluster
  const clusterMember = clusterMembers.find(farmer => 
    farmer.name.toLowerCase().includes(farmerName.toLowerCase()) &&
    farmer.location.toLowerCase().includes(location.toLowerCase())
  );
  
  if (clusterMember) {
    return {
      verified: true,
      message: `Farmer is part of Value Chain Cluster ${clusterMember.clusterId}`,
      details: `You are registered in cluster ${clusterMember.clusterId} for ${clusterMember.crop} cultivation. Eligible for NMEO-OP benefits.`,
      verifiedAt: new Date().toISOString(),
    };
  }
  
  return {
    verified: false,
    message: 'Farmer not found in any Value Chain Cluster',
    details: 'To join a cluster, contact your local FPO or agriculture department. Clusters provide free seeds, training, and guaranteed market access.',
  };
};

/**
 * Verify FPO membership
 */
export const verifyFPOMembership = async (
  farmerName: string,
  location: string
): Promise<VerificationResult> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulated FPO database
  const fpoMembers = [
    { name: 'Ramesh Kumar', location: 'Khordha', fpoName: 'Odisha Oilseed FPO - Khordha' },
    { name: 'Anita Patra', location: 'Cuttack', fpoName: 'Cuttack Oilseed Producers Cooperative' },
    { name: 'Suresh Das', location: 'Puri', fpoName: 'Puri Coastal FPO' },
  ];
  
  const member = fpoMembers.find(farmer => 
    farmer.name.toLowerCase().includes(farmerName.toLowerCase()) &&
    farmer.location.toLowerCase().includes(location.toLowerCase())
  );
  
  if (member) {
    return {
      verified: true,
      message: `Member of ${member.fpoName}`,
      details: `You are a registered member of ${member.fpoName}. Eligible for FPO benefits and schemes.`,
      verifiedAt: new Date().toISOString(),
    };
  }
  
  return {
    verified: false,
    message: 'FPO membership not verified',
    details: 'Join a local FPO to access better prices, collective bargaining, and government support.',
  };
};

