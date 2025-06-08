import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, X, Store, Heart, MapPin, Shield, Home, Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import SearchWithSuggestions from "@/components/SearchWithSuggestions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { cartItems } = useCart();

  const cartItemCount = cartItems?.length || 0;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Store className="h-6 w-6" />
            <span className="text-xl font-bold">Siraha Bazaar</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            <Link href="/" className="flex items-center space-x-1 hover:text-accent transition-colors">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link href="/products" className="flex items-center space-x-1 hover:text-accent transition-colors">
              <Package className="h-4 w-4" />
              <span>Products</span>
            </Link>
            <Link href="/stores" className="flex items-center space-x-1 hover:text-accent transition-colors">
              <Store className="h-4 w-4" />
              <span>Store</span>
            </Link>
            <Link href="/store-maps" className="flex items-center space-x-1 hover:text-accent transition-colors">
              <MapPin className="h-4 w-4" />
              <span>Store Map</span>
            </Link>
            {user && (
              <Link href="/customer-dashboard" className="flex items-center space-x-1 hover:text-accent transition-colors">
                <User className="h-4 w-4" />
                <span>Account</span>
              </Link>
            )}
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex max-w-sm mx-4">
            <SearchWithSuggestions placeholder="Search products and stores..." />
          </div>

          {/* Top Action Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative hover:text-accent transition-colors p-2">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" className="hover:text-accent transition-colors p-2">
              <Heart className="h-5 w-5" />
            </Link>

            {/* User Menu or Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white hover:text-accent p-2">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/customer-dashboard" className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "shopkeeper" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/shopkeeper-dashboard" className="cursor-pointer">
                            <Store className="h-4 w-4 mr-2" />
                            Seller Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-accent p-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:text-accent">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Action Icons */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Cart */}
            <Link href="/cart" className="relative hover:text-accent transition-colors p-1">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" className="hover:text-accent transition-colors p-1">
              <Heart className="h-5 w-5" />
            </Link>

            {user ? (
              <>
                {/* Seller Dashboard */}
                {user.role === "shopkeeper" && (
                  <Link href="/shopkeeper-dashboard" className="hover:text-accent transition-colors p-1">
                    <Store className="h-5 w-5" />
                  </Link>
                )}

                {/* Admin Panel */}
                <Link href="/admin" className="hover:text-accent transition-colors p-1">
                  <Shield className="h-5 w-5" />
                </Link>

                {/* Logout */}
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-accent p-1"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link href="/login" className="hover:text-accent transition-colors p-1">
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <SearchWithSuggestions placeholder="Search products, stores..." />
        </div>
      </div>


    </nav>
  );
}
