#!/usr/bin/env python3
"""
Process the sample Treasury Statement PDFs and save the results.
"""

import os
import json
from pathlib import Path
import logging

from src.lib.pdf.extractor import process_treasury_statement

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Directories
DOCUMENTS_DIR = Path("public/documents")
DATA_DIR = Path("data")

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)

def main():
    """Process all PDF files in the documents directory."""
    pdf_files = list(DOCUMENTS_DIR.glob("*.pdf"))
    
    if not pdf_files:
        logger.error(f"No PDF files found in {DOCUMENTS_DIR}")
        return
    
    logger.info(f"Found {len(pdf_files)} PDF files to process")
    
    for pdf_file in pdf_files:
        pdf_path = str(pdf_file)
        output_path = str(DATA_DIR / f"{pdf_file.stem}.json")
        
        logger.info(f"Processing {pdf_file.name}...")
        try:
            # Process the PDF and save the results
            result = process_treasury_statement(pdf_path, output_path)
            logger.info(f"Successfully processed {pdf_file.name}")
            
            # Print a summary of the extracted data
            if "metadata" in result:
                meta = result["metadata"]
                logger.info(f"  Title: {meta.get('title')}")
                logger.info(f"  Period: {meta.get('month')} {meta.get('year')}")
            
            receipts = sum(item.get("this_month", 0) for item in result.get("budget_data", {}).get("receipts", []))
            outlays = sum(item.get("this_month", 0) for item in result.get("budget_data", {}).get("outlays", []))
            
            logger.info(f"  Total Receipts: ${receipts:,.2f}")
            logger.info(f"  Total Outlays: ${outlays:,.2f}")
            logger.info(f"  Deficit: ${outlays - receipts:,.2f}")
            
        except Exception as e:
            logger.error(f"Error processing {pdf_file.name}: {str(e)}")

if __name__ == "__main__":
    main() 