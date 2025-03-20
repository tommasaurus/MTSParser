"use client";

import { useState, useEffect } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  ComparisonResult,
  DepartmentComparisonResult,
  DepartmentBudgetItem,
  compareDepartments,
} from "@/lib/api";

// Custom icon styling to override defaults
const iconStyles = {
  downloadIcon: {
    width: "1.25rem", // 20px
    height: "1.25rem",
    "@media (minWidth: 640px)": {
      width: "1.5rem", // 24px
      height: "1.5rem",
    },
  },
  statusIcon: {
    width: "1.25rem", // 20px
    height: "1.25rem",
    "@media (minWidth: 640px)": {
      width: "1.5rem", // 24px
      height: "1.5rem",
    },
  },
};

// Tabs for navigation
enum ResultTabs {
  SUMMARY = "summary",
  RECEIPTS = "receipts",
  OUTLAYS = "outlays",
  INSIGHTS = "insights",
}

interface ComparisonResultsProps {
  primaryPeriod: string;
  comparisonPeriod?: string | null;
  comparisonData: ComparisonResult;
}

export function ComparisonResults({
  primaryPeriod,
  comparisonPeriod,
  comparisonData,
}: ComparisonResultsProps) {
  const [activeTab, setActiveTab] = useState<ResultTabs>(ResultTabs.SUMMARY);
  const [departmentData, setDepartmentData] =
    useState<DepartmentComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch department data when the component mounts or when periods change
  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        setIsLoading(true);
        // Extract statement ID from period name (assumes format like "February 2024" -> "mts0224")
        const primaryId = getPeriodId(primaryPeriod);
        const comparisonId = comparisonPeriod
          ? getPeriodId(comparisonPeriod)
          : undefined;

        if (primaryId) {
          const data = await compareDepartments(primaryId, comparisonId);
          setDepartmentData(data);
        }
      } catch (error) {
        console.error("Error fetching department data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentData();
  }, [primaryPeriod, comparisonPeriod]);

  // Helper to convert period name to statement ID
  const getPeriodId = (period: string): string => {
    const parts = period.split(" ");
    if (parts.length !== 2) return "";

    const month = parts[0];
    const year = parts[1];

    const monthMap: Record<string, string> = {
      January: "01",
      February: "02",
      March: "03",
      April: "04",
      May: "05",
      June: "06",
      July: "07",
      August: "08",
      September: "09",
      October: "10",
      November: "11",
      December: "12",
    };

    const monthNum = monthMap[month] || "00";
    const yearShort = year.slice(2);

    return `mts${monthNum}${yearShort}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      signDisplay: "exceptZero",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const isSignificantChange = (percentage: number): boolean => {
    return Math.abs(percentage) >= 5;
  };

  const renderArrow = (value: number) => {
    if (value > 0) {
      return (
        <ArrowUpIcon
          className="inline-block w-3 h-3 mr-1 text-green-400"
          aria-hidden="true"
        />
      );
    } else if (value < 0) {
      return (
        <ArrowDownIcon
          className="inline-block w-3 h-3 mr-1 text-red-400"
          aria-hidden="true"
        />
      );
    }
    return null;
  };

  const getChangeColor = (value: number): string => {
    if (value > 0) {
      return "text-green-400";
    } else if (value < 0) {
      return "text-red-400";
    }
    return "text-slate-200";
  };

  return (
    <div className="mt-12 md:mt-16 animate-fadeIn">
      <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/60 transition-all duration-300 hover:shadow-slate-700/30 hover:border-slate-600/60 overflow-hidden">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 flex items-center">
            <ArrowsRightLeftIcon
              className="w-6 h-6 mr-3 text-blue-400"
              aria-hidden="true"
            />
            Financial Comparison Results
          </h2>

          <div className="flex flex-wrap items-center">
            <div className="bg-blue-500/10 rounded-lg px-3 py-1 text-blue-300 font-medium mr-2 mb-2">
              {primaryPeriod}
            </div>

            {comparisonPeriod && (
              <>
                <div className="text-slate-400 mr-2 mb-2">compared to</div>
                <div className="bg-slate-600/40 rounded-lg px-3 py-1 text-slate-300 font-medium mb-2">
                  {comparisonPeriod}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-slate-700/70">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            <nav className="flex" aria-label="Tabs">
              {Object.values(ResultTabs).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === tab
                      ? "border-blue-400 text-blue-400"
                      : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Summary Tab */}
          {activeTab === ResultTabs.SUMMARY && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-slate-300 text-sm font-medium">
                    Total Receipts
                  </h3>
                  <div className="mt-1 flex justify-between items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {formatCurrency(comparisonData.summary.receipts.current)}
                    </div>
                    {comparisonPeriod && (
                      <div
                        className={`text-sm font-medium ${getChangeColor(
                          comparisonData.summary.receipts.change_percent
                        )}`}
                      >
                        {renderArrow(
                          comparisonData.summary.receipts.change_percent
                        )}
                        {formatPercentage(
                          comparisonData.summary.receipts.change_percent
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-slate-300 text-sm font-medium">
                    Total Outlays
                  </h3>
                  <div className="mt-1 flex justify-between items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {formatCurrency(comparisonData.summary.outlays.current)}
                    </div>
                    {comparisonPeriod && (
                      <div
                        className={`text-sm font-medium ${getChangeColor(
                          comparisonData.summary.outlays.change_percent
                        )}`}
                      >
                        {renderArrow(
                          comparisonData.summary.outlays.change_percent
                        )}
                        {formatPercentage(
                          comparisonData.summary.outlays.change_percent
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-slate-300 text-sm font-medium">
                    Deficit
                  </h3>
                  <div className="mt-1 flex justify-between items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {formatCurrency(comparisonData.summary.deficit.current)}
                    </div>
                    {comparisonPeriod && (
                      <div
                        className={`text-sm font-medium ${getChangeColor(
                          comparisonData.summary.deficit.change_percent
                        )}`}
                      >
                        {renderArrow(
                          comparisonData.summary.deficit.change_percent
                        )}
                        {formatPercentage(
                          comparisonData.summary.deficit.change_percent
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
                  <h3 className="text-slate-300 text-sm font-medium">
                    Total Debt
                  </h3>
                  <div className="mt-1 flex justify-between items-baseline">
                    <div className="text-2xl font-semibold text-white">
                      {formatCurrency(comparisonData.summary.debt.current)}
                    </div>
                    {comparisonPeriod && (
                      <div
                        className={`text-sm font-medium ${getChangeColor(
                          comparisonData.summary.debt.change_percent
                        )}`}
                      >
                        {renderArrow(
                          comparisonData.summary.debt.change_percent
                        )}
                        {formatPercentage(
                          comparisonData.summary.debt.change_percent
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
                <h3 className="text-lg font-medium text-white mb-4">
                  Significant Changes
                </h3>
                <div className="space-y-3">
                  {comparisonData.significant_changes.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-700/50 last:border-b-0"
                    >
                      <div className="mb-1 sm:mb-0">
                        <span className="text-white font-medium">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <span className="text-slate-300">
                          {formatCurrency(item.current)}
                        </span>
                        {item.previous && (
                          <span
                            className={`flex items-center ${getChangeColor(
                              item.change_percent
                            )}`}
                          >
                            {renderArrow(item.change_percent)}
                            {formatPercentage(item.change_percent)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Receipts Tab */}
          {activeTab === ResultTabs.RECEIPTS && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Detailed Receipts
              </h3>
              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800">
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                          {primaryPeriod}
                        </th>
                        {comparisonPeriod && (
                          <th className="text-right px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                            {comparisonPeriod}
                          </th>
                        )}
                        {comparisonPeriod && (
                          <th className="text-right px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Change
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {comparisonData.detailed.receipts.map((item, index) => (
                        <tr
                          key={index}
                          className="bg-slate-900/40 hover:bg-slate-800/60 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-white">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-300">
                            {formatCurrency(item.current)}
                          </td>
                          {comparisonPeriod && item.previous && (
                            <td className="px-4 py-3 text-sm text-right text-slate-400">
                              {formatCurrency(item.previous)}
                            </td>
                          )}
                          {comparisonPeriod && (
                            <td
                              className={`px-4 py-3 text-sm text-right font-medium ${getChangeColor(
                                item.change_percent
                              )}`}
                            >
                              {renderArrow(item.change_percent)}
                              {formatPercentage(item.change_percent)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Outlays Tab */}
          {activeTab === ResultTabs.OUTLAYS && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">
                Detailed Outlays
              </h3>
              <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800">
                        <th className="text-left px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                          {primaryPeriod}
                          <br />
                          (This Month)
                        </th>
                        {comparisonPeriod && (
                          <th className="text-right px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                            {comparisonPeriod}
                            <br />
                            (This Month)
                          </th>
                        )}
                        {comparisonPeriod && (
                          <th className="text-right px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                            Difference
                          </th>
                        )}
                        <th className="text-right px-4 py-3 text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Budget Estimates
                          <br />
                          Full Fiscal Year
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan={comparisonPeriod ? 5 : 3}
                            className="px-4 py-8 text-center text-slate-400"
                          >
                            <div className="inline-block h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Loading department data...
                          </td>
                        </tr>
                      ) : departmentData && departmentData.departments ? (
                        departmentData.departments.map((dept, index) => {
                          // Find the comparison department data if available
                          const comparisonDept =
                            comparisonPeriod &&
                            departmentData.comparison_departments &&
                            departmentData.comparison_departments.find(
                              (d: DepartmentBudgetItem) =>
                                d.department === dept.department
                            );

                          // Calculate difference
                          const difference = comparisonDept
                            ? dept.this_month - comparisonDept.this_month
                            : 0;

                          return (
                            <tr
                              key={index}
                              className="bg-slate-900/40 hover:bg-slate-800/60 transition-colors"
                            >
                              <td className="px-4 py-3 text-sm text-white">
                                {dept.department}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-slate-300">
                                {formatCurrency(dept.this_month)}
                              </td>
                              {comparisonPeriod && (
                                <td className="px-4 py-3 text-sm text-right text-slate-400">
                                  {comparisonDept
                                    ? formatCurrency(comparisonDept.this_month)
                                    : "N/A"}
                                </td>
                              )}
                              {comparisonPeriod && (
                                <td
                                  className={`px-4 py-3 text-sm text-right font-medium ${getChangeColor(
                                    difference
                                  )}`}
                                >
                                  {comparisonDept ? (
                                    <>
                                      {difference > 0 && "+"}
                                      {formatCurrency(difference)}
                                    </>
                                  ) : (
                                    "N/A"
                                  )}
                                </td>
                              )}
                              <td className="px-4 py-3 text-sm text-right text-slate-300">
                                {formatCurrency(dept.budget_estimate)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={comparisonPeriod ? 5 : 3}
                            className="px-4 py-8 text-center text-slate-400"
                          >
                            No department data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === ResultTabs.INSIGHTS && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Insights</h3>
              <div className="space-y-4">
                {comparisonData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border backdrop-blur-sm ${
                      insight.type === "warning"
                        ? "bg-red-900/20 border-red-700/50 text-red-200"
                        : "bg-blue-900/20 border-blue-700/50 text-blue-200"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        {insight.type === "warning" ? (
                          <ExclamationCircleIcon
                            style={iconStyles.statusIcon}
                            className="text-red-400"
                          />
                        ) : (
                          <CheckCircleIcon
                            style={iconStyles.statusIcon}
                            className="text-blue-400"
                          />
                        )}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium">
                          {insight.message}
                        </h4>
                        {insight.description && (
                          <p className="mt-1 text-xs opacity-90">
                            {insight.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
