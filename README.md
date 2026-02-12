# Cryptographic Laboratory

Laboratory Work No. 1  
Information Theory  
Variant 2

## Description

This project is a graphical (non-console) application for encryption and decryption of text in the Russian language.  
The program implements two classical cryptographic algorithms:

- Rail Fence cipher
- Vigenere cipher with a progressive key

All algorithms are implemented in a single application.  
The program ignores all characters that are not letters of the Russian alphabet and encrypts only valid alphabetic characters.

The application supports:

- Text input from the keyboard
- Loading text from a `.txt` file
- Saving encrypted or decrypted results to a file

## Implemented Algorithms

### Rail Fence Cipher

The Rail Fence cipher writes the text in a zigzag pattern across a given number of rails and then reads the text row by row.

Features:

- Works only with Russian letters
- Key is the rail height (integer from 2 to 10)
- Visualization of the rail structure is provided
- Invalid input and incorrect keys are handled with error messages

### Vigenere Cipher (Progressive Key)

The Vigenere cipher is a polyalphabetic substitution cipher using a keyword.  
In this implementation, a progressive key is used: after each full key cycle, the key is shifted by one position in the alphabet.

Features:

- Works only with Russian letters
- Key length must be between 3 and 20 characters
- Progressive key shifting is implemented
- Input validation and error handling are provided

## File Processing

The program supports file input and output:

- Only `.txt` files can be loaded
- File size is limited according to the maximum allowed text length
- Encrypted or decrypted results can be saved as a text file

## Validation Rules

- Only Russian letters are encrypted
- All other characters are ignored
- Empty input is not allowed
- Invalid keys are rejected with descriptive error messages

## Technologies

- HTML
- CSS
- JavaScript

No external libraries were used.  
All cryptographic algorithms are implemented manually.
