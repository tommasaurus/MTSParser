#!/usr/bin/env python3
"""
Script to extract budget data for multiple departments from Treasury Statements
and analyze the relationship between "This Month" values and "Budget Estimates".
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

# List of departments to extract data for
DEPARTMENTS = [
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
    "Social Security Administration"
]

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

def analyze_with_openai(data, analysis_type="budget_comparison"):
    """
    Analyze the extracted budget data using OpenAI API.
    
    Args:
        data: Dictionary containing the extracted data from PDFs
        analysis_type: Type of analysis to perform (default: "budget_comparison")
        
    Returns:
        String containing the analysis from OpenAI
    """
    # Prepare prompt based on analysis type
    if analysis_type == "budget_comparison":
        prompt = f"""
        Analyze the following Treasury Statement budget data for multiple departments:
        
        {json.dumps(data, indent=2)}
        
        Please provide insights on:
        1. For each department, calculate the ratio of "This Month" spending to "Budget Estimates Full Fiscal Year"
        2. Identify departments with the highest and lowest monthly spending relative to their annual budget
        3. Compare departments based on how efficiently they are using their annual budget
        4. Highlight any departments that appear to be spending at a rate that could lead to budget overruns
        
        Present your analysis in a clear, well-structured format suitable for financial reporting.
        """
    elif analysis_type == "department_comparison":
        prompt = f"""
        Compare the budget data across different departments from the Treasury Statement:
        
        {json.dumps(data, indent=2)}
        
        Please provide insights on:
        1. Which departments have the largest and smallest annual budgets
        2. Which departments spent the most and least this month
        3. Compare departments by their fiscal year-to-date spending as a percentage of their annual budget
        4. Identify any significant outliers in terms of spending patterns
        
        Present your analysis in a clear, well-structured format suitable for financial reporting.
        """
    else:
        # Default analysis
        prompt = f"""
        Analyze the following Treasury Statement budget data:
        
        {json.dumps(data, indent=2)}
        
        Please provide a comprehensive analysis of the budget data, highlighting key insights and trends.
        """
    
    try:
        logger.info(f"Sending data to OpenAI for {analysis_type} analysis")
        
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
        logger.info(f"Received {analysis_type} analysis from OpenAI")
        return analysis
        
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {str(e)}")
        return f"Error generating analysis: {str(e)}"

def process_pdfs():
    """Process PDFs and extract budget data for multiple departments."""
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
        "periods": [],
        "departments": {}
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
        period = metadata["period"]
        
        # Add period to the list if not already there
        if period not in all_data["periods"]:
            all_data["periods"].append(period)
        
        # Extract data for each department
        period_data = {
            "filename": pdf_filename,
            "period": period,
            "month": metadata["month"],
            "year": metadata["year"],
            "departments": {}
        }
        
        for department in DEPARTMENTS:
            dept_data = extract_budget_data(page_text, department)
            
            if dept_data:
                period_data["departments"][department] = dept_data
                
                # Initialize department in the all_data structure if needed
                if department not in all_data["departments"]:
                    all_data["departments"][department] = {}
                
                # Add the data for this period to the department
                all_data["departments"][department][period] = {
                    "this_month": dept_data["this_month"],
                    "fiscal_year_to_date": dept_data["fiscal_year_to_date"],
                    "prior_period": dept_data["prior_period"],
                    "budget_estimate": dept_data["budget_estimate"]
                }
        
        # Save period data to a file
        output_path = OUTPUT_DIR / f"{os.path.splitext(pdf_filename)[0]}_all_departments.json"
        with open(output_path, 'w') as f:
            json.dump(period_data, f, indent=2)
        logger.info(f"Saved all departments data for {period} to {output_path}")
    
    # Save all data to a single file
    combined_output_path = OUTPUT_DIR / "all_departments_data.json"
    with open(combined_output_path, 'w') as f:
        json.dump(all_data, f, indent=2)
    logger.info(f"Saved combined data for all departments to {combined_output_path}")
    
    return all_data

def calculate_budget_comparison(all_data):
    """
    Calculate the ratio of "This Month" spending to "Budget Estimates" for each department.
    Returns a dictionary with the computed ratios.
    """
    if not all_data or not all_data.get("departments"):
        logger.error("No data available for comparison")
        return None
    
    comparison_data = {
        "periods": all_data["periods"],
        "departments": {}
    }
    
    for department, periods in all_data["departments"].items():
        comparison_data["departments"][department] = {}
        
        for period, data in periods.items():
            this_month = data["this_month"]
            budget_estimate = data["budget_estimate"]
            
            if budget_estimate > 0:
                ratio = (this_month / budget_estimate) * 100
            else:
                ratio = 0
            
            comparison_data["departments"][department][period] = {
                "this_month": this_month,
                "budget_estimate": budget_estimate,
                "ratio_percentage": round(ratio, 2)
            }
    
    return comparison_data

def main():
    """Main function to extract and analyze budget data for multiple departments."""
    print("=== Treasury Statement Budget Analysis for Multiple Departments ===")
    
    # Extract data for all departments
    all_data = process_pdfs()
    
    if not all_data:
        print("No data extracted. Exiting.")
        return
    
    # Calculate budget comparison (This Month vs Budget Estimates)
    comparison_data = calculate_budget_comparison(all_data)
    
    if comparison_data:
        # Save comparison data to a file
        comparison_output_path = OUTPUT_DIR / "budget_comparison_data.json"
        with open(comparison_output_path, 'w') as f:
            json.dump(comparison_data, f, indent=2)
        logger.info(f"Saved budget comparison data to {comparison_output_path}")
        
        # Display summary of the top 5 departments by ratio for each period
        print("\n=== Summary of Departments: This Month vs Budget Estimate ===")
        
        for period in comparison_data["periods"]:
            print(f"\n{'='*50}")
            print(f"Period: {period}")
            print(f"{'='*50}")
            
            # Get all departments with data for this period
            period_depts = {}
            for dept, periods in comparison_data["departments"].items():
                if period in periods:
                    period_depts[dept] = periods[period]["ratio_percentage"]
            
            # Sort departments by ratio (descending)
            sorted_depts = sorted(period_depts.items(), key=lambda x: x[1], reverse=True)
            
            # Display top 5 and bottom 5 departments
            print("\nTop 5 Departments (Highest This Month/Budget Ratio):")
            for i, (dept, ratio) in enumerate(sorted_depts[:5], 1):
                dept_data = comparison_data["departments"][dept][period]
                print(f"{i}. {dept}: ${dept_data['this_month']:,} / ${dept_data['budget_estimate']:,} = {ratio:.2f}%")
            
            print("\nBottom 5 Departments (Lowest This Month/Budget Ratio):")
            for i, (dept, ratio) in enumerate(sorted_depts[-5:], 1):
                dept_data = comparison_data["departments"][dept][period]
                print(f"{i}. {dept}: ${dept_data['this_month']:,} / ${dept_data['budget_estimate']:,} = {ratio:.2f}%")
        
        # Analyze the data using OpenAI
        print(f"\n{'='*50}")
        print("Analyzing budget comparison data with OpenAI...")
        analysis = analyze_with_openai(comparison_data, "budget_comparison")
        
        if analysis:
            # Save analysis to a file
            analysis_path = OUTPUT_DIR / "budget_comparison_analysis.txt"
            with open(analysis_path, 'w') as f:
                f.write(analysis)
            logger.info(f"Saved budget comparison analysis to {analysis_path}")
            
            print(f"\n{'='*50}")
            print("OpenAI Analysis of Budget Comparison:")
            print(f"{'='*50}")
            print(analysis)
        
        # Perform department comparison analysis
        print(f"\n{'='*50}")
        print("Analyzing department comparison data with OpenAI...")
        dept_analysis = analyze_with_openai(all_data, "department_comparison")
        
        if dept_analysis:
            # Save analysis to a file
            dept_analysis_path = OUTPUT_DIR / "department_comparison_analysis.txt"
            with open(dept_analysis_path, 'w') as f:
                f.write(dept_analysis)
            logger.info(f"Saved department comparison analysis to {dept_analysis_path}")
            
            print(f"\n{'='*50}")
            print("OpenAI Analysis of Department Comparison:")
            print(f"{'='*50}")
            print(dept_analysis)
    
    print("\nProcessing complete!")

if __name__ == "__main__":
    main() 