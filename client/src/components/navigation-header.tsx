import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavigationHeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function NavigationHeader({ searchValue = "", onSearchChange }: NavigationHeaderProps) {
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
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-blue-200" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <span className="text-sm">John Smith</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
