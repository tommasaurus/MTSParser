"use client";

import { useState, useRef, useEffect } from "react";

// Available periods for demonstration - we'd have more in a real app
const availablePeriods = [
  { label: "February 2024", value: "feb2024" },
  { label: "January 2024", value: "jan2024" },
  { label: "December 2023", value: "dec2023" },
  { label: "November 2023", value: "nov2023" },
  { label: "October 2023", value: "oct2023" },
  { label: "September 2023", value: "sep2023" },
  { label: "August 2023", value: "aug2023" },
  { label: "July 2023", value: "jul2023" },
  { label: "June 2023", value: "jun2023" },
  { label: "May 2023", value: "may2023" },
  { label: "April 2023", value: "apr2023" },
  { label: "March 2023", value: "mar2023" },
];

// Autocomplete component for period selection
function PeriodSelector({
  value,
  onChange,
  exclude = [],
  placeholder = "Select a period...",
}: {
  value: string;
  onChange: (value: string) => void;
  exclude?: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedPeriod = availablePeriods.find((p) => p.value === value);
  const filteredPeriods = availablePeriods
    .filter((p) => !exclude.includes(p.value))
    .filter((p) => p.label.toLowerCase().includes(searchTerm.toLowerCase()));

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className="border rounded p-2 flex items-center justify-between cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedPeriod ? "" : "text-gray-400"}>
          {selectedPeriod ? selectedPeriod.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Search periods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            {filteredPeriods.length > 0 ? (
              filteredPeriods.map((period) => (
                <li
                  key={period.value}
                  className={`px-4 py-2 hover:bg-blue-50 cursor-pointer ${
                    period.value === value ? "bg-blue-100" : ""
                  }`}
                  onClick={() => {
                    onChange(period.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {period.label}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No periods found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [primaryPeriod, setPrimaryPeriod] = useState<string>("");
  const [comparisonPeriod, setComparisonPeriod] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [comparisonResults, setComparisonResults] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryPeriod) return;

    setLoading(true);

    try {
      // Fetch data based on selected periods
      const response = await fetch("/api/fetch-treasury-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryPeriod,
          comparisonPeriod: comparisonPeriod || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Error retrieving treasury data");
      }

      const data = await response.json();
      setResults(data.mainResults);
      if (data.comparisonResults) {
        setComparisonResults(data.comparisonResults);
      } else {
        setComparisonResults(null);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while retrieving treasury data.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!results) return;

    // Simple CSV generation
    const headers =
      "Category,This Month,Current Fiscal Year to Date,Comparable Prior Period,Budget Estimates\n";

    const rows = Object.entries(results)
      .map(([category, values]: [string, any]) => {
        return `"${category}",${values.thisMonth || ""},${
          values.fiscalYearToDate || ""
        },${values.priorPeriod || ""},${values.budgetEstimates || ""}`;
      })
      .join("\n");

    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "treasury_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-50">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Treasury Statement Parser</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">
            Select Treasury Statement Periods
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Period
              </label>
              <PeriodSelector
                value={primaryPeriod}
                onChange={setPrimaryPeriod}
                placeholder="Select primary period..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comparison Period (Optional)
              </label>
              <PeriodSelector
                value={comparisonPeriod}
                onChange={setComparisonPeriod}
                exclude={[primaryPeriod]}
                placeholder="Select period to compare with..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !primaryPeriod}
              className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
                loading || !primaryPeriod
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Compare Statements"
              )}
            </button>
          </form>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {availablePeriods.find((p) => p.value === primaryPeriod)
                  ?.label || "Primary Period"}{" "}
                Data
              </h2>
              <button
                onClick={downloadCSV}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Category</th>
                    <th className="border p-2 text-right">This Month</th>
                    <th className="border p-2 text-right">
                      Current Fiscal Year to Date
                    </th>
                    <th className="border p-2 text-right">
                      Comparable Prior Period
                    </th>
                    <th className="border p-2 text-right">Budget Estimates</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results).map(
                    ([category, values]: [string, any], index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : ""}
                      >
                        <td className="border p-2">{category}</td>
                        <td className="border p-2 text-right">
                          {values.thisMonth}
                        </td>
                        <td className="border p-2 text-right">
                          {values.fiscalYearToDate}
                        </td>
                        <td className="border p-2 text-right">
                          {values.priorPeriod}
                        </td>
                        <td className="border p-2 text-right">
                          {values.budgetEstimates}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {results && comparisonResults && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Comparison:{" "}
              {availablePeriods.find((p) => p.value === primaryPeriod)?.label ||
                "Primary"}{" "}
              vs{" "}
              {availablePeriods.find((p) => p.value === comparisonPeriod)
                ?.label || "Comparison"}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Category</th>
                    <th className="border p-2 text-right">
                      {availablePeriods.find((p) => p.value === primaryPeriod)
                        ?.label || "Primary"}
                    </th>
                    <th className="border p-2 text-right">
                      {availablePeriods.find(
                        (p) => p.value === comparisonPeriod
                      )?.label || "Comparison"}
                    </th>
                    <th className="border p-2 text-right">Difference</th>
                    <th className="border p-2 text-right">% Change</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results).map(
                    ([category, values]: [string, any], index) => {
                      const comparisonValue =
                        comparisonResults[category]?.thisMonth || 0;
                      const primaryValue = values.thisMonth || 0;
                      const difference = primaryValue - comparisonValue;
                      const percentChange =
                        comparisonValue !== 0
                          ? ((difference / comparisonValue) * 100).toFixed(2)
                          : "N/A";

                      return (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-gray-50" : ""}
                        >
                          <td className="border p-2">{category}</td>
                          <td className="border p-2 text-right">
                            {primaryValue}
                          </td>
                          <td className="border p-2 text-right">
                            {comparisonValue}
                          </td>
                          <td className="border p-2 text-right">
                            {difference}
                          </td>
                          <td className="border p-2 text-right">
                            {percentChange}%
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
