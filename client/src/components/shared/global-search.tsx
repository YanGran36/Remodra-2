import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Search, X, Users, FileText, Receipt, Hammer, Calendar, Building, Clock, Bot, Settings, UserCheck, DollarSign, MessageSquare, Paperclip, Zap } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { cn } from '../../lib/utils';

interface SearchResult {
  id: string | number;
  type: 'client' | 'estimate' | 'invoice' | 'project' | 'event' | 'material' | 'agent' | 'payment' | 'followUp' | 'attachment';
  title: string;
  subtitle: string;
  description?: string;
  url: string;
  icon: React.ComponentType<any>;
  status?: string;
  date?: string;
  amount?: number;
  priority?: 'high' | 'medium' | 'low';
  matchType?: 'exact' | 'partial' | 'fuzzy';
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Enhanced data fetching with better query keys
  const { data: clients = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/clients"],
    enabled: open && searchQuery.length > 0
  });
  
  const { data: estimates = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/estimates"],
    enabled: open && searchQuery.length > 0
  });
  
  const { data: invoices = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/invoices"],
    enabled: open && searchQuery.length > 0
  });
  
  const { data: projects = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/projects"],
    enabled: open && searchQuery.length > 0
  });
  
  const { data: events = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/events"],
    enabled: open && searchQuery.length > 0
  });
  
  const { data: materials = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/materials"],
    enabled: open && searchQuery.length > 0
  });

  const { data: agents = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/agents"],
    enabled: open && searchQuery.length > 0
  });

  const { data: payments = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/payments"],
    enabled: open && searchQuery.length > 0
  });

  const { data: followUps = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/follow-ups"],
    enabled: open && searchQuery.length > 0
  });

  const { data: attachments = [] } = useQuery<any[]>({ 
    queryKey: ["/api/protected/attachments"],
    enabled: open && searchQuery.length > 0
  });

  // Enhanced search function with fuzzy matching and priority scoring
  const searchInText = (text: string, query: string): { found: boolean; score: number; matchType: 'exact' | 'partial' | 'fuzzy' } => {
    if (!text) return { found: false, score: 0, matchType: 'fuzzy' };
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Exact match
    if (lowerText === lowerQuery) {
      return { found: true, score: 100, matchType: 'exact' };
    }
    
    // Starts with query
    if (lowerText.startsWith(lowerQuery)) {
      return { found: true, score: 80, matchType: 'partial' };
    }
    
    // Contains query
    if (lowerText.includes(lowerQuery)) {
      return { found: true, score: 60, matchType: 'partial' };
    }
    
    // Word boundary match
    const words = lowerText.split(/\s+/);
    const queryWords = lowerQuery.split(/\s+/);
    
    for (const queryWord of queryWords) {
      for (const word of words) {
        if (word.startsWith(queryWord) || word.includes(queryWord)) {
          return { found: true, score: 40, matchType: 'fuzzy' };
        }
      }
    }
    
    return { found: false, score: 0, matchType: 'fuzzy' };
  };

  // Transform data into enhanced search results
  const transformToSearchResults = (): SearchResult[] => {
    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    // Enhanced Clients search
    clients.forEach((client: any) => {
      const nameMatch = searchInText(`${client.firstName} ${client.lastName}`, query);
      const emailMatch = searchInText(client.email, query);
      const phoneMatch = searchInText(client.phone, query);
      const addressMatch = searchInText(client.address, query);
      const notesMatch = searchInText(client.notes, query);
      
      if (nameMatch.found || emailMatch.found || phoneMatch.found || addressMatch.found || notesMatch.found) {
        const maxScore = Math.max(nameMatch.score, emailMatch.score, phoneMatch.score, addressMatch.score, notesMatch.score);
        results.push({
          id: client.id,
          type: 'client',
          title: `${client.firstName} ${client.lastName}`,
          subtitle: client.email || client.phone || 'No contact info',
          description: client.address ? `${client.address}, ${client.city || ''} ${client.state || ''}` : client.notes,
          url: `/clients/${client.id}`,
          icon: Users,
          status: client.status,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: nameMatch.found ? nameMatch.matchType : emailMatch.found ? emailMatch.matchType : 'fuzzy'
        });
      }
    });

    // Enhanced Estimates search
    estimates.forEach((estimate: any) => {
      const numberMatch = searchInText(estimate.estimateNumber, query);
      const notesMatch = searchInText(estimate.notes, query);
      const statusMatch = searchInText(estimate.status, query);
      const termsMatch = searchInText(estimate.terms, query);
      
      if (numberMatch.found || notesMatch.found || statusMatch.found || termsMatch.found) {
        const maxScore = Math.max(numberMatch.score, notesMatch.score, statusMatch.score, termsMatch.score);
        results.push({
          id: estimate.id,
          type: 'estimate',
          title: estimate.estimateNumber,
          subtitle: estimate.clientName || 'No client',
          description: estimate.notes || estimate.terms,
          url: `/estimates/${estimate.id}`,
          icon: FileText,
          status: estimate.status,
          date: estimate.createdAt,
          amount: estimate.total,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: numberMatch.found ? numberMatch.matchType : 'fuzzy'
        });
      }
    });

    // Enhanced Invoices search
    invoices.forEach((invoice: any) => {
      const numberMatch = searchInText(invoice.invoiceNumber, query);
      const notesMatch = searchInText(invoice.notes, query);
      const statusMatch = searchInText(invoice.status, query);
      const termsMatch = searchInText(invoice.terms, query);
      
      if (numberMatch.found || notesMatch.found || statusMatch.found || termsMatch.found) {
        const maxScore = Math.max(numberMatch.score, notesMatch.score, statusMatch.score, termsMatch.score);
        results.push({
          id: invoice.id,
          type: 'invoice',
          title: invoice.invoiceNumber,
          subtitle: invoice.clientName || 'No client',
          description: invoice.notes || invoice.terms,
          url: `/invoices/${invoice.id}`,
          icon: Receipt,
          status: invoice.status,
          date: invoice.createdAt,
          amount: invoice.total,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: numberMatch.found ? numberMatch.matchType : 'fuzzy'
        });
      }
    });

    // Enhanced Projects search
    projects.forEach((project: any) => {
      const titleMatch = searchInText(project.title, query);
      const descMatch = searchInText(project.description, query);
      const notesMatch = searchInText(project.notes, query);
      const statusMatch = searchInText(project.status, query);
      const serviceMatch = searchInText(project.serviceType, query);
      const aiMatch = searchInText(project.aiProjectSummary, query);
      
      if (titleMatch.found || descMatch.found || notesMatch.found || statusMatch.found || serviceMatch.found || aiMatch.found) {
        const maxScore = Math.max(titleMatch.score, descMatch.score, notesMatch.score, statusMatch.score, serviceMatch.score, aiMatch.score);
        results.push({
          id: project.id,
          type: 'project',
          title: project.title,
          subtitle: project.clientName || 'No client',
          description: project.description || project.notes || project.aiProjectSummary,
          url: `/projects/${project.id}`,
          icon: Hammer,
          status: project.status,
          date: project.startDate,
          amount: project.budget,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: titleMatch.found ? titleMatch.matchType : 'fuzzy'
        });
      }
    });

    // Enhanced Events search
    events.forEach((event: any) => {
      const titleMatch = searchInText(event.title, query);
      const descMatch = searchInText(event.description, query);
      const notesMatch = searchInText(event.notes, query);
      const typeMatch = searchInText(event.type, query);
      const addressMatch = searchInText(event.address, query);
      
      if (titleMatch.found || descMatch.found || notesMatch.found || typeMatch.found || addressMatch.found) {
        const maxScore = Math.max(titleMatch.score, descMatch.score, notesMatch.score, typeMatch.score, addressMatch.score);
        results.push({
          id: event.id,
          type: 'event',
          title: event.title,
          subtitle: event.clientName || event.type || 'No details',
          description: event.description || event.notes || event.address,
          url: `/calendar`,
          icon: Calendar,
          status: event.status,
          date: event.startTime,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: titleMatch.found ? titleMatch.matchType : 'fuzzy'
        });
      }
    });

    // Enhanced Materials search
    materials.forEach((material: any) => {
      const nameMatch = searchInText(material.name, query);
      const descMatch = searchInText(material.description, query);
      const unitMatch = searchInText(material.unit, query);
      
      if (nameMatch.found || descMatch.found || unitMatch.found) {
        const maxScore = Math.max(nameMatch.score, descMatch.score, unitMatch.score);
        results.push({
          id: material.id,
          type: 'material',
          title: material.name,
          subtitle: material.unit || 'No unit',
          description: material.description,
          url: `/materials`,
          icon: Building,
          status: material.status,
          amount: material.cost,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: nameMatch.found ? nameMatch.matchType : 'fuzzy'
        });
      }
    });

    // Enhanced Agents search
    agents.forEach((agent: any) => {
      const nameMatch = searchInText(`${agent.firstName} ${agent.lastName}`, query);
      const emailMatch = searchInText(agent.email, query);
      const phoneMatch = searchInText(agent.phone, query);
      const roleMatch = searchInText(agent.role, query);
      const notesMatch = searchInText(agent.notes, query);
      
      if (nameMatch.found || emailMatch.found || phoneMatch.found || roleMatch.found || notesMatch.found) {
        const maxScore = Math.max(nameMatch.score, emailMatch.score, phoneMatch.score, roleMatch.score, notesMatch.score);
        results.push({
          id: agent.id,
          type: 'agent',
          title: `${agent.firstName} ${agent.lastName}`,
          subtitle: agent.role || agent.email || 'No details',
          description: agent.notes || agent.phone,
          url: `/agents`,
          icon: UserCheck,
          status: agent.isActive ? 'active' : 'inactive',
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: nameMatch.found ? nameMatch.matchType : 'fuzzy'
        });
      }
    });

    // Payments search
    payments.forEach((payment: any) => {
      const methodMatch = searchInText(payment.method, query);
      const notesMatch = searchInText(payment.notes, query);
      
      if (methodMatch.found || notesMatch.found) {
        const maxScore = Math.max(methodMatch.score, notesMatch.score);
        results.push({
          id: payment.id,
          type: 'payment',
          title: `Payment - ${payment.method}`,
          subtitle: `Invoice #${payment.invoiceId}`,
          description: payment.notes,
          url: `/invoices/${payment.invoiceId}`,
          icon: DollarSign,
          date: payment.paymentDate,
          amount: payment.amount,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: methodMatch.found ? methodMatch.matchType : 'fuzzy'
        });
      }
    });

    // Follow-ups search
    followUps.forEach((followUp: any) => {
      const typeMatch = searchInText(followUp.type, query);
      const notesMatch = searchInText(followUp.notes, query);
      
      if (typeMatch.found || notesMatch.found) {
        const maxScore = Math.max(typeMatch.score, notesMatch.score);
        results.push({
          id: followUp.id,
          type: 'followUp',
          title: `Follow-up - ${followUp.type}`,
          subtitle: `Client #${followUp.clientId}`,
          description: followUp.notes,
          url: `/clients/${followUp.clientId}`,
          icon: MessageSquare,
          status: followUp.status,
          date: followUp.scheduledDate,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: typeMatch.found ? typeMatch.matchType : 'fuzzy'
        });
      }
    });

    // Attachments search
    attachments.forEach((attachment: any) => {
      const nameMatch = searchInText(attachment.fileName, query);
      const typeMatch = searchInText(attachment.fileType, query);
      const relatedMatch = searchInText(attachment.relatedType, query);
      
      if (nameMatch.found || typeMatch.found || relatedMatch.found) {
        const maxScore = Math.max(nameMatch.score, typeMatch.score, relatedMatch.score);
        results.push({
          id: attachment.id,
          type: 'attachment',
          title: attachment.fileName,
          subtitle: `${attachment.relatedType} #${attachment.relatedId}`,
          description: attachment.description,
          url: `/${attachment.relatedType}/${attachment.relatedId}`,
          icon: Paperclip,
          date: attachment.createdAt,
          priority: maxScore >= 80 ? 'high' : maxScore >= 60 ? 'medium' : 'low',
          matchType: nameMatch.found ? nameMatch.matchType : 'fuzzy'
        });
      }
    });

    // Sort results by priority and relevance
    return results
      .sort((a, b) => {
        // First by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority || 'low'] || 1) - (priorityOrder[a.priority || 'low'] || 1);
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by match type
        const matchOrder = { exact: 3, partial: 2, fuzzy: 1 };
        const matchDiff = (matchOrder[b.matchType || 'fuzzy'] || 1) - (matchOrder[a.matchType || 'fuzzy'] || 1);
        if (matchDiff !== 0) return matchDiff;
        
        // Finally by date (newer first)
        if (a.date && b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        
        return 0;
      })
      .slice(0, 30); // Increased limit for better results
  };

  const searchResults = transformToSearchResults();

  const handleSelect = (result: SearchResult) => {
    setLocation(result.url);
    setOpen(false);
    setSearchQuery('');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'paid':
      case 'completed':
        return 'bg-green-500';
      case 'pending':
      case 'draft':
      case 'in_progress':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'overdue':
      case 'rejected':
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client': return Users;
      case 'estimate': return FileText;
      case 'invoice': return Receipt;
      case 'project': return Hammer;
      case 'event': return Calendar;
      case 'material': return Building;
      case 'agent': return UserCheck;
      case 'payment': return DollarSign;
      case 'followUp': return MessageSquare;
      case 'attachment': return Paperclip;
      default: return Search;
    }
  };

  // Handle input changes to show results immediately
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show results when typing, hide when empty
    if (value.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchQuery.length > 0) {
      setOpen(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay closing to allow clicking on results
    setTimeout(() => setOpen(false), 200);
  };

  return (
    <div className="flex-1 max-w-lg mx-4 lg:mx-8 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search anything: clients, estimates, projects, materials..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="remodra-input pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setSearchQuery('');
              setOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Results dropdown */}
      {open && searchQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Search className="h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-400 mb-2">No results found for "{searchQuery}"</p>
              <p className="text-sm text-slate-500">Try searching for clients, estimates, projects, materials, or any other data</p>
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs text-slate-400 mb-2 px-2">
                {searchResults.length} results found
              </div>
              {searchResults.map((result) => {
                const IconComponent = result.icon;
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-slate-700 transition-colors rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="relative">
                        <IconComponent className="h-5 w-5 text-slate-400" />
                        {result.priority === 'high' && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-200 truncate">
                            {result.title}
                          </span>
                          {result.status && (
                            <Badge className={cn("text-xs", getStatusColor(result.status))}>
                              {result.status}
                            </Badge>
                          )}
                          {result.priority && (
                            <Badge className={cn("text-xs", getPriorityColor(result.priority))}>
                              {result.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {result.subtitle}
                        </p>
                        {result.description && (
                          <p className="text-xs text-slate-500 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {result.amount && (
                        <span className="text-sm font-medium text-slate-200">
                          {formatAmount(result.amount)}
                        </span>
                      )}
                      {result.date && (
                        <span className="text-xs text-slate-500">
                          {formatDate(result.date)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Quick Actions */}
              <div className="border-t border-slate-600 mt-2 pt-2">
                <div className="text-xs text-slate-400 mb-2 px-2">Quick Actions</div>
                <div className="grid grid-cols-2 gap-1">
                  <div
                    onClick={() => setLocation('/clients')}
                    className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-slate-700 transition-colors rounded text-sm"
                  >
                    <Users className="h-4 w-4" />
                    <span>All Clients</span>
                  </div>
                  <div
                    onClick={() => setLocation('/estimates')}
                    className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-slate-700 transition-colors rounded text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span>All Estimates</span>
                  </div>
                  <div
                    onClick={() => setLocation('/invoices')}
                    className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-slate-700 transition-colors rounded text-sm"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>All Invoices</span>
                  </div>
                  <div
                    onClick={() => setLocation('/projects')}
                    className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-slate-700 transition-colors rounded text-sm"
                  >
                    <Hammer className="h-4 w-4" />
                    <span>All Projects</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 