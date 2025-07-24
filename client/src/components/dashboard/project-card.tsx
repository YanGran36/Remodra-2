import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Building, Calendar, DollarSign } from 'lucide-react';

export interface ProjectCardProps {
  id: number;
  title: string;
  status: string;
  progress: number;
  client: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

export default function ProjectCard({
  id,
  title,
  status,
  progress,
  client,
  startDate,
  endDate,
  budget
}: ProjectCardProps) {
  const getStatusClass = () => {
    switch (status) {
      case "active":
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white";
      case "completed":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "delayed":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "active":
      case "in_progress":
        return "In Progress";
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "delayed":
        return "Delayed";
      default:
        return status;
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case "active":
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600";
      case "completed":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "delayed":
        return "bg-gradient-to-r from-red-500 to-red-600";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatBudget = (amount?: number) => {
    if (!amount) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="card-home-builder hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h4 className="font-bold text-lg text-gray-900 mb-1">{title}</h4>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Building className="h-4 w-4 mr-1" />
              <span>{client}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Started {formatDate(startDate)}</span>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${getStatusClass()}`}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-700 font-medium">Progress</span>
            <span className="text-gray-900 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-1" />
            <span className="font-medium">{formatBudget(budget)}</span>
          </div>
          <Button 
            variant="outline" 
            className="text-sm font-medium border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all duration-300"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
