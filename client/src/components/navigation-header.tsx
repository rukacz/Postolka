import { Search, ChevronDown, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationHeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function NavigationHeader({ searchValue = "", onSearchChange }: NavigationHeaderProps) {
  const { user, logout } = useAuth();

  const getOrgRoleBadgeColor = (roleName?: string) => {
    switch (roleName) {
      case 'Admin':
        return 'bg-red-600';
      case 'MSC':
        return 'bg-blue-600';
      case 'Client':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getOrderTypeText = (orderTypeRole: string | null) => {
    if (!orderTypeRole) return 'Import/Export';
    return orderTypeRole === 'import_only' ? 'Import Only' : 'Export Only';
  };

  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Poštolka</h1>
            <span className="text-blue-200 text-sm">Logistics Management</span>
          </div>
          
          {/* Global Search */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search BL, Container, Client, City, Train..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-blue-600 border border-blue-500 text-white placeholder:text-blue-200 focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                data-testid="input-global-search"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-blue-200" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Info and Role Badges */}
            {user && (
              <div className="flex items-center space-x-2">
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getOrgRoleBadgeColor(user?.roleName)} text-white`}>
                      {user?.roleName?.toUpperCase() || 'USER'}
                    </Badge>
                    {user?.defaultCarrier && (
                      <Badge variant="outline" className="text-xs">
                        {user.defaultCarrier}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-blue-200">
                    {getOrderTypeText(user.orderTypeRole)}
                  </span>
                </div>
              </div>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 text-white hover:bg-blue-600" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-700 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user?.name || 'Guest'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span>{user?.name}</span>
                    <span className="text-xs text-muted-foreground">@{user?.username}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
