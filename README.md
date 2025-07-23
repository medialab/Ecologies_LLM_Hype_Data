# Florence-2 Image OCR Processor

A Python script that uses Florence-2 for visual OCR to process images and organize them based on detected text patterns.

## Features

- **Recursive folder scanning** for images (JPG, PNG, TIFF, BMP, WebP)
- **Florence-2 visual OCR** for accurate text extraction
- **Configurable text patterns** via JSON config file
- **Automatic folder organization** based on detected text
- **Progress tracking** and detailed logging

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Make the script executable:
```bash
chmod +x renamer.py
```

## Usage

### Basic Usage
```bash
python renamer.py /path/to/images/folder
```

### Advanced Usage
```bash
python renamer.py /path/to/images/folder \
    --config custom_config.json \
    --output organized_images \
    --model microsoft/Florence-2-base
```

### Command Line Arguments
- `folder`: Root folder to scan for images (required)
- `--config`: Path to configuration file (default: config.json)
- `--output`: Output directory for organized images (default: organized)
- `--model`: Florence-2 model name (default: microsoft/Florence-2-large)

## Configuration

The script uses a JSON configuration file to define text patterns and corresponding folder suffixes. Edit `config.json` to customize:

```json
{
  "Ex1": "2025_01_20",
  "Ex2": "2025_02_13kim",
  "Meeting": "2025_03_15_team",
  "Report": "2025_03_20_quarterly"
}
```

### Pattern Matching
- Patterns are case-insensitive
- Partial matches are supported (e.g., "Meeting" matches "Team Meeting Notes")
- First matching pattern determines the folder suffix

## Output Structure

Organized images are copied to new folders with the format:
```
organized/
├── original_folder_2025_01_20/
│   ├── image1.jpg
│   └── image2.png
├── original_folder_2025_02_13kim/
│   ├── document1.jpg
│   └── screenshot.png
└── ...
```

## System Requirements

- Python 3.8+
- CUDA-capable GPU (optional, but recommended for faster processing)
- 8GB+ RAM (16GB+ recommended for large images)
- Internet connection for initial model download

## Performance Notes

- First run downloads the Florence-2 model (~2-3GB)
- Processing speed depends on image size and GPU availability
- CPU processing is supported but significantly slower

## Troubleshooting

### Common Issues
1. **Out of memory**: Use smaller model (`microsoft/Florence-2-base`) or reduce image size
2. **Model download fails**: Check internet connection and try again
3. **No images found**: Verify folder path and image formats

### Error Handling
- Invalid images are skipped with error messages
- Missing config file creates default automatically
- Permission errors are logged with file paths
