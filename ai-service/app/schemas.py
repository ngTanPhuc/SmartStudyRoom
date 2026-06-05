from pydantic import AliasChoices, BaseModel, Field


class SpeechInputRequest(BaseModel):
    rawtext: str = Field(validation_alias=AliasChoices("rawtext", "rawText"))


class SpeechInputResult(BaseModel):
    predictLabel: str
    confidence: float
