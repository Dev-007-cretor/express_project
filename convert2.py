import sys
import os
from docx2pdf import convert

input_file = sys.argv[1]
output_file = sys.argv[2]

# Ensure input is .docx and output is .pdf
if not input_file.lower().endswith(".docx"):
    raise ValueError("Input file must be a .docx")

# Convert with full absolute paths to avoid issues
input_file = os.path.abspath(input_file)
output_file = os.path.abspath(output_file)

try:
    convert(input_file, output_file)
    print("Conversion successful.")
except Exception as e:
    print(f"Conversion failed: {e}")
    raise
