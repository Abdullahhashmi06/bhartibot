"use client";

import { useState, useEffect } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type FilterState = {
  search: string;
  tab: "Active" | "Archived" | "All";
  status: "" | "draft" | "published" | "closed";
  department: string;
  location: string;
  workMode: string;
  sortBy: "Newest" | "Oldest" | "Most Applications" | "Highest AI Score";
};

interface InternshipFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  departments: string[];
  locations: string[];
}

export default function InternshipFilters({ filters, setFilters, departments, locations }: InternshipFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  // Local state for debounced search
  const [searchTerm, setSearchTerm] = useState(filters.search);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, setFilters]);

  return (
    <div className="space-y-4">
      {/* Top Row: Search and Primary Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          {["Active", "Archived", "All"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilters({ ...filters, tab: tab as any })}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                filters.tab === tab 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Filter Toggle */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search roles, tags, requirements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-all ${
              showFilters 
                ? "bg-teal-light text-teal-dark border-teal/30" 
                : "bg-white border-border text-text-secondary hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Expandable Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white border border-border rounded-2xl shadow-sm flex flex-wrap gap-4">
              
              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Department</label>
                <select 
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Location</label>
                <select 
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal"
                >
                  <option value="">All Locations</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Work Mode</label>
                <select 
                  value={filters.workMode}
                  onChange={(e) => setFilters({...filters, workMode: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal"
                >
                  <option value="">All Modes</option>
                  <option value="on-site">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sort By</label>
                <select 
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-teal"
                >
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Most Applications">Most Applications</option>
                  <option value="Highest AI Score">Highest AI Score</option>
                </select>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
