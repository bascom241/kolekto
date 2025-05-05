
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, trend }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <CardDescription className="text-xs mt-1">
            {description}
            {trend && (
              <span className={`ml-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  totalCollections: number;
  activeCollections: number;
  totalParticipants: number;
  totalAmount: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalCollections,
  activeCollections,
  totalParticipants,
  totalAmount
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        title="Total Collections" 
        value={totalCollections}
        description="All time" 
      />
      <StatsCard 
        title="Active Collections" 
        value={activeCollections}
        description="Currently accepting payments" 
      />
      <StatsCard 
        title="Total Participants" 
        value={totalParticipants}
        description="Across all collections"
        trend={{ value: 12, isPositive: true }}
      />
      <StatsCard 
        title="Total Amount" 
        value={`₦${totalAmount.toLocaleString()}`}
        description="All time"
        trend={{ value: 8.3, isPositive: true }}
      />
    </div>
  );
};

export default DashboardStats;
