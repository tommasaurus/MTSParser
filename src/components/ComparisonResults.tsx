"use client";

import { useState } from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/solid";

// Custom icon styling to override defaults
const iconStyles = {
  downloadIcon: {
    width: "0.75rem", // 12px
    height: "0.75rem",
    "@media (minWidth: 640px)": {
      width: "0.875rem", // 14px
      height: "0.875rem",
    },
  },
  statusIcon: {
    width: "0.75rem", // 12px
    height: "0.75rem",
    "@media (minWidth: 640px)": {
      width: "0.875rem", // 14px
      height: "0.875rem",
    },
  },
};

interface ComparisonResultsProps {
  primaryPeriod: string;
  comparisonPeriod?: string;
}

export function ComparisonResults({
  primaryPeriod,
  comparisonPeriod,
}: ComparisonResultsProps) {
  const [activeTab, setActiveTab] = useState("summary");

  // This would be real data in your implementation
  const mockData = {
    totalReceipts: {
      primary: 171134,
      comparison: comparisonPeriod ? 162500 : null,
      change: comparisonPeriod ? 5.3 : null,
    },
    totalOutlays: {
      primary: 480000,
      comparison: comparisonPeriod ? 475000 : null,
      change: comparisonPeriod ? 1.1 : null,
    },
    deficit: {
      primary: 308866,
      comparison: comparisonPeriod ? 312500 : null,
      change: comparisonPeriod ? -1.2 : null,
    },
  };

  // Mock budget outlays data with departments and estimated full fiscal year
  const outlaysData = [
    {
      department: "Health and Human Services",
      thisMonth: 144219,
      fiscalYearToDate: 667090,
      budgetEstimate: 1710722,
      change: 3.9,
    },
    {
      department: "Defense",
      thisMonth: 61335,
      fiscalYearToDate: 344113,
      budgetEstimate: 842565,
      change: 1.2,
    },
    {
      department: "Treasury",
      thisMonth: 76162,
      fiscalYearToDate: 433369,
      budgetEstimate: 1002503,
      change: 2.5,
    },
    {
      department: "Education",
      thisMonth: 13898,
      fiscalYearToDate: 71003,
      budgetEstimate: 183694,
      change: -0.8,
    },
    {
      department: "Veterans Affairs",
      thisMonth: 27217,
      fiscalYearToDate: 122076,
      budgetEstimate: 324204,
      change: 5.2,
    },
    {
      department: "Transportation",
      thisMonth: 8127,
      fiscalYearToDate: 42553,
      budgetEstimate: 125315,
      change: 0.3,
    },
    {
      department: "Agriculture",
      thisMonth: 16819,
      fiscalYearToDate: 97023,
      budgetEstimate: 212284,
      change: -3.1,
    },
    {
      department: "Homeland Security",
      thisMonth: 7070,
      fiscalYearToDate: 35781,
      budgetEstimate: 99793,
      change: 4.6,
    },
    {
      department: "Total Outlays",
      thisMonth: 480000,
      fiscalYearToDate: 2335842,
      budgetEstimate: 6527558,
      change: 1.1,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="mt-10 md:mt-12 bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/60 overflow-hidden transition-transform duration-500 animate-fadeIn">
      <div className="border-b border-slate-700/60">
        <div className="flex">
          <button
            className={`relative px-5 sm:px-8 py-4 sm:py-5 font-medium text-sm focus:outline-none transition-all duration-200 ${
              activeTab === "summary"
                ? "text-white"
                : "text-slate-400 hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
            {activeTab === "summary" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-blue-400"></span>
            )}
          </button>
          <button
            className={`relative px-5 sm:px-8 py-4 sm:py-5 font-medium text-sm focus:outline-none transition-all duration-200 ${
              activeTab === "details"
                ? "text-white"
                : "text-slate-400 hover:text-slate-300"
            }`}
            onClick={() => setActiveTab("details")}
          >
            Detailed Breakdown
            {activeTab === "details" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-blue-400"></span>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {activeTab === "summary" ? (
          <>
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-3 md:mb-0">
                {primaryPeriod}{" "}
                {comparisonPeriod && <span className="text-slate-400">vs</span>}{" "}
                {comparisonPeriod && comparisonPeriod}
              </h3>
              <button className="bg-slate-700/80 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none flex items-center text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                <DocumentArrowDownIcon
                  style={iconStyles.downloadIcon}
                  className="mr-2 text-blue-300"
                />
                Download CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Object.entries(mockData).map(([key, data]) => (
                <div
                  key={key}
                  className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-slate-600/80"
                >
                  <h4 className="text-sm font-medium text-blue-400 uppercase mb-2">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </h4>
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {formatCurrency(data.primary)}
                  </p>

                  {data.change !== null && (
                    <div className="mt-2 flex items-center bg-slate-900/50 rounded-lg py-1.5 px-2 w-fit">
                      {data.change > 0 ? (
                        <ArrowUpIcon
                          style={iconStyles.statusIcon}
                          className="text-green-400 mr-1.5"
                        />
                      ) : data.change < 0 ? (
                        <ArrowDownIcon
                          style={iconStyles.statusIcon}
                          className="text-red-400 mr-1.5"
                        />
                      ) : (
                        <MinusIcon
                          style={iconStyles.statusIcon}
                          className="text-slate-400 mr-1.5"
                        />
                      )}
                      <span className="text-xs sm:text-sm text-slate-300">
                        <span
                          className={`${
                            data.change > 0
                              ? "text-green-400"
                              : data.change < 0
                              ? "text-red-400"
                              : "text-slate-400"
                          } font-semibold`}
                        >
                          {Math.abs(data.change).toFixed(1)}%
                        </span>{" "}
                        {data.change > 0
                          ? "increase"
                          : data.change < 0
                          ? "decrease"
                          : "change"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-3 md:mb-0">
                {primaryPeriod}{" "}
                {comparisonPeriod && <span className="text-slate-400">vs</span>}{" "}
                {comparisonPeriod && comparisonPeriod}
              </h3>
              <button className="bg-slate-700/80 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none flex items-center text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                <DocumentArrowDownIcon
                  style={iconStyles.downloadIcon}
                  className="mr-2 text-blue-300"
                />
                Download CSV
              </button>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="bg-blue-500/20 w-6 h-6 rounded-full flex items-center justify-center text-blue-400 mr-2 text-xs">
                  1
                </span>
                Budget Outlays
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-700/60 shadow-md">
                <table className="min-w-full divide-y divide-slate-700/60">
                  <thead>
                    <tr className="bg-slate-800/90">
                      <th className="px-4 py-3.5 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        This Month
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Budget Estimates
                        <br />
                        Full Fiscal Year
                      </th>
                      <th className="px-4 py-3.5 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800/60 backdrop-blur-sm divide-y divide-slate-700/40">
                    {outlaysData.map((item, index) => (
                      <tr
                        key={index}
                        className={`${
                          item.department === "Total Outlays"
                            ? "bg-slate-700/50 hover:bg-slate-700/60"
                            : "hover:bg-slate-700/40"
                        } transition-colors duration-150`}
                      >
                        <td
                          className={`px-4 py-3.5 text-sm ${
                            item.department === "Total Outlays"
                              ? "font-medium text-white"
                              : "text-slate-300"
                          }`}
                        >
                          {item.department}
                        </td>
                        <td
                          className={`px-4 py-3.5 text-sm text-right ${
                            item.department === "Total Outlays"
                              ? "font-medium text-white"
                              : "text-slate-300"
                          }`}
                        >
                          {formatCurrency(item.thisMonth)}
                        </td>
                        <td
                          className={`px-4 py-3.5 text-sm text-right ${
                            item.department === "Total Outlays"
                              ? "font-medium text-white"
                              : "text-slate-300"
                          }`}
                        >
                          {formatCurrency(item.budgetEstimate)}
                        </td>
                        <td
                          className={`px-4 py-3.5 text-sm text-right font-medium ${
                            item.change > 0
                              ? "text-green-400"
                              : item.change < 0
                              ? "text-red-400"
                              : "text-slate-400"
                          }`}
                        >
                          {item.change > 0 ? "+" : ""}
                          {item.change}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
