from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Scribe API"
    env: str = "dev"

    cors_origins: list[str] = ["http://localhost:3000"]

    supabase_url: str = ""
    supabase_publishable_key: str = ""

    gladia_api_key: str = ""
    mistral_api_key: str = ""
    local_asr_url: str = ""

    transcription_provider: str = "gladia"
    llm_provider: str = "mistral"


settings = Settings()
