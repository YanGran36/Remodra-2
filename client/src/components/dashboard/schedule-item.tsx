import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Phone, MessageSquare, MapPin, FileText, Clock, User } from "lucide-react";
import { Button } from '../ui/button';

export interface ScheduleItemProps {
  time: string;
  timeColor: string;
  title: string;
  location: string;
  contact?: {
    name: string;
    avatar?: string;
    initials?: string;
    id?: number;
  };
  orderNumber?: string;
  onPhoneClick?: () => void;
  onMessageClick?: () => void;
  onMapClick?: () => void;
  onCreateEstimateClick?: () => void;
}

export default function ScheduleItem({
  time,
  timeColor,
  title,
  location,
  contact,
  orderNumber,
  onPhoneClick,
  onMessageClick,
  onMapClick,
  onCreateEstimateClick
}: ScheduleItemProps) {
  return (
    <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className={`${timeColor} font-bold rounded-lg px-3 py-2 text-sm shadow-sm flex items-center`}>
            <Clock className="h-4 w-4 mr-1" />
            {time}
          </div>
        </div>
        
        <div className="flex-grow min-w-0">
          <h4 className="font-bold text-gray-900 text-lg mb-1">{title}</h4>
          
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1 text-blue-500" />
            <span className="truncate">{location}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {contact && (
                <div className="flex items-center bg-blue-100 rounded-full px-3 py-1">
                  <User className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">{contact.name}</span>
                </div>
              )}
              
              {orderNumber && (
                <div className="ml-3 bg-orange-100 rounded-full px-3 py-1">
                  <span className="text-sm font-medium text-orange-800">Order #{orderNumber}</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {onPhoneClick && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-300" 
                  onClick={onPhoneClick}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              
              {onMessageClick && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300" 
                  onClick={onMessageClick}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
              
              {onMapClick && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300" 
                  onClick={onMapClick}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              )}
              
              {onCreateEstimateClick && contact?.id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300" 
                  onClick={onCreateEstimateClick} 
                  title="Create estimate"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
