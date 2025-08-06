from openai._client import OpenAI


import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from ../.env file
load_dotenv(dotenv_path='../.env')

client: OpenAI = OpenAI(
    base_url="https://models.github.ai/inference",
    api_key=os.getenv("GITHUB_TOKEN")  # or any PAT with models:read
)
model = "openai/gpt-4.1"
response = client.chat.completions.create(
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant.",
        },
        {
            "role": "user",
            "content": "What is the capital of France?",
        }
    ],
    temperature=1.0,
    top_p=1.0,
    model=model
)
print(response.choices[0].message.content)