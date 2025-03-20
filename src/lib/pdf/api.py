"""
API for Treasury Statement Parser.
Provides endpoints for extracting data from Treasury Statement PDFs and comparing statements.
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .extractor import TreasuryStatementExtractor, process_treasury_statement

# Initialize FastAPI app
app = FastAPI(
    title="Treasury Statement Parser API",
    description="API for extracting and comparing data from Monthly Treasury Statements",
    version="1.0.0"
)

# Add CORS middleware to allow the frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory where processed PDFs will be stored
DATA_DIR = Path("data")
DOCUMENTS_DIR = Path("public/documents")

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
DOCUMENTS_DIR.mkdir(exist_ok=True, parents=True)

# Data models
class StatementMetadata(BaseModel):
    filename: str
    month: str
    year: int
    processed: bool
    
class ComparisonResult(BaseModel):
    primary_period: str
    comparison_period: Optional[str] = None
    total_receipts: Dict[str, Any]
    total_outlays: Dict[str, Any]
    deficit: Dict[str, Any]

# Load processed statements cache
def load_processed_statements() -> Dict[str, Dict[str, Any]]:
    """Load processed statements from the data directory."""
    statements = {}
    for file in DATA_DIR.glob("*.json"):
        try:
            with open(file, "r") as f:
                data = json.load(f)
                statements[file.stem] = data
        except Exception as e:
            print(f"Error loading {file}: {str(e)}")
    return statements

# Cache of processed statements
processed_statements = load_processed_statements()

# Background processing task
def process_pdf_background(filename: str):
    """Process a PDF in the background and save results to disk."""
    pdf_path = DOCUMENTS_DIR / filename
    output_path = DATA_DIR / f"{Path(filename).stem}.json"
    
    result = process_treasury_statement(str(pdf_path), str(output_path))
    
    # Update the cache
    processed_statements[Path(filename).stem] = result

# API Routes
@app.get("/")
def read_root():
    """Root endpoint."""
    return {"message": "Treasury Statement Parser API is running"}

@app.get("/statements", response_model=List[StatementMetadata])
def list_statements():
    """List all available treasury statements."""
    statements = []
    
    # List all PDFs in the documents directory
    for file in DOCUMENTS_DIR.glob("*.pdf"):
        filename = file.name
        stem = file.stem
        
        # Check if we have processed this PDF
        processed = stem in processed_statements
        
        # Get metadata if available
        metadata = {
            "filename": filename,
            "month": "Unknown",
            "year": 0,
            "processed": processed
        }
        
        if processed:
            statement_data = processed_statements[stem]
            if "metadata" in statement_data:
                metadata["month"] = statement_data["metadata"].get("month", "Unknown")
                metadata["year"] = statement_data["metadata"].get("year", 0)
        
        statements.append(metadata)
    
    return statements

@app.post("/statements/process/{filename}")
def process_statement(filename: str, background_tasks: BackgroundTasks):
    """Process a treasury statement PDF."""
    pdf_path = DOCUMENTS_DIR / filename
    
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF file {filename} not found")
    
    # Start processing in the background
    background_tasks.add_task(process_pdf_background, filename)
    
    return {"message": f"Processing {filename} in the background"}

@app.get("/statements/{statement_id}")
def get_statement(statement_id: str):
    """Get the processed data for a specific statement."""
    if statement_id not in processed_statements:
        raise HTTPException(status_code=404, detail=f"Statement {statement_id} not found or not processed")
    
    return processed_statements[statement_id]

@app.get("/compare", response_model=ComparisonResult)
def compare_statements(
    primary: str = Query(..., description="Primary statement ID (e.g., mts0224)"),
    comparison: Optional[str] = Query(None, description="Comparison statement ID (optional)")
):
    """Compare two treasury statements."""
    # Check if statements are processed
    if primary not in processed_statements:
        raise HTTPException(status_code=404, detail=f"Primary statement {primary} not found or not processed")
    
    if comparison and comparison not in processed_statements:
        raise HTTPException(status_code=404, detail=f"Comparison statement {comparison} not found or not processed")
    
    # Get statement data
    primary_data = processed_statements[primary]
    comparison_data = processed_statements.get(comparison) if comparison else None
    
    # Extract budgetary data
    primary_outlays = _extract_total_outlays(primary_data)
    primary_receipts = _extract_total_receipts(primary_data)
    primary_deficit = primary_outlays - primary_receipts
    
    comparison_outlays = _extract_total_outlays(comparison_data) if comparison_data else None
    comparison_receipts = _extract_total_receipts(comparison_data) if comparison_data else None
    comparison_deficit = comparison_outlays - comparison_receipts if comparison_outlays and comparison_receipts else None
    
    # Calculate percentage changes if comparison data is available
    receipts_change = _calculate_percentage_change(primary_receipts, comparison_receipts) if comparison_receipts else None
    outlays_change = _calculate_percentage_change(primary_outlays, comparison_outlays) if comparison_outlays else None
    deficit_change = _calculate_percentage_change(primary_deficit, comparison_deficit) if comparison_deficit else None
    
    # Format the primary period and comparison period
    primary_period = f"{primary_data['metadata'].get('month', 'Unknown')} {primary_data['metadata'].get('year', '')}"
    comparison_period = None
    if comparison_data:
        comparison_period = f"{comparison_data['metadata'].get('month', 'Unknown')} {comparison_data['metadata'].get('year', '')}"
    
    # Build the result
    result = {
        "primary_period": primary_period,
        "comparison_period": comparison_period,
        "total_receipts": {
            "primary": primary_receipts,
            "comparison": comparison_receipts,
            "change": receipts_change
        },
        "total_outlays": {
            "primary": primary_outlays,
            "comparison": comparison_outlays,
            "change": outlays_change
        },
        "deficit": {
            "primary": primary_deficit,
            "comparison": comparison_deficit,
            "change": deficit_change
        }
    }
    
    return result

# Helper functions for data extraction
def _extract_total_receipts(data: Dict[str, Any]) -> float:
    """Extract total receipts from statement data."""
    if not data or "budget_data" not in data or "receipts" not in data["budget_data"]:
        return 0.0
    
    # Look for the "Total Receipts" entry
    for entry in data["budget_data"]["receipts"]:
        if "category" in entry and "Total Receipts" in entry["category"]:
            return entry.get("this_month", 0.0)
            
    # If not found, use the first entry or return 0
    return data["budget_data"]["receipts"][0].get("this_month", 0.0) if data["budget_data"]["receipts"] else 0.0

def _extract_total_outlays(data: Dict[str, Any]) -> float:
    """Extract total outlays from statement data."""
    if not data or "budget_data" not in data or "outlays" not in data["budget_data"]:
        return 0.0
    
    # Look for the "Total Outlays" entry
    for entry in data["budget_data"]["outlays"]:
        if "category" in entry and "Total Outlays" in entry["category"]:
            return entry.get("this_month", 0.0)
            
    # If not found, use the first entry or return 0
    return data["budget_data"]["outlays"][0].get("this_month", 0.0) if data["budget_data"]["outlays"] else 0.0

def _calculate_percentage_change(current: float, previous: float) -> float:
    """Calculate percentage change between two values."""
    if previous is None or previous == 0:
        return None
    return ((current - previous) / previous) * 100

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.lib.pdf.api:app", host="0.0.0.0", port=8000, reload=True) 