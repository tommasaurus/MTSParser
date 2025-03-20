#!/usr/bin/env python3
"""
Script to extract and display the raw text from page 9 of Treasury Statement PDFs.
This will help to see what text is available in the table before processing.
"""

import os
import glob
from pathlib import Path
import PyPDF2
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Directories
PDF_DIR = Path("data/pdf")

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

def process_pdfs():
    """Process all PDFs in the PDF directory and extract text from page 9."""
    # Ensure directories exist
    os.makedirs(PDF_DIR, exist_ok=True)
    
    # Find all PDFs
    pdf_files = glob.glob(str(PDF_DIR / "*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files to process")
    
    if not pdf_files:
        logger.warning(f"No PDF files found in {PDF_DIR}")
        return
    
    # Process each PDF
    for pdf_path in pdf_files:
        pdf_filename = os.path.basename(pdf_path)
        logger.info(f"Processing {pdf_filename}...")
        
        # Extract text from page 9
        page_text = extract_page_text(pdf_path)
        
        if page_text:
            print(f"\n{'='*50}")
            print(f"Text from page 9 of {pdf_filename}:")
            print(f"{'='*50}\n")
            print(page_text)
            print(f"\n{'='*50}\n")
            
            # Save text to file for reference
            output_path = f"{os.path.splitext(pdf_path)[0]}_page9.txt"
            with open(output_path, 'w') as f:
                f.write(page_text)
            print(f"Text saved to: {output_path}")
        else:
            print(f"Could not extract text from page 9 of {pdf_filename}")

def main():
    """Main function."""
    print("=== Treasury Statement Page 9 Text Extraction ===")
    process_pdfs()
    print("\nAll processing complete!")

if __name__ == "__main__":
    main() 