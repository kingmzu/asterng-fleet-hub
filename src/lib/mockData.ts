export interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nationalId: string;
  licenseNumber: string;
  photoUrl?: string;
  status: 'active' | 'suspended' | 'pending';
  complianceScore: number;
  assignedBikeId?: string;
  kycStatus: 'verified' | 'pending' | 'rejected';
  policeClearance: boolean;
  testApproved: boolean;
  joinDate: string;
  totalRemittance: number;
  outstandingBalance: number;
}

export interface Motorcycle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  status: 'active' | 'maintenance' | 'suspended';
  assignedRiderId?: string;
  insuranceExpiry: string;
  lastMaintenance: string;
  totalRevenue: number;
  maintenanceCost: number;
}

export interface Remittance {
  id: string;
  riderId: string;
  riderName: string;
  bikeId: string;
  amount: number;
  date: string;
  type: 'daily' | 'weekly';
  status: 'paid' | 'partial' | 'overdue';
  method: 'cash' | 'transfer' | 'pos';
}

export interface Expense {
  id: string;
  category: 'maintenance' | 'mechanic' | 'pos' | 'fuel' | 'insurance' | 'capital' | 'other';
  description: string;
  amount: number;
  date: string;
  bikeId?: string;
  riderName?: string;
}

export interface DashboardStats {
  totalBikes: number;
  activeRiders: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  overduePayments: number;
}

export const mockRiders: Rider[] = [
  { id: 'R001', name: 'Adebayo Ogunlesi', phone: '08031234567', nationalId: 'NIN-12345678', licenseNumber: 'DL-LAG-001', status: 'active', complianceScore: 92, assignedBikeId: 'B001', kycStatus: 'verified', policeClearance: true, testApproved: true, joinDate: '2024-06-15', totalRemittance: 245000, outstandingBalance: 0 },
  { id: 'R002', name: 'Chukwuemeka Obi', phone: '08098765432', nationalId: 'NIN-23456789', licenseNumber: 'DL-LAG-002', status: 'active', complianceScore: 78, assignedBikeId: 'B002', kycStatus: 'verified', policeClearance: true, testApproved: true, joinDate: '2024-07-20', totalRemittance: 198000, outstandingBalance: 5000 },
  { id: 'R003', name: 'Ibrahim Musa', phone: '07061234567', nationalId: 'NIN-34567890', licenseNumber: 'DL-ABJ-003', status: 'suspended', complianceScore: 45, assignedBikeId: undefined, kycStatus: 'verified', policeClearance: true, testApproved: true, joinDate: '2024-08-10', totalRemittance: 87000, outstandingBalance: 15000 },
  { id: 'R004', name: 'Oluwaseun Adeyemi', phone: '09012345678', nationalId: 'NIN-45678901', licenseNumber: 'DL-LAG-004', status: 'pending', complianceScore: 0, kycStatus: 'pending', policeClearance: false, testApproved: false, joinDate: '2025-02-25', totalRemittance: 0, outstandingBalance: 0 },
  { id: 'R005', name: 'Yusuf Abdullahi', phone: '08145678901', nationalId: 'NIN-56789012', licenseNumber: 'DL-KAN-005', status: 'active', complianceScore: 88, assignedBikeId: 'B004', kycStatus: 'verified', policeClearance: true, testApproved: true, joinDate: '2024-09-01', totalRemittance: 176000, outstandingBalance: 2000 },
  { id: 'R006', name: 'Emeka Nwankwo', phone: '07032145678', nationalId: 'NIN-67890123', licenseNumber: 'DL-LAG-006', status: 'active', complianceScore: 95, assignedBikeId: 'B005', kycStatus: 'verified', policeClearance: true, testApproved: true, joinDate: '2024-05-10', totalRemittance: 312000, outstandingBalance: 0 },
];

