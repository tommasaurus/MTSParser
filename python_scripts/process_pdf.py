# This would be the actual Python script for processing PDFs
# Pseudocode for the implementation

import sys
import json
import easyocr
import fitz  # PyMuPDF

def extract_table_from_pdf(pdf_path):
    # Initialize OCR reader
    reader = easyocr.Reader(['en'])
    
    # Open PDF
    pdf = fitz.open(pdf_path)
    
    # Find page with the target table
    target_page = None
    for page_num, page in enumerate(pdf):
        text = page.get_text()
        if "Summary of Receipts and Outlays" in text:
            target_page = page
            break
    
    if not target_page:
        return {"error": "Target table not found"}
    
    # Extract image from page
    pix = target_page.get_pixmap()
    img_path = "temp_image.png"
    pix.save(img_path)
    
    # Run OCR on the image
    results = reader.readtext(img_path)
    
    # Process results to find table structure
    # This would be more complex in a real implementation
    
    # Extract rows and columns
    # Parse financial data
    
    # Return structured data
    return {
        "documentInfo": {
            "filename": pdf_path,
            "extractedDate": "Extracted date"
        },
        "categories": [
            # Extracted data would go here
        ]
    }

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    result = extract_table_from_pdf(pdf_path)
    print(json.dumps(result)) 