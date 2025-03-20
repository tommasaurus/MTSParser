"use client";

import { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { SelectMenu } from "@/components/SelectMenu";
import { ComparisonResults } from "@/components/ComparisonResults";
import {
  getStatements,
  processStatement,
  compareStatements,
  StatementMetadata,
  ComparisonResult,
} from "@/lib/api";

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

export default function Home() {
  // Statement data state
  const [statements, setStatements] = useState<StatementMetadata[]>([]);
  const [isLoadingStatements, setIsLoadingStatements] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Period selection state
  const [primaryPeriod, setPrimaryPeriod] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Comparison results state
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(
    null
  );

  // Fetch statements on initial load
  useEffect(() => {
    async function fetchStatements() {
      setIsLoadingStatements(true);
      setError(null);
      try {
        const data = await getStatements();
        setStatements(data);

        // Only show processed statements in the dropdown
        const processedStatements = data.filter(
          (statement) => statement.processed
        );
        if (processedStatements.length === 0) {
          // Start processing unprocessed statements
          const unprocessedStatements = data.filter(
            (statement) => !statement.processed
          );
          if (unprocessedStatements.length > 0) {
            console.log(
              `Processing statement: ${unprocessedStatements[0].filename}`
            );
            await processStatement(unprocessedStatements[0].filename);
          }
        }
      } catch (err) {
        setError("Error loading statements. Please try again.");
        console.error("Error fetching statements:", err);
      } finally {
        setIsLoadingStatements(false);
      }
    }

    fetchStatements();
  }, []);

  // Convert statements to options for the dropdown
  const statementOptions = statements
    .filter((statement) => statement.processed)
    .map((statement) => ({
      id: statement.filename.replace(".pdf", ""),
      name: `${statement.month} ${statement.year}`,
    }));

  // Handle comparison button click
  const handleCompare = async () => {
    if (!primaryPeriod) return;

    setIsLoading(true);
    setError(null);

    try {
      // Make API call to compare statements
      const result = await compareStatements(
        primaryPeriod.id,
        comparisonPeriod?.id
      );

      setComparisonData(result);
      setShowResults(true);
    } catch (err) {
      setError("Error comparing statements. Please try again.");
      console.error("Error comparing statements:", err);
    } finally {
      setIsLoading(false);
    }
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

        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700/60 transition-all duration-300 hover:shadow-slate-700/30 hover:border-slate-600/60">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-8 flex items-center">
              <span className="inline-block w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mr-3 text-sm">
                1
              </span>
              Select Treasury Statement Periods
            </h2>

            <div className="space-y-8">
              {isLoadingStatements ? (
                <div className="py-4 text-center text-slate-400">
                  <div className="inline-block h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Loading statements...
                </div>
              ) : (
                <>
                  {statementOptions.length === 0 ? (
                    <div className="py-4 text-center text-slate-400">
                      No processed statements available. Please check back
                      later.
                    </div>
                  ) : (
                    <>
                      <SelectMenu
                        label="Primary Period"
                        options={statementOptions}
                        value={primaryPeriod}
                        onChange={setPrimaryPeriod}
                        placeholder="Select primary period..."
                      />

                      <SelectMenu
                        label="Comparison Period"
                        options={statementOptions}
                        value={comparisonPeriod}
                        onChange={setComparisonPeriod}
                        optional={true}
                        placeholder="Select period to compare with..."
                      />
                    </>
                  )}
                </>
              )}
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

        {showResults && primaryPeriod && comparisonData && (
          <ComparisonResults
            primaryPeriod={comparisonData.primary_period}
            comparisonPeriod={comparisonData.comparison_period}
            comparisonData={comparisonData}
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
