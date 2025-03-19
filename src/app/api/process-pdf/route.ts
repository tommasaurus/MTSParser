import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mainFile = formData.get("file") as File;
    const comparisonFile = formData.get("comparisonFile") as File | null;

    if (!mainFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Save the uploaded PDF(s) temporarily
    const mainFilePath = path.join("/tmp", `main_${Date.now()}.pdf`);
    await writeFile(mainFilePath, Buffer.from(await mainFile.arrayBuffer()));

    let comparisonFilePath = null;
    if (comparisonFile) {
      comparisonFilePath = path.join("/tmp", `comparison_${Date.now()}.pdf`);
      await writeFile(
        comparisonFilePath,
        Buffer.from(await comparisonFile.arrayBuffer())
      );
    }

    // Call Python script for OCR and extraction
    // Note: In a real implementation, you'd need to set up a Python environment
    // with the necessary libraries and create the actual script
    const scriptCommand = comparisonFilePath
      ? `python3 scripts/extract_treasury_data.py "${mainFilePath}" "${comparisonFilePath}"`
      : `python3 scripts/extract_treasury_data.py "${mainFilePath}"`;

    // In a real implementation, this would call your Python script
    // For now, we'll return mock data

    // Mock data for demonstration purposes
    const mockResults = {
      mainResults: {
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
    };

    if (comparisonFilePath) {
      mockResults.comparisonResults = {
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
      };
    }

    return NextResponse.json(mockResults);
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
