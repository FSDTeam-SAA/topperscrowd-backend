export interface IDashboardQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export interface IRecentOrdersStats {
  totalUsers: number;
  totalOrders: number;
  totalReviews: number;
  totalRevenue: number;
  recentOrders: any[];
}
