import { NextRequest, NextResponse } from "next/server";

// This would normally connect to a database or file system
// to fetch pre-processed documents based on period
export async function POST(req: NextRequest) {
  try {
    const { primaryPeriod, comparisonPeriod } = await req.json();

    if (!primaryPeriod) {
      return NextResponse.json(
        { error: "No period specified" },
        { status: 400 }
      );
    }

    // Mock data for demonstration purposes
    const periodData = {
      feb2024: {
        "Individual Income Taxes": {
          thisMonth: 120884,
          fiscalYearToDate: 929473,
          priorPeriod: 878964,
          budgetEstimates: 2355223,
        },
        "Corporation Income Taxes": {
          thisMonth: 4688,
          fiscalYearToDate: 174465,
          priorPeriod: 128507,
          budgetEstimates: 683613,
        },
        "Total Receipts": {
          thisMonth: 271126,
          fiscalYearToDate: 1856020,
          priorPeriod: 1734955,
          budgetEstimates: 5027559,
        },
        "Total Outlays": {
          thisMonth: 559291,
          fiscalYearToDate: 2644670,
          priorPeriod: 2536120,
          budgetEstimates: 6896284,
        },
      },
      jan2024: {
        "Individual Income Taxes": {
          thisMonth: 115432,
          fiscalYearToDate: 900123,
          priorPeriod: 850345,
          budgetEstimates: 2300000,
        },
        "Corporation Income Taxes": {
          thisMonth: 4200,
          fiscalYearToDate: 168900,
          priorPeriod: 120000,
          budgetEstimates: 675000,
        },
        "Total Receipts": {
          thisMonth: 260000,
          fiscalYearToDate: 1820000,
          priorPeriod: 1700000,
          budgetEstimates: 5000000,
        },
        "Total Outlays": {
          thisMonth: 540000,
          fiscalYearToDate: 2600000,
          priorPeriod: 2500000,
          budgetEstimates: 6800000,
        },
      },
      dec2023: {
        "Individual Income Taxes": {
          thisMonth: 105000,
          fiscalYearToDate: 845000,
          priorPeriod: 820000,
          budgetEstimates: 2250000,
        },
        "Corporation Income Taxes": {
          thisMonth: 3900,
          fiscalYearToDate: 155000,
          priorPeriod: 115000,
          budgetEstimates: 650000,
        },
        "Total Receipts": {
          thisMonth: 250000,
          fiscalYearToDate: 1750000,
          priorPeriod: 1650000,
          budgetEstimates: 4900000,
        },
        "Total Outlays": {
          thisMonth: 520000,
          fiscalYearToDate: 2500000,
          priorPeriod: 2400000,
          budgetEstimates: 6700000,
        },
      },
      // Add more periods as needed
    };

    const results = {
      mainResults: periodData[primaryPeriod] || {},
    };

    if (comparisonPeriod && periodData[comparisonPeriod]) {
      results.comparisonResults = periodData[comparisonPeriod];
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching treasury data:", error);
    return NextResponse.json(
      { error: "Failed to fetch treasury data" },
      { status: 500 }
    );
  }
}
