#!/usr/bin/env python3
"""
Florence-2 Image OCR Processor
Processes images using Florence-2 visual OCR and organizes them based on detected text patterns.
"""

import os
import json
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
from tqdm import tqdm
import re

# Suppress HuggingFace tokenizers parallelism warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForCausalLM
import pytesseract


class FlorenceOCRProcessor:
    def __init__(self, model_name: str = "microsoft/Florence-2-large", logger: logging.Logger = None):
        """Initialize Florence-2 model for OCR processing."""
        self.device = self._get_optimal_device()
        self.logger = logger or logging.getLogger(__name__)
        self.logger.info(f"Using device: {self.device}")
        
        try:
            self.processor = AutoProcessor.from_pretrained(model_name, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name, 
                trust_remote_code=True,
                torch_dtype=torch.float16 if self.device != "cpu" else torch.float32
            ).to(self.device)
            self.logger.info("Florence-2 model loaded successfully")
        except Exception as e:
            self.logger.error(f"Error loading Florence-2 model: {e}")
            self.logger.error("Make sure you have transformers>=4.40.0 and torch installed")
            raise

    def _get_optimal_device(self) -> str:
        """Determine the best available device for processing."""
        if torch.backends.mps.is_available():
            return "mps"
        elif torch.cuda.is_available():
            return "cuda"
        else:
            return "cpu"

    def extract_text_from_image(self, image_path: str) -> str:
        """Extract text from an image using Florence-2 OCR."""
        try:
            image = Image.open(image_path).convert('RGB')
            
            # Use OCR task prompt
            prompt = "<OCR>"
            inputs = self.processor(text=prompt, images=image, return_tensors="pt")
            
            # Ensure consistent dtype - force float32 for all devices
            inputs["pixel_values"] = inputs["pixel_values"].to(torch.float32)
            inputs["input_ids"] = inputs["input_ids"].to(self.device)
            inputs["pixel_values"] = inputs["pixel_values"].to(self.device)
            
            # Force model to float32 to match input dtype
            self.model = self.model.to(torch.float32)
            
            generated_ids = self.model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=1024,
                do_sample=False,
                num_beams=1
            )
            
            generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
            parsed_answer = self.processor.post_process_generation(
                generated_text, 
                task="<OCR>", 
                image_size=(image.width, image.height)
            )
            
            return parsed_answer.get("<OCR>", "")
            
        except Exception as e:
            self.logger.error(f"Error processing {image_path}: {e}")
            return ""


class TesseractOCRProcessor:
    """Fast OCR using Tesseract (primary). Uses LSTM (OEM 1) and PSM 6 for higher accuracy."""

    def __init__(self,
                 lang: str = "eng",
                 oem: int = 1,
                 psm: int = 6,
                 tessdata_dir: Optional[str] = None,
                 logger: logging.Logger = None):
        self.lang = lang
        self.oem = oem  # 1 = LSTM only (best quality)
        self.psm = psm  # 6 = Assume a single uniform block of text
        self.logger = logger or logging.getLogger(__name__)

        # Build the config string for Tesseract
        self.tess_config = f"--oem {self.oem} --psm {self.psm}"

        if tessdata_dir:
            os.environ["TESSDATA_PREFIX"] = tessdata_dir
            self.logger.info(f"Using custom tessdata directory: {tessdata_dir}")

        # Verify Tesseract is available
        try:
            pytesseract.get_tesseract_version()
        except Exception as e:
            self.logger.error("Tesseract is not installed or not in PATH.")
            raise e

    def extract_text_from_image(self, image_path: str) -> str:
        try:
            text = pytesseract.image_to_string(Image.open(image_path), lang=self.lang, config=self.tess_config)
            return text.strip()
        except Exception as e:
            self.logger.error(f"Tesseract error on {image_path}: {e}")
            return ""


class ImageOrganizer:
    def __init__(self, config_path: str = "config.json", logger: logging.Logger = None):
        """Initialize the image organizer with configuration."""
        self.config_path = config_path
        self.logger = logger or logging.getLogger(__name__)
        self.patterns = self.load_config()
        self.supported_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
        
    def load_config(self) -> Dict[str, str]:
        """Load text patterns and renaming rules from config file."""
        if not os.path.exists(self.config_path):
            # Create default config if it doesn't exist
            default_config = {
                "Ex1": "2025_01_20",
                "Ex2": "2025_02_13kim"
            }
            with open(self.config_path, 'w') as f:
                json.dump(default_config, f, indent=2)
            self.logger.info(f"Created default config at {self.config_path}")
            return default_config
        
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Error loading config: {e}")
            return {}

    def find_images(self, root_folder: str) -> List[str]:
        """Recursively find all images in the given folder and subfolders."""
        image_paths = []
        root_path = Path(root_folder)
        
        if not root_path.exists():
            self.logger.error(f"Folder {root_folder} does not exist")
            return image_paths
            
        for file_path in root_path.rglob('*'):
            # Skip macOS metadata files (e.g., ._somefile.jpg)
            if file_path.name.startswith('._'):
                continue

            if file_path.is_file() and file_path.suffix.lower() in self.supported_formats:
                image_paths.append(str(file_path))
        
        self.logger.info(f"Found {len(image_paths)} images")
        return sorted(image_paths)

    def match_text_patterns(self, text: str) -> Optional[Tuple[str, str]]:
        """Check if any configured pattern is found in the text as a whole word."""
        for pattern, replacement in self.patterns.items():
            # Use word boundaries (\b) to ensure whole word matching.
            # re.escape handles any special regex characters in the pattern.
            try:
                if re.search(r'\b' + re.escape(pattern) + r'\b', text, re.IGNORECASE):
                    self.logger.info(f"Found exact match for pattern '{pattern}'")
                    return pattern, replacement
            except re.error as e:
                self.logger.error(f"Regex error for pattern '{pattern}': {e}")
        
        return None

    def organize_image(self, image_path: str, pattern: str, target_suffix: str, output_base_dir: str = "organized") -> Optional[Path]:
        """Copy image to the output directory, compress it, and rename it. Returns Path to saved image."""
        try:
            source_path = Path(image_path)
            output_dir = Path(output_base_dir)

            # Create output directory if it doesn't exist
            output_dir.mkdir(parents=True, exist_ok=True)

            # Construct new filename
            original_folder = source_path.parent.name
            stem = source_path.stem
            suffix = source_path.suffix.lower()
            new_filename = f"{target_suffix}_{pattern}_{stem}{suffix}"
            new_file_path = output_dir / new_filename

            # Open, compress, and save image
            with Image.open(source_path) as img:
                img = img.convert('RGB')
                
                # Resize if too large (max 1920px on longest side)
                max_size = 1920
                if max(img.size) > max_size:
                    ratio = max_size / max(img.size)
                    new_size = tuple(int(dim * ratio) for dim in img.size)
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                # Save with compression
                if suffix in ['.jpg', '.jpeg']:
                    img.save(new_file_path, 'JPEG', quality=85, optimize=True)
                elif suffix == '.png':
                    img.save(new_file_path, 'PNG', optimize=True)
                elif suffix == '.webp':
                    img.save(new_file_path, 'WebP', quality=85, method=6)
                else:
                    img.save(new_file_path)  # Fallback

            self.logger.info(f"Compressed and saved: {source_path.name} -> {new_file_path.name}")
            return new_file_path
            
        except Exception as e:
            self.logger.error(f"Error organizing {image_path}: {e}")
            return None


