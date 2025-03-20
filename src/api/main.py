from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging
import glob
import re
import PyPDF2

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Treasury Statement Parser API")

# Add CORS middleware to allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directory for data storage
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data'))
PDF_DIR = os.path.join(DATA_DIR, 'pdf')
PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')

# Ensure directories exist
os.makedirs(PDF_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# List of departments to extract data for
DEPARTMENTS = [
    "Legislative Branch",
    "Judicial Branch",
    "Department of Agriculture",
    "Department of Commerce",
    "Department of Defense",
    "Department of Education",
    "Department of Energy",
    "Department of Health and Human Services",
    "Department of Homeland Security",
    "Department of Housing and Urban Development",
    "Department of the Interior",
    "Department of Justice",
    "Department of Labor",
    "Department of State",
    "Department of Transportation",
    "Department of the Treasury",
    "Department of Veterans Affairs",
    "Environmental Protection Agency",
    "Social Security Administration",
    "Other Independent Agencies"
]

# Pydantic models for API requests and responses
class StatementMetadata(BaseModel):
    filename: str
    month: str
    year: str
    processed: bool
    date_added: str

class ProcessRequest(BaseModel):
    filename: str

class BudgetItem(BaseModel):
    current: float
    previous: Optional[float] = None
    change_percent: float

class BudgetDetailItem(BaseModel):
    category: str
    current: float
    previous: Optional[float] = None
    change_percent: float
    budget_estimate: Optional[float] = None

class DepartmentBudgetItem(BaseModel):
    department: str
    this_month: float
    fiscal_year_to_date: float
    prior_period: float 
    budget_estimate: float
    ratio_percentage: float  # This month as percentage of budget estimate

class DepartmentComparisonResult(BaseModel):
    primary_period: str
    comparison_period: Optional[str] = None
    departments: List[DepartmentBudgetItem]
    top_departments: List[DepartmentBudgetItem]
    bottom_departments: List[DepartmentBudgetItem]
    comparison_departments: Optional[List[DepartmentBudgetItem]] = None

class Insight(BaseModel):
    type: str  # 'info' or 'warning'
    message: str
    description: Optional[str] = None

class ComparisonResult(BaseModel):
    primary_period: str
    comparison_period: Optional[str] = None
    summary: dict
    detailed: dict
    significant_changes: List[BudgetDetailItem]
    insights: List[Insight]

# Helper functions
def parse_filename(filename: str) -> tuple:
    """Extract month and year from filename like mts0224.pdf (February 2024)"""
    try:
        # Extract month and year from filename (format: mtsMMYY.pdf)
        month_num = int(filename[3:5])
        year_num = int(filename[5:7])
        
        months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        month_name = months[month_num - 1] if 1 <= month_num <= 12 else "Unknown"
        year = f"20{year_num}"  # Assuming 21st century
        
        return month_name, year
    except (IndexError, ValueError):
        return "Unknown", "Unknown"

def extract_page_text(pdf_path, page_number=8):  # 0-indexed, so 8 is page 9
    """Extract text from a specific page of a PDF."""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            
            # Check if page number is valid
            if page_number >= len(reader.pages):
                logger.error(f"Page {page_number+1} does not exist in {pdf_path}. PDF has {len(reader.pages)} pages.")
                return None
                
            # Extract text from the specified page
            text = reader.pages[page_number].extract_text()
            return text
            
    except Exception as e:
        logger.error(f"Error extracting text from {pdf_path}: {str(e)}")
        return None

def extract_budget_data(text, department_name):
    """
    Extract budget data for the specified department from the text.
    Returns a dictionary with the department data.
    """
    if not text:
        logger.error(f"No text provided for extraction for {department_name}")
        return None
    
    # Look for the department in the text
    pattern = rf"{department_name}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)"
    match = re.search(pattern, text)
    
    if not match:
        logger.warning(f"{department_name} data not found in the text")
        return None
    
    # Parse the numbers, removing commas
    this_month = int(match.group(1).replace(',', ''))
    fiscal_year_to_date = int(match.group(2).replace(',', ''))
    prior_period = int(match.group(3).replace(',', ''))
    budget_estimate = int(match.group(4).replace(',', ''))
    
    # Scale the values (assuming the extracted values are in millions)
    scale = 1000000
    
    return {
        "department": department_name,
        "this_month": this_month * scale,
        "fiscal_year_to_date": fiscal_year_to_date * scale,
        "prior_period": prior_period * scale,
        "budget_estimate": budget_estimate * scale
    }

def get_statement_metadata(filename: str) -> StatementMetadata:
    """Create metadata object for a statement file"""
    month, year = parse_filename(filename)
    processed = os.path.exists(os.path.join(PROCESSED_DIR, filename.replace('.pdf', '.json')))
    
    return StatementMetadata(
        filename=filename,
        month=month,
        year=year,
        processed=processed,
        date_added=datetime.now().isoformat()
    )

def is_valid_statement_file(filename: str) -> bool:
    """Check if a file appears to be a valid Treasury statement"""
    return filename.startswith('mts') and filename.endswith('.pdf')

def extract_departments_data(statement_id: str) -> Dict[str, Any]:
    """Extract budget data for all departments from a PDF statement"""
    logger.info(f"Starting extraction of department data from {statement_id}.pdf")
    
    pdf_path = os.path.join(PDF_DIR, f"{statement_id}.pdf")
    if not os.path.exists(pdf_path):
        logger.error(f"PDF file {statement_id}.pdf not found")
        return {}
    
    logger.info(f"Extracting text from page 9 of {statement_id}.pdf")
    # Extract text from page 9 (index 8)
    page_text = extract_page_text(pdf_path)
    if not page_text:
        logger.error(f"Could not extract text from page 9 of {statement_id}.pdf")
        return {}
    
    logger.info(f"Successfully extracted raw text from page 9 of {statement_id}.pdf")
    logger.debug(f"Raw text extract: {page_text[:500]}...") # Log first 500 chars of text
    
    # Extract metadata
    month, year = parse_filename(f"{statement_id}.pdf")
    period = f"{month} {year}"
    logger.info(f"Processing data for period: {period}")
    
    # Extract data for each department
    departments_data = {
        "period": period,
        "month": month,
        "year": year,
        "departments": []
    }
    
    logger.info(f"Starting to extract budget data for {len(DEPARTMENTS)} departments")
    successful_extractions = 0
    
    for department in DEPARTMENTS:
        logger.debug(f"Extracting data for: {department}")
        dept_data = extract_budget_data(page_text, department)
        if dept_data:
            # Calculate the ratio of "This Month" to "Budget Estimate"
            if dept_data["budget_estimate"] > 0:
                ratio = (dept_data["this_month"] / dept_data["budget_estimate"]) * 100
            else:
                ratio = 0
            
            dept_data["ratio_percentage"] = round(ratio, 2)
            departments_data["departments"].append(dept_data)
            successful_extractions += 1
            logger.debug(f"Successfully extracted data for {department}: {dept_data}")
        else:
            logger.warning(f"Failed to extract data for {department}")
    
    logger.info(f"Successfully extracted data for {successful_extractions} out of {len(DEPARTMENTS)} departments")
    
    # Sort departments by ratio (descending)
    departments_data["departments"].sort(key=lambda x: x.get("ratio_percentage", 0), reverse=True)
    
    # Save to cache file
    output_file = os.path.join(PROCESSED_DIR, f"{statement_id}_departments.json")
    logger.info(f"Saving extracted department data to {output_file}")
    with open(output_file, 'w') as f:
        json.dump(departments_data, f, indent=2)
    
    logger.info(f"Department data extraction for {statement_id} completed successfully")
    return departments_data

def get_cached_departments_data(statement_id: str) -> Dict[str, Any]:
    """Get department data from cache if available, or extract it if not"""
    cache_file = os.path.join(PROCESSED_DIR, f"{statement_id}_departments.json")
    
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading cached data for {statement_id}: {str(e)}")
    
    # If no cache or error, extract the data
    return extract_departments_data(statement_id)

# Load processed statements cache
def load_processed_statements() -> Dict[str, Dict[str, Any]]:
    """Load processed statements from the data directory."""
    statements = {}
    for file in glob.glob(os.path.join(PROCESSED_DIR, "*.json")):
        filename = os.path.basename(file)
        if "_departments.json" in filename:
            continue  # Skip department data files
            
        try:
            with open(file, "r") as f:
                data = json.load(f)
                statements[os.path.splitext(filename)[0]] = data
        except Exception as e:
            logger.error(f"Error loading {file}: {str(e)}")
    return statements

# Cache of processed statements
processed_statements = load_processed_statements()

# Background processing task
def process_pdf_background(filename: str):
    """Process a PDF in the background and save results to disk."""
    pdf_path = os.path.join(PDF_DIR, filename)
    output_path = os.path.join(PROCESSED_DIR, f"{os.path.splitext(filename)[0]}.json")
    
    # Basic processing logic (in a real app, you'd use your extractor)
    month, year = parse_filename(filename)
    
    # Create mock data
    mock_data = {
        "metadata": {
            "filename": filename,
            "month": month,
            "year": year,
            "processed_date": datetime.now().isoformat()
        },
        "budget_data": {
            "receipts": {
                "total": 331298000000
            },
            "outlays": {
                "total": 529196000000
            },
            "deficit": 197898000000,
            "debt": 34799000000000
        }
    }
    
    # Save processed data
    with open(output_path, 'w') as f:
        json.dump(mock_data, f, indent=2)
    
    # Update the cache
    processed_statements[os.path.splitext(filename)[0]] = mock_data
    
    # Also extract department data
    extract_departments_data(os.path.splitext(filename)[0])

# API Routes
@app.get("/")
async def root():
    return {"message": "Treasury Statement Parser API"}

@app.get("/api/statements", response_model=List[StatementMetadata])
async def get_statements():
    """List all available Treasury statement files"""
    pdf_files = []
    
    # Check if PDF directory exists
    if os.path.exists(PDF_DIR):
        # Get all PDF files in the directory
        pdf_files = [os.path.basename(f) for f in glob.glob(os.path.join(PDF_DIR, "*.pdf"))]
    
    # Filter for valid statement files and create metadata
    statements = [get_statement_metadata(file) for file in pdf_files if is_valid_statement_file(file)]
    
    return statements

@app.post("/api/process")
async def process_statement(request: ProcessRequest):
    """Process a PDF statement to extract data"""
    filename = request.filename
    pdf_path = os.path.join(PDF_DIR, filename)
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"File {filename} not found")
    
    try:
        # Process the PDF
        process_pdf_background(filename)
        
        return {"message": f"Successfully processed {filename}", "status": "success"}
    
    except Exception as e:
        logger.error(f"Error processing {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/api/statements/{statement_id}")
