from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gladia_api_key: str = ""
    mistral_api_key: str = ""
    mistral_model: str = "mistral-large-latest"
    supabase_url: str = ""
    supabase_service_key: str = ""
    max_upload_mb: int = 1024
    default_retention_days: int = 30


settings = Settings()
