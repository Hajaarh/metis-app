"""Smoke test Mistral : chat completion simple.

Usage :
    python scripts/try_mistral.py [prompt...]
    docker compose exec backend python scripts/try_mistral.py "Résume en une phrase le RGPD"
"""
import os
import sys

from dotenv import load_dotenv
from mistralai.client import Mistral


DEFAULT_PROMPT = "En une phrase, quelle est la meilleure specialite fromagere francaise ?"
MODEL = "mistral-small-latest"


def main() -> int:
    load_dotenv()
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("MISTRAL_API_KEY manquante (voir .env.example)", file=sys.stderr)
        return 1

    prompt = " ".join(sys.argv[1:]) or DEFAULT_PROMPT

    client = Mistral(api_key=api_key)
    print(f"Modele : {MODEL}")
    print(f"Prompt : {prompt}")
    print("Appel...")

    response = client.chat.complete(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )

    print()
    print(response.choices[0].message.content)
    print()
    if response.usage:
        u = response.usage
        print(f"Tokens : prompt={u.prompt_tokens}, completion={u.completion_tokens}, total={u.total_tokens}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
