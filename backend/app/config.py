from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    gemini_api_key: str

    gemini_model: str = "gemini-3.8-flash"

    allowed_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    @property
    def origins(self) -> list[str]:

        if self.allowed_origins.strip() == "*":
            return ["*"]

        return [
            x.strip()
            for x in self.allowed_origins.split(",")
            if x.strip()
        ]


settings = Settings()