async def get_statement(statement_id: str):
    """Get the processed data for a specific statement."""
    if statement_id not in processed_statements:
        raise HTTPException(status_code=404, detail=f"Statement {statement_id} not found or not processed")
    
    return processed_statements[statement_id]

@app.get("/api/departments", response_model=DepartmentComparisonResult)
async def compare_departments(
    primary: str = Query(..., description="Primary statement ID"),
    comparison: Optional[str] = Query(None, description="Comparison statement ID (optional)")
):
    """Compare department budget data across statements"""
    # Get department data for primary statement
    primary_data = get_cached_departments_data(primary)
    if not primary_data or not primary_data.get("departments"):
        raise HTTPException(status_code=404, detail=f"Department data for {primary} not found")
    
    # Get department data for comparison statement, if provided
    comparison_data = None
    if comparison:
        comparison_data = get_cached_departments_data(comparison)
        if not comparison_data or not comparison_data.get("departments"):
            logger.warning(f"Department data for comparison statement {comparison} not found")
    
    # Build the response
    response = {
        "primary_period": primary_data.get("period", "Unknown"),
        "comparison_period": comparison_data.get("period") if comparison_data else None,
        "departments": [],
        "top_departments": [],
        "bottom_departments": [],
        "comparison_departments": []
    }
    
    # Process department data
    departments = primary_data.get("departments", [])
    
    # Sort by ratio (descending) if not already sorted
    departments.sort(key=lambda x: x.get("ratio_percentage", 0), reverse=True)
    
    # Add departments to response
    response["departments"] = departments
    
    # Get top 5 departments (highest ratio)
    response["top_departments"] = departments[:5] if len(departments) >= 5 else departments
    
    # Get bottom 5 departments (lowest ratio)
    response["bottom_departments"] = departments[-5:] if len(departments) >= 5 else []
    
    # Add comparison departments if available
    if comparison_data and comparison_data.get("departments"):
        response["comparison_departments"] = comparison_data.get("departments", [])
    
    return response

