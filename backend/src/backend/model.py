from typing import Optional
from pydantic import BaseModel, Field

class ScaffoldRequestModel(BaseModel):
    user_prompt: str
    app_name: str
    project_path: str
    brand_color: Optional[str] = None 
    image_urls: list[str] = Field(default_factory=list) 
    
class EditRequestModel(BaseModel):
    file_name: str
    file_path: str
    content: str
