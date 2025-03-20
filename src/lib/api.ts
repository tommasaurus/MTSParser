/**
 * API client for the Treasury Statement Parser backend.
 */

// API endpoint URLs
const API_ENDPOINT = "http://localhost:8000/api";

// Interfaces for API responses
export interface StatementMetadata {
  filename: string;
  month: string;
  year: string;
  processed: boolean;
  date_added: string;
}

interface BudgetItem {
  current: number;
  previous?: number;
  change_percent: number;
}

interface BudgetDetailItem {
  category: string;
  current: number;
  previous?: number;
  change_percent: number;
  budget_estimate?: number;
}

export interface DepartmentBudgetItem {
  department: string;
  this_month: number;
  fiscal_year_to_date: number;
  prior_period: number;
  budget_estimate: number;
  ratio_percentage: number; // This month as percentage of budget estimate
}

export interface DepartmentComparisonResult {
  primary_period: string;
  comparison_period?: string;
  departments: DepartmentBudgetItem[];
  top_departments: DepartmentBudgetItem[];
  bottom_departments: DepartmentBudgetItem[];
  comparison_departments?: DepartmentBudgetItem[]; // Departments from comparison period
}

interface Insight {
  type: "info" | "warning";
  message: string;
  description?: string;
}

export interface ComparisonResult {
  primary_period: string;
  comparison_period?: string;
  summary: {
    receipts: BudgetItem;
    outlays: BudgetItem;
    deficit: BudgetItem;
    debt: BudgetItem;
  };
  detailed: {
    receipts: BudgetDetailItem[];
    outlays: BudgetDetailItem[];
  };
  significant_changes: BudgetDetailItem[];
  insights: Insight[];
}

/**
 * Fetch the list of available Treasury statements
 */
