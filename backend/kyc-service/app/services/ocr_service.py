import pytesseract
from PIL import Image
import cv2
import numpy as np
import re

class OCRService:
    def __init__(self):
        pass

    def preprocess_image(self, image_path):
        img = cv2.imread(image_path)
        if img is None:
            return None
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh

    def extract_text(self, image_path, document_type="generic"):
        processed = self.preprocess_image(image_path)
        if processed is None:
            return {"raw_text": "", "extracted_data": {}, "confidence": 0}

        temp_path = image_path + "_processed.png"
        cv2.imwrite(temp_path, processed)

        custom_config = r'--oem 3 --psm 6 -l eng'
        text = pytesseract.image_to_string(Image.open(temp_path), config=custom_config)

        data = pytesseract.image_to_data(Image.open(temp_path), output_type=pytesseract.Output.DICT)
        confidences = [int(c) for c in data['conf'] if int(c) > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        if os.path.exists(temp_path):
            os.remove(temp_path)

        extracted_data = self.parse_document_data(text, document_type)

        return {
            "raw_text": text,
            "extracted_data": extracted_data,
            "confidence": round(avg_confidence, 2)
        }

    def parse_document_data(self, text, document_type):
        text = text.upper().replace("\n", " ")
        result = {"document_type": document_type}

        if document_type == "aadhaar":
            aadhaar_match = re.search(r'(\d{4}\s?\d{4}\s?\d{4})', text)
            if aadhaar_match:
                result["document_number"] = aadhaar_match.group(1).replace(" ", "")
            result["name"] = self.extract_name(text)
        elif document_type == "pan":
            pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text)
            if pan_match:
                result["document_number"] = pan_match.group(1)
            result["name"] = self.extract_name(text)
        elif document_type == "passport":
            pp_match = re.search(r'([A-Z][0-9]{7,8})', text)
            if pp_match:
                result["document_number"] = pp_match.group(1)
            result["name"] = self.extract_name(text)
        elif document_type == "driving_license":
            dl_match = re.search(r'(DL\d{2}\s?\d{4}\d{4,})', text)
            if dl_match:
                result["document_number"] = dl_match.group(1).replace(" ", "")
            result["name"] = self.extract_name(text)

        result["raw_text_preview"] = text[:500]
        return result

    def extract_name(self, text):
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            if len(line) > 3 and line.isalpha() and line not in ["NAME", "FATHER", "MOTHER", "ADDRESS"]:
                return line.title()
        return "Unknown"
