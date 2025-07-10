from pydantic import BaseModel, Field, field_validator

class Structure(BaseModel):
    tldr: str = Field(description="generate a too long; didn't read summary")
    motivation: str = Field(description="describe the motivation in this paper")
    method: str = Field(description="method of this paper")
    result: str = Field(description="result of this paper")
    conclusion: str = Field(description="conclusion of this paper")
    
    @field_validator('*')
    def escape_latex(cls, v):
        if isinstance(v, str):
            # Escape LaTeX backslashes
            return v.replace('\\', '\\\\')
        return v