export const mockMotorcycles: Motorcycle[] = [
  { id: 'B001', registrationNumber: 'LAG-234-XY', make: 'Bajaj', model: 'Boxer 150', year: 2024, color: 'Red', status: 'active', assignedRiderId: 'R001', insuranceExpiry: '2025-12-31', lastMaintenance: '2025-02-01', totalRevenue: 245000, maintenanceCost: 18000 },
  { id: 'B002', registrationNumber: 'LAG-567-AB', make: 'TVS', model: 'Apache 160', year: 2024, color: 'Black', status: 'active', assignedRiderId: 'R002', insuranceExpiry: '2025-11-15', lastMaintenance: '2025-01-20', totalRevenue: 198000, maintenanceCost: 12000 },
  { id: 'B003', registrationNumber: 'LAG-890-CD', make: 'Honda', model: 'ACE 125', year: 2023, color: 'Blue', status: 'maintenance', assignedRiderId: undefined, insuranceExpiry: '2025-08-20', lastMaintenance: '2025-02-20', totalRevenue: 156000, maintenanceCost: 35000 },
  { id: 'B004', registrationNumber: 'ABJ-123-EF', make: 'Bajaj', model: 'Pulsar 150', year: 2024, color: 'Red', status: 'active', assignedRiderId: 'R005', insuranceExpiry: '2025-10-30', lastMaintenance: '2025-01-15', totalRevenue: 176000, maintenanceCost: 8000 },
  { id: 'B005', registrationNumber: 'LAG-456-GH', make: 'TVS', model: 'Star City', year: 2024, color: 'Silver', status: 'active', assignedRiderId: 'R006', insuranceExpiry: '2026-01-15', lastMaintenance: '2025-02-10', totalRevenue: 312000, maintenanceCost: 22000 },
  { id: 'B006', registrationNumber: 'LAG-789-IJ', make: 'Honda', model: 'CG 125', year: 2023, color: 'Black', status: 'suspended', assignedRiderId: undefined, insuranceExpiry: '2025-03-01', lastMaintenance: '2024-12-05', totalRevenue: 89000, maintenanceCost: 45000 },
];

export const mockRemittances: Remittance[] = [
  { id: 'P001', riderId: 'R001', riderName: 'Adebayo Ogunlesi', bikeId: 'B001', amount: 3500, date: '2025-02-28', type: 'daily', status: 'paid', method: 'transfer' },
  { id: 'P002', riderId: 'R002', riderName: 'Chukwuemeka Obi', bikeId: 'B002', amount: 3500, date: '2025-02-28', type: 'daily', status: 'paid', method: 'cash' },
  { id: 'P003', riderId: 'R005', riderName: 'Yusuf Abdullahi', bikeId: 'B004', amount: 3000, date: '2025-02-28', type: 'daily', status: 'partial', method: 'pos' },
  { id: 'P004', riderId: 'R006', riderName: 'Emeka Nwankwo', bikeId: 'B005', amount: 3500, date: '2025-02-28', type: 'daily', status: 'paid', method: 'transfer' },
  { id: 'P005', riderId: 'R001', riderName: 'Adebayo Ogunlesi', bikeId: 'B001', amount: 3500, date: '2025-02-27', type: 'daily', status: 'paid', method: 'cash' },
  { id: 'P006', riderId: 'R002', riderName: 'Chukwuemeka Obi', bikeId: 'B002', amount: 3500, date: '2025-02-27', type: 'daily', status: 'overdue', method: 'cash' },
  { id: 'P007', riderId: 'R005', riderName: 'Yusuf Abdullahi', bikeId: 'B004', amount: 21000, date: '2025-02-24', type: 'weekly', status: 'paid', method: 'transfer' },
  { id: 'P008', riderId: 'R003', riderName: 'Ibrahim Musa', bikeId: 'B003', amount: 3500, date: '2025-02-20', type: 'daily', status: 'overdue', method: 'cash' },
];

export const mockExpenses: Expense[] = [
  { id: 'E001', category: 'maintenance', description: 'Engine oil change - Bajaj Boxer', amount: 4500, date: '2025-02-25', bikeId: 'B001' },
  { id: 'E002', category: 'mechanic', description: 'Brake pad replacement', amount: 8000, date: '2025-02-22', bikeId: 'B003' },
  { id: 'E003', category: 'fuel', description: 'Fuel support - 5 riders', amount: 12500, date: '2025-02-20' },
  { id: 'E004', category: 'insurance', description: 'Insurance renewal - LAG-789-IJ', amount: 15000, date: '2025-02-18', bikeId: 'B006' },
  { id: 'E005', category: 'pos', description: 'POS terminal charges', amount: 3200, date: '2025-02-15' },
  { id: 'E006', category: 'capital', description: 'New helmet purchase (10 units)', amount: 45000, date: '2025-02-10' },
  { id: 'E007', category: 'maintenance', description: 'Tire replacement - TVS Apache', amount: 6500, date: '2025-02-08', bikeId: 'B002' },
  { id: 'E008', category: 'other', description: 'Office supplies', amount: 2800, date: '2025-02-05' },
];

export const mockDashboardStats: DashboardStats = {
  totalBikes: 6,
  activeRiders: 4,
  monthlyRevenue: 485000,
  monthlyExpenses: 97500,
  netProfit: 387500,
  overduePayments: 2,
};

export const monthlyRevenueData = [
  { month: 'Sep', revenue: 320000, expenses: 65000 },
  { month: 'Oct', revenue: 380000, expenses: 78000 },
  { month: 'Nov', revenue: 410000, expenses: 82000 },
  { month: 'Dec', revenue: 395000, expenses: 95000 },
  { month: 'Jan', revenue: 450000, expenses: 88000 },
  { month: 'Feb', revenue: 485000, expenses: 97500 },
];

export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};