@app.get("/api/compare", response_model=ComparisonResult)
async def compare_statements(
    primary: str = Query(..., description="Primary statement ID"),
    comparison: Optional[str] = Query(None, description="Comparison statement ID (optional)")
):
    """Compare two Treasury statements"""
    # In a real implementation, this would load the processed data and perform comparisons
    # For now, we'll return mock comparison data
    
    # Extract month and year for display
    primary_month, primary_year = parse_filename(f"{primary}.pdf")
    primary_period = f"{primary_month} {primary_year}"
    
    comparison_period = None
    if comparison:
        comparison_month, comparison_year = parse_filename(f"{comparison}.pdf")
        comparison_period = f"{comparison_month} {comparison_year}"
    
    # Create mock comparison data
    mock_result = {
        "primary_period": primary_period,
        "comparison_period": comparison_period,
        "summary": {
            "receipts": {
                "current": 331298000000,
                "previous": 293950000000 if comparison else None,
                "change_percent": 12.7 if comparison else 0
            },
            "outlays": {
                "current": 529196000000,
                "previous": 488481000000 if comparison else None, 
                "change_percent": 8.3 if comparison else 0
            },
            "deficit": {
                "current": 197898000000,
                "previous": 194531000000 if comparison else None,
                "change_percent": 1.7 if comparison else 0
            },
            "debt": {
                "current": 34799000000000,
                "previous": 31457000000000 if comparison else None,
                "change_percent": 10.6 if comparison else 0
            }
        },
        "detailed": {
            "receipts": [
                {
                    "category": "Individual Income Taxes",
                    "current": 198779000000,
                    "previous": 176370000000 if comparison else None,
                    "change_percent": 12.7 if comparison else 0
                },
                {
                    "category": "Corporation Income Taxes",
                    "current": 7929000000,
                    "previous": 5918000000 if comparison else None,
                    "change_percent": 34.0 if comparison else 0
                },
                {
                    "category": "Social Insurance Taxes",
                    "current": 111825000000,
                    "previous": 102843000000 if comparison else None,
                    "change_percent": 8.7 if comparison else 0
                },
                {
                    "category": "Excise Taxes",
                    "current": 4777000000,
                    "previous": 5142000000 if comparison else None,
                    "change_percent": -7.1 if comparison else 0
                },
                {
                    "category": "Other",
                    "current": 7988000000,
                    "previous": 3677000000 if comparison else None,
                    "change_percent": 117.2 if comparison else 0
                }
            ],
            "outlays": [
                {
                    "category": "Health and Human Services",
                    "current": 146782000000,
                    "previous": 140219000000 if comparison else None,
                    "change_percent": 4.7 if comparison else 0
                },
                {
                    "category": "Social Security Administration",
                    "current": 116721000000,
                    "previous": 107682000000 if comparison else None,
                    "change_percent": 8.4 if comparison else 0
                },
                {
                    "category": "Department of Defense",
                    "current": 61493000000,
                    "previous": 59219000000 if comparison else None,
                    "change_percent": 3.8 if comparison else 0
                },
                {
                    "category": "Department of Treasury",
                    "current": 88341000000,
                    "previous": 71320000000 if comparison else None,
                    "change_percent": 23.9 if comparison else 0
                },
                {
                    "category": "Interest on Treasury Debt",
                    "current": 77029000000,
                    "previous": 61720000000 if comparison else None,
                    "change_percent": 24.8 if comparison else 0
                },
                {
                    "category": "Department of Education",
                    "current": 13630000000,
                    "previous": 14279000000 if comparison else None,
                    "change_percent": -4.5 if comparison else 0
                },
                {
                    "category": "Department of Veterans Affairs",
                    "current": 25200000000,
                    "previous": 23942000000 if comparison else None,
                    "change_percent": 5.3 if comparison else 0
                }
            ]
        },
        "significant_changes": [
            {
                "category": "Interest on Treasury Debt",
                "current": 77029000000,
                "previous": 61720000000 if comparison else None,
                "change_percent": 24.8 if comparison else 0,
                "budget_estimate": 1002503000000
            },
            {
                "category": "Department of Treasury",
                "current": 88341000000,
                "previous": 71320000000 if comparison else None,
                "change_percent": 23.9 if comparison else 0,
                "budget_estimate": 438826000000
            },
            {
                "category": "Individual Income Taxes",
                "current": 198779000000,
                "previous": 176370000000 if comparison else None,
                "change_percent": 12.7 if comparison else 0,
                "budget_estimate": 2355223000000
            },
            {
                "category": "Social Insurance Taxes",
                "current": 111825000000,
                "previous": 102843000000 if comparison else None,
                "change_percent": 8.7 if comparison else 0,
                "budget_estimate": 1720812000000
            }
        ],
        "insights": [
            {
                "type": "warning",
                "message": "Interest costs on Treasury debt have increased by 24.8% compared to last year",
                "description": "Rising interest rates and increased federal debt are driving higher interest expenses."
            },
            {
                "type": "info",
                "message": "Individual income tax receipts are up 12.7% compared to last year",
                "description": "Strong labor market and wage growth are contributing to higher income tax receipts."
            },
            {
                "type": "info",
                "message": "Social insurance taxes have increased by 8.7%",
                "description": "Employment growth and wage increases are driving higher payroll tax collections."
            }
        ]
    }
    
    return mock_result 