#!/usr/bin/env python3
"""
Script to extract Department of Homeland Security budget data from Treasury Statements
and analyze the data using OpenAI.
"""

import os
import re
import glob
import json
from pathlib import Path
import PyPDF2
import logging
import openai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configure OpenAI API
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logger.error("OpenAI API key not found. Please set OPENAI_API_KEY in .env file.")
    exit(1)

# Directories
PDF_DIR = Path("data/pdf")
OUTPUT_DIR = Path("data/processed")

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

def extract_budget_data(text, department_name="Department of Homeland Security"):
    """
    Extract budget data for the specified department from the text.
    Returns a dictionary with the department data.
    """
    if not text:
        logger.error("No text provided for extraction")
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
    
    return {
        "department": department_name,
        "this_month": this_month,
        "fiscal_year_to_date": fiscal_year_to_date,
        "prior_period": prior_period,
        "budget_estimate": budget_estimate
    }

def extract_metadata_from_filename(filename):
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
        
        return {
            "month": month_name,
            "year": year,
            "period": f"{month_name} {year}"
        }
    except (IndexError, ValueError):
        return {"month": "Unknown", "year": "Unknown", "period": "Unknown"}

def analyze_with_openai(data):
    """
    Analyze the extracted budget data using OpenAI API.
    
    Args:
        data: Dictionary containing the extracted data from PDFs
        
    Returns:
        String containing the analysis from OpenAI
    """
    # Prepare the prompt for OpenAI
    prompt = f"""
    Analyze the following Treasury Statement budget data for the Department of Homeland Security:
    
    {json.dumps(data, indent=2)}
    
    Please provide insights on:
    1. The difference between "This Month" spending and what was budgeted for the full fiscal year
    2. The percentage of the full fiscal year budget that has been spent so far this month
    3. Any notable trends or observations when comparing the two periods
    4. The fiscal year-to-date spending as a percentage of the full fiscal year budget
    
    Present your analysis in a clear, concise format suitable for financial reporting.
    """
    
    try:
        logger.info("Sending data to OpenAI for analysis")
        
        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a financial analyst specializing in government budget analysis."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        # Extract and return the analysis
        analysis = response.choices[0].message.content
        logger.info("Received analysis from OpenAI")
        return analysis
        
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {str(e)}")
        return f"Error generating analysis: {str(e)}"

def process_pdfs(department_name="Department of Homeland Security"):
    """Process PDFs and extract Department of Homeland Security budget data."""
    # Ensure directories exist
    os.makedirs(PDF_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Find all PDFs
    pdf_files = glob.glob(str(PDF_DIR / "*.pdf"))
    pdf_files.sort()  # Sort to ensure consistent order
    
    logger.info(f"Found {len(pdf_files)} PDF files to process")
    
    if not pdf_files:
        logger.warning(f"No PDF files found in {PDF_DIR}")
        return
    
    # Dictionary to store all extracted data
    all_data = {
        "department": department_name,
        "statements": []
    }
    
    # Process each PDF
    for pdf_path in pdf_files:
        pdf_filename = os.path.basename(pdf_path)
        logger.info(f"Processing {pdf_filename}...")
        
        # Extract text from page 9
        page_text = extract_page_text(pdf_path)
        
        if not page_text:
            logger.error(f"Could not extract text from page 9 of {pdf_filename}")
            continue
        
        # Extract metadata
        metadata = extract_metadata_from_filename(pdf_filename)
        
        # Extract department data
        dept_data = extract_budget_data(page_text, department_name)
        
        if not dept_data:
            logger.warning(f"Could not extract {department_name} data from {pdf_filename}")
            continue
        
        # Add metadata to the department data
        statement_data = {
            "filename": pdf_filename,
            "period": metadata["period"],
            "month": metadata["month"],
            "year": metadata["year"],
            "data": dept_data
        }
        
        all_data["statements"].append(statement_data)
        
        # Save individual statement data
        output_path = OUTPUT_DIR / f"{os.path.splitext(pdf_filename)[0]}_{department_name.replace(' ', '_').lower()}.json"
        with open(output_path, 'w') as f:
            json.dump(statement_data, f, indent=2)
        logger.info(f"Saved {department_name} data to {output_path}")
    
    # Save all data to a single file
    combined_output_path = OUTPUT_DIR / f"all_{department_name.replace(' ', '_').lower()}_data.json"
    with open(combined_output_path, 'w') as f:
        json.dump(all_data, f, indent=2)
    logger.info(f"Saved combined data to {combined_output_path}")
    
    return all_data

def analyze_department_data(all_data):
    """Analyze the department data using OpenAI."""
    if not all_data or not all_data.get("statements"):
        logger.error("No data available for analysis")
        return None
    
    # Get analysis from OpenAI
    analysis = analyze_with_openai(all_data)
    
    if analysis:
        # Save analysis to file
        department_name = all_data.get("department", "department")
        analysis_path = OUTPUT_DIR / f"{department_name.replace(' ', '_').lower()}_analysis.txt"
        with open(analysis_path, 'w') as f:
            f.write(analysis)
        logger.info(f"Saved analysis to {analysis_path}")
    
    return analysis

def main():
    """Main function to extract and analyze Department of Homeland Security budget data."""
    print("=== Treasury Statement Department of Homeland Security Analysis ===")
    
    # Extract department data
    all_data = process_pdfs("Department of Homeland Security")
    
    if not all_data:
        print("No data extracted. Exiting.")
        return
    
    # Display summary of extracted data
    for statement in all_data.get("statements", []):
        period = statement.get("period", "Unknown")
        data = statement.get("data", {})
        
        print(f"\n{'='*50}")
        print(f"Department of Homeland Security Budget Data for {period}")
        print(f"{'='*50}")
        print(f"This Month: ${data.get('this_month', 0):,}")
        print(f"Fiscal Year to Date: ${data.get('fiscal_year_to_date', 0):,}")
        print(f"Prior Period: ${data.get('prior_period', 0):,}")
        print(f"Budget Estimate (Full Year): ${data.get('budget_estimate', 0):,}")
        
        # Calculate and display percentages
        budget_estimate = data.get('budget_estimate', 0)
        if budget_estimate > 0:
            this_month_pct = (data.get('this_month', 0) / budget_estimate) * 100
            fytd_pct = (data.get('fiscal_year_to_date', 0) / budget_estimate) * 100
            print(f"This Month as % of Budget: {this_month_pct:.2f}%")
            print(f"Fiscal Year to Date as % of Budget: {fytd_pct:.2f}%")
    
    # Analyze the data using OpenAI
    print(f"\n{'='*50}")
    print("Analyzing data with OpenAI...")
    analysis = analyze_department_data(all_data)
    
    if analysis:
        print(f"\n{'='*50}")
        print("OpenAI Analysis:")
        print(f"{'='*50}")
        print(analysis)
    
    print("\nProcessing complete!")

if __name__ == "__main__":
    main() 