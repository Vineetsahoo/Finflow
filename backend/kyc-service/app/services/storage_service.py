import os
import shutil

class LocalStorageService:
    """Local file storage service - no AWS dependency"""

    def __init__(self):
        self.base_path = os.getenv("STORAGE_PATH", "/app/storage")
        os.makedirs(self.base_path, exist_ok=True)

    def upload_file(self, file_path, relative_path):
        dest_path = os.path.join(self.base_path, relative_path)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy(file_path, dest_path)
        return f"file://{dest_path}"

    def download_file(self, file_url, local_path):
        if file_url.startswith("file://"):
            source = file_url.replace("file://", "")
            shutil.copy(source, local_path)
            return local_path
        shutil.copy(file_url, local_path)
        return local_path

    def delete_file(self, relative_path):
        full_path = os.path.join(self.base_path, relative_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
