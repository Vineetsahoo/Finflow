from deepface import DeepFace

class FaceMatchService:
    def __init__(self, model_name="Facenet", distance_threshold=0.4):
        self.model_name = model_name
        self.distance_threshold = distance_threshold

    def verify_match(self, img1_path, img2_path):
        try:
            result = DeepFace.verify(
                img1_path=img1_path,
                img2_path=img2_path,
                model_name=self.model_name,
                distance_metric="cosine",
                enforce_detection=False,
                align=True
            )

            confidence = max(0, min(100, (1 - result["distance"] / self.distance_threshold) * 100))

            return {
                "verified": result["verified"],
                "distance": round(result["distance"], 4),
                "confidence": round(confidence, 2),
                "model": self.model_name,
                "threshold": self.distance_threshold
            }
        except Exception as e:
            return {
                "verified": False,
                "distance": 1.0,
                "confidence": 0.0,
                "model": self.model_name,
                "error": str(e)
            }

    def analyze_face(self, img_path):
        try:
            analysis = DeepFace.analyze(
                img_path=img_path,
                actions=['age', 'gender', 'emotion', 'race'],
                enforce_detection=False
            )
            return {
                "success": True,
                "analysis": analysis[0] if isinstance(analysis, list) else analysis
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