export async function getStatements(): Promise<StatementMetadata[]> {
  try {
    const response = await fetch(`${API_ENDPOINT}/statements`);

    if (!response.ok) {
      throw new Error(`Error fetching statements: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching statements:", error);
    // Return mock data during development
    return getMockStatements();
  }
}

/**
 * Process a PDF statement to extract data
 */
export async function processStatement(filename: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_ENDPOINT}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
      throw new Error(`Error processing statement: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error processing statement:", error);
    return false;
  }
}

/**
 * Compare two Treasury statements and get the results
 */
export async function compareStatements(
  primaryPeriod: string,
  comparisonPeriod?: string
): Promise<ComparisonResult> {
  try {
    const url = new URL(`${API_ENDPOINT}/compare`);
    url.searchParams.append("primary", primaryPeriod);

    if (comparisonPeriod) {
      url.searchParams.append("comparison", comparisonPeriod);
    }

    console.log(`Fetching comparison data from API: ${url.toString()}`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(
        `Error comparing statements: ${response.statusText} (${response.status})`
      );
    }

    const data = await response.json();
    console.log("Successfully retrieved real comparison data from API");
    return data;
  } catch (error) {
    console.error("Error comparing statements:", error);
    console.warn("Falling back to mock comparison data for development");
    // Return mock data during development
    return getMockComparisonResult(primaryPeriod, comparisonPeriod);
  }
}

/**
 * Compare department budget data across Treasury statements
 */
export async function compareDepartments(
  primaryPeriod: string,
  comparisonPeriod?: string
): Promise<DepartmentComparisonResult> {
  try {
    const url = new URL(`${API_ENDPOINT}/departments`);
    url.searchParams.append("primary", primaryPeriod);

    if (comparisonPeriod) {
      url.searchParams.append("comparison", comparisonPeriod);
    }

    console.log(`Fetching department data from API: ${url.toString()}`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      throw new Error(
        `Error comparing departments: ${response.statusText} (${response.status})`
      );
    }

    const data = await response.json();
    console.log("Successfully retrieved real department data from API");
    return data;
  } catch (error) {
    console.error("Error comparing departments:", error);
    console.warn("Falling back to mock department data for development");
    // Return mock data during development
    return getMockDepartmentComparison(primaryPeriod, comparisonPeriod);
  }
}

/**
 * Format a currency amount for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a percentage for display
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

// Mock data for development purposes
function getMockStatements(): StatementMetadata[] {
  return [
    {
      filename: "mts0224.pdf",
      month: "February",
      year: "2024",
      processed: true,
      date_added: "2024-03-15T10:30:45Z",
    },
    {
      filename: "mts0225.pdf",
      month: "February",
      year: "2025",
      processed: true,
      date_added: "2025-03-15T09:15:30Z",
    },
  ];
}

// Mock department comparison data for development
function getMockDepartmentComparison(
  primaryPeriod: string,
  comparisonPeriod?: string
): DepartmentComparisonResult {
  // Extract month and year for display
  const primaryMatch = primaryPeriod.match(/mts(\d{2})(\d{2})/);
  const primaryMonth = primaryMatch
    ? getMonthName(parseInt(primaryMatch[1]))
    : "February";
  const primaryYear = primaryMatch ? `20${primaryMatch[2]}` : "2025";

  let comparisonMonth, comparisonYear;
  if (comparisonPeriod) {
    const comparisonMatch = comparisonPeriod.match(/mts(\d{2})(\d{2})/);
    comparisonMonth = comparisonMatch
      ? getMonthName(parseInt(comparisonMatch[1]))
      : "February";
    comparisonYear = comparisonMatch ? `20${comparisonMatch[2]}` : "2024";
  }

  // Create mock department data
  const departmentData: DepartmentBudgetItem[] = [
    {
      department: "Health and Human Services",
      this_month: 146782000000,
      fiscal_year_to_date: 634280000000,
      prior_period: 140219000000,
      budget_estimate: 1710722000000,
      ratio_percentage: 8.58,
    },
    {
      department: "Social Security Administration",
      this_month: 126300000000,
      fiscal_year_to_date: 548920000000,
      prior_period: 107682000000,
      budget_estimate: 1518317000000,
      ratio_percentage: 8.32,
    },
    {
      department: "Department of Veterans Affairs",
      this_month: 27200000000,
      fiscal_year_to_date: 142830000000,
      prior_period: 23942000000,
      budget_estimate: 324204000000,
      ratio_percentage: 8.39,
    },
    {
      department: "Department of State",
      this_month: 3000000000,
      fiscal_year_to_date: 12724000000,
      prior_period: 2720000000,
      budget_estimate: 36800000000,
      ratio_percentage: 8.15,
    },
    {
      department: "Department of Education",
      this_month: 13700000000,
      fiscal_year_to_date: 78524000000,
      prior_period: 12900000000,
      budget_estimate: 183694000000,
      ratio_percentage: 7.46,
    },
    {
      department: "Department of Agriculture",
      this_month: 16800000000,
      fiscal_year_to_date: 97023000000,
      prior_period: 15800000000,
      budget_estimate: 232584000000,
      ratio_percentage: 7.22,
    },
    {
      department: "Legislative Branch",
      this_month: 599000000,
      fiscal_year_to_date: 2430000000,
      prior_period: 524000000,
      budget_estimate: 7400000000,
      ratio_percentage: 8.09,
    },
    {
      department: "Department of Homeland Security",
      this_month: 7100000000,
      fiscal_year_to_date: 35781000000,
      prior_period: 6700000000,
      budget_estimate: 99793000000,
      ratio_percentage: 7.11,
    },
    {
      department: "Judicial Branch",
      this_month: 720000000,
      fiscal_year_to_date: 3200000000,
      prior_period: 680000000,
      budget_estimate: 10200000000,
      ratio_percentage: 7.06,
    },
    {
      department: "Department of Labor",
      this_month: 5300000000,
      fiscal_year_to_date: 23420000000,
      prior_period: 5000000000,
      budget_estimate: 76600000000,
      ratio_percentage: 6.92,
    },
  ];

  // Create comparison department data with different values
  const comparisonDepartmentData: DepartmentBudgetItem[] = comparisonPeriod
    ? [
        {
          department: "Health and Human Services",
          this_month: 144200000000,
          fiscal_year_to_date: 624280000000,
          prior_period: 138219000000,
          budget_estimate: 1690722000000,
          ratio_percentage: 8.53,
        },
        {
          department: "Social Security Administration",
          this_month: 116721000000,
          fiscal_year_to_date: 538920000000,
          prior_period: 107682000000,
          budget_estimate: 1498317000000,
          ratio_percentage: 7.79,
        },
        {
          department: "Department of Veterans Affairs",
          this_month: 25200000000,
          fiscal_year_to_date: 140830000000,
          prior_period: 23942000000,
          budget_estimate: 318204000000,
          ratio_percentage: 7.92,
        },
        {
          department: "Department of State",
          this_month: 2720000000,
          fiscal_year_to_date: 12324000000,
          prior_period: 2620000000,
          budget_estimate: 35800000000,
          ratio_percentage: 7.6,
        },
        {
          department: "Department of Education",
          this_month: 12900000000,
          fiscal_year_to_date: 76524000000,
          prior_period: 12400000000,
          budget_estimate: 179694000000,
          ratio_percentage: 7.18,
        },
        {
          department: "Department of Agriculture",
          this_month: 15800000000,
          fiscal_year_to_date: 95023000000,
          prior_period: 15200000000,
          budget_estimate: 228584000000,
          ratio_percentage: 6.91,
        },
        {
          department: "Legislative Branch",
          this_month: 524000000,
          fiscal_year_to_date: 2330000000,
          prior_period: 510000000,
          budget_estimate: 7300000000,
          ratio_percentage: 7.18,
        },
        {
          department: "Department of Homeland Security",
          this_month: 6700000000,
          fiscal_year_to_date: 34781000000,
          prior_period: 6500000000,
          budget_estimate: 97793000000,
          ratio_percentage: 6.85,
        },
        {
          department: "Judicial Branch",
          this_month: 680000000,
          fiscal_year_to_date: 3100000000,
          prior_period: 650000000,
          budget_estimate: 10100000000,
          ratio_percentage: 6.73,
        },
        {
          department: "Department of Labor",
          this_month: 5000000000,
          fiscal_year_to_date: 22420000000,
          prior_period: 4800000000,
          budget_estimate: 75600000000,
          ratio_percentage: 6.61,
        },
      ]
    : [];

  // Sort by ratio
  const sortedDepartments = [...departmentData].sort(
    (a, b) => b.ratio_percentage - a.ratio_percentage
  );

  return {
    primary_period: `${primaryMonth} ${primaryYear}`,
    comparison_period: comparisonPeriod
      ? `${comparisonMonth} ${comparisonYear}`
      : undefined,
    departments: departmentData,
    top_departments: sortedDepartments.slice(0, 5),
    bottom_departments: sortedDepartments.slice(-5),
    comparison_departments: comparisonDepartmentData,
  };
}

// Mock comparison result for development
function getMockComparisonResult(
  primaryPeriod: string,
  comparisonPeriod?: string
): ComparisonResult {
  // Extract month and year for display
  const primaryMatch = primaryPeriod.match(/mts(\d{2})(\d{2})/);
  const primaryMonth = primaryMatch
    ? getMonthName(parseInt(primaryMatch[1]))
    : "February";
  const primaryYear = primaryMatch ? `20${primaryMatch[2]}` : "2025";

  let comparisonMonth, comparisonYear;
  if (comparisonPeriod) {
    const comparisonMatch = comparisonPeriod.match(/mts(\d{2})(\d{2})/);
    comparisonMonth = comparisonMatch
      ? getMonthName(parseInt(comparisonMatch[1]))
      : "February";
    comparisonYear = comparisonMatch ? `20${comparisonMatch[2]}` : "2024";
  }

  return {
    primary_period: `${primaryMonth} ${primaryYear}`,
    comparison_period: comparisonPeriod
      ? `${comparisonMonth} ${comparisonYear}`
      : undefined,
    summary: {
      receipts: {
        current: 331298000000,
        previous: comparisonPeriod ? 293950000000 : undefined,
        change_percent: comparisonPeriod ? 12.7 : 0,
      },
      outlays: {
        current: 529196000000,
        previous: comparisonPeriod ? 488481000000 : undefined,
        change_percent: comparisonPeriod ? 8.3 : 0,
      },
      deficit: {
        current: 197898000000,
        previous: comparisonPeriod ? 194531000000 : undefined,
        change_percent: comparisonPeriod ? 1.7 : 0,
      },
      debt: {
        current: 34799000000000,
        previous: comparisonPeriod ? 31457000000000 : undefined,
        change_percent: comparisonPeriod ? 10.6 : 0,
      },
    },
    detailed: {
      receipts: [
        {
          category: "Individual Income Taxes",
          current: 198779000000,
          previous: comparisonPeriod ? 176370000000 : undefined,
          change_percent: comparisonPeriod ? 12.7 : 0,
        },
        {
          category: "Corporation Income Taxes",
          current: 7929000000,
          previous: comparisonPeriod ? 5918000000 : undefined,
          change_percent: comparisonPeriod ? 34.0 : 0,
        },
        {
          category: "Social Insurance Taxes",
          current: 111825000000,
          previous: comparisonPeriod ? 102843000000 : undefined,
          change_percent: comparisonPeriod ? 8.7 : 0,
        },
        {
          category: "Excise Taxes",
          current: 4777000000,
          previous: comparisonPeriod ? 5142000000 : undefined,
          change_percent: comparisonPeriod ? -7.1 : 0,
        },
        {
          category: "Other",
          current: 7988000000,
          previous: comparisonPeriod ? 3677000000 : undefined,
          change_percent: comparisonPeriod ? 117.2 : 0,
        },
      ],
      outlays: [
        {
          category: "Health and Human Services",
          current: 146782000000,
          previous: comparisonPeriod ? 140219000000 : undefined,
          change_percent: comparisonPeriod ? 4.7 : 0,
          budget_estimate: 1710722000000,
        },
        {
          category: "Social Security Administration",
          current: 116721000000,
          previous: comparisonPeriod ? 107682000000 : undefined,
          change_percent: comparisonPeriod ? 8.4 : 0,
          budget_estimate: 1518317000000,
        },
        {
          category: "Department of Defense",
          current: 61493000000,
          previous: comparisonPeriod ? 59219000000 : undefined,
          change_percent: comparisonPeriod ? 3.8 : 0,
          budget_estimate: 848565000000,
        },
        {
          category: "Department of Treasury",
          current: 88341000000,
          previous: comparisonPeriod ? 71320000000 : undefined,
          change_percent: comparisonPeriod ? 23.9 : 0,
          budget_estimate: 438826000000,
        },
        {
          category: "Interest on Treasury Debt",
          current: 77029000000,
          previous: comparisonPeriod ? 61720000000 : undefined,
          change_percent: comparisonPeriod ? 24.8 : 0,
          budget_estimate: 1002503000000,
        },
        {
          category: "Department of Education",
          current: 13630000000,
          previous: comparisonPeriod ? 14279000000 : undefined,
          change_percent: comparisonPeriod ? -4.5 : 0,
          budget_estimate: 183694000000,
        },
        {
          category: "Department of Veterans Affairs",
          current: 25200000000,
          previous: comparisonPeriod ? 23942000000 : undefined,
          change_percent: comparisonPeriod ? 5.3 : 0,
          budget_estimate: 324204000000,
        },
      ],
    },
    significant_changes: [
      {
        category: "Interest on Treasury Debt",
        current: 77029000000,
        previous: comparisonPeriod ? 61720000000 : undefined,
        change_percent: comparisonPeriod ? 24.8 : 0,
        budget_estimate: 1002503000000,
      },
      {
        category: "Department of Treasury",
        current: 88341000000,
        previous: comparisonPeriod ? 71320000000 : undefined,
        change_percent: comparisonPeriod ? 23.9 : 0,
        budget_estimate: 438826000000,
      },
      {
        category: "Individual Income Taxes",
        current: 198779000000,
        previous: comparisonPeriod ? 176370000000 : undefined,
        change_percent: comparisonPeriod ? 12.7 : 0,
        budget_estimate: 2355223000000,
      },
      {
        category: "Social Insurance Taxes",
        current: 111825000000,
        previous: comparisonPeriod ? 102843000000 : undefined,
        change_percent: comparisonPeriod ? 8.7 : 0,
        budget_estimate: 1720812000000,
      },
    ],
    insights: [
      {
        type: "warning",
        message:
          "Interest costs on Treasury debt have increased by 24.8% compared to last year",
        description:
          "Rising interest rates and increased federal debt are driving higher interest expenses.",
      },
      {
        type: "info",
        message:
          "Individual income tax receipts are up 12.7% compared to last year",
        description:
          "Strong labor market and wage growth are contributing to higher income tax receipts.",
      },
      {
        type: "info",
        message: "Social insurance taxes have increased by 8.7%",
        description:
          "Employment growth and wage increases are driving higher payroll tax collections.",
      },
    ],
  };
}

// Helper function to get month name from number
function getMonthName(monthNumber: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthNumber - 1] || "Unknown";
}
