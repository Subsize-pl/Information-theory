# Cryptographic Laboratory

Laboratory Work No. 2  
Information Theory  
Variant 26

## Description

This project is a graphical application for stream encryption and decryption of files with any content and any extension.  
The program implements a keystream generator based on a Linear Feedback Shift Register (LFSR) with the characteristic polynomial assigned to Variant 26.

The encryption is performed bitwise: each byte of the file is XORed with a corresponding byte of the keystream produced by the LFSR.  
Since XOR is its own inverse, the same operation is used for both encryption and decryption.

The application supports:

- Processing files of any format and extension
- Drag-and-drop file selection
- Binary preview of the source file, keystream, and result
- Saving the processed file to disk

## Implemented Algorithm

### LFSR-Based Stream Cipher

The keystream is generated using a Linear Feedback Shift Register defined by the characteristic polynomial:

```
P(x) = x²⁶ + x⁸ + x⁷ + x + 1
```

Register size: **m = 26**  
Feedback taps (non-zero coefficients): **positions 26, 8, 7, 1**  
Maximum period of the generator: **2²⁶ − 1 = 67 108 863**

The register operates as follows:

- The output bit is taken from the most significant position (degree 26)
- The feedback bit is computed as XOR of all tap positions
- The register shifts left by one position; the feedback bit enters from the right

Each byte of the keystream is assembled from 8 consecutive output bits, most significant bit first.  
The ciphertext byte is obtained as:

```
C_i = M_i XOR K_i
```

where `M_i` is the source byte and `K_i` is the keystream byte.

## File Processing

The program reads and processes files of any format entirely in the browser:

- No file extension restrictions are applied
- Files are processed in chunks to prevent the browser from freezing on large inputs
- The processed result is saved as a binary file to disk
- Output file naming: `encrypted_<original_name>` or `decrypted_<original_name>` depending on the input file name

## Binary Preview

After processing, the application displays three binary views:

- **Source file** — the original bytes in binary representation
- **LFSR keystream** — the generated key bytes in binary representation
- **Result** — the XORed output bytes in binary representation

Each view shows the first 8 bytes, an ellipsis, and the last 4 bytes of the respective data.  
The total size of each stream is shown alongside its label.

## Validation Rules

- The initial register state must consist of exactly 26 bits
- Only characters `0` and `1` are accepted in the seed input field; all other characters are ignored automatically
- An all-zero initial state is rejected, as it produces an all-zero keystream and provides no encryption
- An empty or missing file selection is rejected before processing begins

## LFSR Table Generator

The repository also includes a Python script `generator.py` that produces an `.xlsx` spreadsheet visualizing the step-by-step operation of the LFSR.

```bash
python generator.py [initial_state] [steps]
```

Examples:

```bash
python generator.py 11111111111111111111111111 85
python generator.py 10110100011001011101001001 50
```

The spreadsheet contains:

- Degree labels for each register position
- Tap columns highlighted in blue (positions 26, 8, 7, 1)
- XOR feedback column highlighted in orange
- Step-by-step register states computed via Excel formulas
- All shifts and feedback values are formula-driven, not hardcoded

Requires: `pip install openpyxl`

## Technologies

- HTML
- CSS
- JavaScript

No external libraries were used.  
The LFSR algorithm and all processing logic are implemented manually.
