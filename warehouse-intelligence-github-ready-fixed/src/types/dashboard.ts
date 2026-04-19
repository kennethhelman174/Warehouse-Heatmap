
export interface DashboardStats {
  nearMisses: number;
  incidents: number;
  openActions: number;
  totalZones: number;
  trends: {
    name: string;
    incidents: number;
    nearMisses: number;
  }[];
  recentEvents: any[];
}
