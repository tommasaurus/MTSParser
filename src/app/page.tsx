"use client";

import { useState } from "react";
import {
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { SelectMenu } from "@/components/SelectMenu";
import { ComparisonResults } from "@/components/ComparisonResults";

// Custom icon styling to override defaults
const iconStyles = {
  document: {
    width: "1.25rem", // 20px
    height: "1.25rem",
    "@media (minWidth: 640px)": {
      width: "1.5rem", // 24px
      height: "1.5rem",
    },
    "@media (minWidth: 768px)": {
      width: "2rem", // 32px
      height: "2rem",
    },
  },
  chart: {
    width: "1.25rem", // 20px
    height: "1.25rem",
    "@media (minWidth: 640px)": {
      width: "1.5rem", // 24px
      height: "1.5rem",
    },
    "@media (minWidth: 768px)": {
      width: "2rem", // 32px
      height: "2rem",
    },
  },
  arrow: {
    width: "0.875rem", // 14px
    height: "0.875rem",
    "@media (minWidth: 640px)": {
      width: "1rem", // 16px
      height: "1rem",
    },
  },
};

// Sample period options
const periodOptions = [
  { id: "mar-2025", name: "March 2025" },
  { id: "feb-2025", name: "February 2025" },
  { id: "jan-2025", name: "January 2025" },
  { id: "dec-2024", name: "December 2024" },
  { id: "nov-2024", name: "November 2024" },
  { id: "oct-2024", name: "October 2024" },
  { id: "sep-2024", name: "September 2024" },
  { id: "aug-2024", name: "August 2024" },
  { id: "jul-2024", name: "July 2024" },
  { id: "jun-2024", name: "June 2024" },
  { id: "may-2024", name: "May 2024" },
  { id: "apr-2024", name: "April 2024" },
  { id: "mar-2024", name: "March 2024" },
  { id: "feb-2024", name: "February 2024" },
  { id: "jan-2024", name: "January 2024" },
];

// Use the same options for comparison dropdown
const comparisonOptions = [...periodOptions];

export default function Home() {
  const [primaryPeriod, setPrimaryPeriod] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleCompare = () => {
    if (!primaryPeriod) return;

    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 pb-20">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
        <header className="mb-8 md:mb-12 pt-6 md:pt-10 text-center">
          <div className="inline-flex items-center justify-center mb-4 p-3 rounded-full bg-slate-800/60 shadow-lg backdrop-blur-sm">
            <DocumentTextIcon
              style={iconStyles.document}
              className="text-blue-400"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            Treasury Statement Parser
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Compare financial data from Monthly Treasury Statements to track
            government spending and receipts over time.
          </p>
        </header>

        <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/60 transition-all duration-300 hover:shadow-slate-700/30 hover:border-slate-600/60">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-8 flex items-center">
              <span className="inline-block w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mr-3 text-sm">
                1
              </span>
              Select Treasury Statement Periods
            </h2>

            <div className="space-y-8">
              <SelectMenu
                label="Primary Period"
                options={periodOptions}
                value={primaryPeriod}
                onChange={setPrimaryPeriod}
                placeholder="Select primary period..."
              />

              <SelectMenu
                label="Comparison Period"
                options={comparisonOptions}
                value={comparisonPeriod}
                onChange={setComparisonPeriod}
                optional={true}
                placeholder="Select period to compare with..."
              />
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4">
            <button
              onClick={handleCompare}
              disabled={!primaryPeriod || isLoading}
              className={`w-full flex items-center justify-center py-3 sm:py-4 px-4 rounded-xl text-sm sm:text-base text-white font-medium transition-all duration-300 ${
                primaryPeriod && !isLoading
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5"
                  : "bg-slate-600/60 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ArrowsRightLeftIcon
                    style={iconStyles.arrow}
                    className="text-white mr-2"
                  />
                  Compare Statements
                </>
              )}
            </button>
          </div>
        </div>

        {showResults && primaryPeriod && (
          <ComparisonResults
            primaryPeriod={primaryPeriod.name}
            comparisonPeriod={comparisonPeriod?.name}
          />
        )}

        {!showResults && (
          <div className="mt-10 md:mt-16 text-center">
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center justify-center p-4 w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full shadow-xl border border-slate-700/50 mb-6 transform rotate-12 hover:rotate-0 transition-all duration-300">
                <ChartBarIcon
                  style={iconStyles.chart}
                  className="text-blue-400"
                />
              </div>
              <div className="p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 max-w-md mx-auto shadow-lg">
                <h3 className="text-lg font-medium text-white mb-2">
                  Ready to analyze data
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Select a period above to analyze Treasury data. You'll see key
                  metrics, trends, and detailed breakdowns of government
                  finances.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