def setup_logger():
    """Configure logger for console output."""
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    if not logger.handlers:
        logger.addHandler(handler)
    return logger


def main():
    # --- Configuration ---
    # Set your paths and model here
    config = {
        "input_folder": "/Volumes/SANTODISCO/HYPE&DATA/NON_COMPRESSED_VIDEOS/6_SCANS",  # <<< SET YOUR INPUT FOLDER HERE
        "output_folder": "organized_images",          # <<< SET YOUR OUTPUT FOLDER HERE
        "config_file": "config.json",
        "model_name": "microsoft/Florence-2-large"
    }
    # -------------------

    logger = setup_logger()

    # Verify input folder exists
    if not os.path.exists(config["input_folder"]):
        logger.error(f"Error: Input folder not found at '{config['input_folder']}'")
        logger.error("Please update the 'input_folder' variable in the script.")
        return

    # Initialize components
    organizer = ImageOrganizer(config["config_file"], logger=logger)
    tesseract_processor = TesseractOCRProcessor(logger=logger)
    florence_processor = FlorenceOCRProcessor(config["model_name"], logger=logger)
    
    # Find all images
    images = organizer.find_images(config["input_folder"])
    if not images:
        logger.warning("No images found in the specified folder.")
        return
    
    # Process images
    processed_count = 0
    matched_count = 0
    
    logger.info(f"Processing {len(images)} images...")
    
    with tqdm(total=len(images), desc="Processing Images", unit="image") as pbar:
        for image_path in images:
            filename = Path(image_path).name
            pbar.set_description(f"Processing {filename}")

            # --- First pass: Tesseract ---
            tess_text = tesseract_processor.extract_text_from_image(image_path)
            logger.info(f"(tesseract) Extracted {len(tess_text)} chars from {filename}")

            match_result = organizer.match_text_patterns(tess_text) if tess_text else None

            if match_result:
                ocr_source = "tesseract"
                extracted_text = tess_text
            else:
                # Fallback to Florence only if Tesseract found no match (or no text)
                logger.info(f"No match with Tesseract on {filename}. Falling back to Florence...")
                extracted_text = florence_processor.extract_text_from_image(image_path)
                ocr_source = "florence"
                logger.info(f"(florence) Extracted {len(extracted_text)} chars from {filename}")
                match_result = organizer.match_text_patterns(extracted_text)

            if not extracted_text.strip():
                logger.warning(f"No text detected in {filename} using {ocr_source}")
                pbar.update(1)
                continue

            logger.info(f"({ocr_source}) Text preview [{filename}]: {extracted_text[:120].replace('\n',' ') + ('...' if len(extracted_text) > 120 else '')}")

            saved_path = None
            if match_result:
                pattern, suffix = match_result
                logger.info(f"Match '{pattern}' found in {filename} via {ocr_source}")
                saved_path = organizer.organize_image(image_path, pattern, suffix, config["output_folder"])
                if saved_path:
                    matched_count += 1
            else:
                logger.info(f"No matching pattern found for {filename} even after fallback")

            # Write OCR text to .txt file alongside saved image or in unmatched folder
            if saved_path:
                txt_path = saved_path.with_suffix('.txt')
            else:
                # Ensure output directory exists for unmatched files
                output_dir = Path(config["output_folder"])
                output_dir.mkdir(parents=True, exist_ok=True)
                txt_filename = f"UNMATCHED_{Path(image_path).stem}.txt"
                txt_path = output_dir / txt_filename

            try:
                with open(txt_path, 'w', encoding='utf-8') as f_txt:
                    f_txt.write(extracted_text)
            except Exception as e:
                logger.error(f"Failed to write OCR text for {filename}: {e}")

            processed_count += 1
            pbar.update(1)
    
    logger.info("--- Processing complete! ---")
    logger.info(f"Images processed: {processed_count}")
    logger.info(f"Images organized: {matched_count}")
    logger.info(f"Output directory: {config['output_folder']}")


if __name__ == "__main__":
    main()
