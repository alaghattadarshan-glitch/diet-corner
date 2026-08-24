# backend/app/ai/provider.py

import os
import json
import http.client
from typing import Dict, Any, Optional

def call_llm(prompt: str, system_instruction: str) -> Optional[str]:
    """
    Calls the configured external LLM provider if AI_API_KEY is available.
    Otherwise, returns None (triggering local high-fidelity generator/fallback).
    """
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        return None
        
    # Example integration with Gemini API (or OpenAI depending on the key)
    try:
        # Standard HTTP client call to avoid external dependency issues
        conn = http.client.HTTPSConnection("generativelanguage.googleapis.com")
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": f"System Instruction: {system_instruction}\n\nPrompt: {prompt}"}]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        url = f"/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        conn.request("POST", url, body=json.dumps(payload), headers=headers)
        res = conn.getresponse()
        data = res.read()
        conn.close()
        
        if res.status == 200:
            result_json = json.loads(data.decode("utf-8"))
            text = result_json["candidates"][0]["content"]["parts"][0]["text"]
            return text
    except Exception as e:
        print(f"Error calling LLM provider: {e}")
        
    return None
