import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:3b"

def _call_ollama(prompt: str) -> str:
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    response = requests.post(OLLAMA_URL, json=payload)
    response.raise_for_status()
    
    return response.json().get("response", "")

def _extract_json_from_response(text: str):
    """Safely extracts JSON list/dict from markdown backticks or plain text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'```(?:json)?(.*?)```', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass
                
    return None

def analyze_file_diff(context):
    prompt = f"""
You are a senior software engineer doing a thorough pull request review.

You will analyze the file changes in two steps:

Step 1 - THINK:
Carefully reason through the code changes. Consider:
- What does this code do?
- Are there any security vulnerabilities? (SQL injection, exposed secrets, unvalidated input)
- Are there logic errors or edge cases that will cause bugs or crashes?
- Are there performance problems? (unnecessary loops, missing indexes, blocking calls)
- Are there bad practices? (missing error handling, hardcoded values, missing encoding)
- Are there missing or incorrect exception handling patterns?
Think through each function or block changed in the diff carefully.

Step 2 - OUTPUT:
Based on your thinking, return a JSON object listing every real issue found.

File Context (JSON):
{context}

Note: The context may contain `full_file_skeleton` or `full_file_content`. 
If it is a skeleton, we have used "Semantic Chunking" to compress the file:
- Imports and globals are preserved.
- Modified functions are preserved entirely.
- Unmodified function and method bodies have been stripped and replaced with `...  # unchanged` to save space.

Return JSON format:

{{
  "reasoning": "Your detailed step-by-step analysis from Step 1",
  "issues": [
    {{
      "file": "path/to/file",
      "line": null,  # Use an integer for actual changed line numbers, or null if unknown
      "severity": "low | medium | high | critical",
      "description": "Clear explanation of the problem and why it matters",
      "fix": "Concrete code snippet showing the fix"
    }}
  ]
}}

Important:
- Always return null for line numbers if unchanged or unknown.
- Do not return placeholder strings like '... # unchanged'.
- Ensure all returned JSON is valid and parseable.
"""
    try:
        response_text = _call_ollama(prompt)
        parsed = _extract_json_from_response(response_text)
        if parsed and isinstance(parsed, dict) and "issues" in parsed:
            # We expected a JSON string representing `{"issues": [...]}` based on our new prompt
            return json.dumps(parsed)
        return '{"issues": []}'
    except Exception as e:
        print(f"Error calling Ollama for file context: {e}")
        return '{"issues": []}'

def generate_final_summary(pr_title, pr_description, all_issues):
    prompt = f"""
You are a senior software engineer finalizing a pull request review.

Based on the title, description, and the list of issues found during the file-by-file review, provide a final decision and an overall summary.

PR Title: {pr_title}
PR Description: {pr_description}
Found Issues: {all_issues}

Return JSON format:

{{
 "decision": "approved or rejected",
 "summary": "A 2-3 sentence overview of why the PR was approved or rejected based on the found issues."
}}
"""
    try:
        response_text = _call_ollama(prompt)
        parsed = _extract_json_from_response(response_text)
        if parsed and isinstance(parsed, dict) and "decision" in parsed and "summary" in parsed:
             return json.dumps(parsed)
             
        # Fallback if the LLM hallucinated the schema
        return json.dumps({
            "decision": "comment",
            "summary": "AI Review completed, but the model did not return a valid structured summary. Please check the individual file comments."
        })
    except Exception as e:
        print(f"Error generating final summary via Ollama: {e}")
        return json.dumps({
            "decision": "comment",
            "summary": "Could not generate final summary due to API error."
        })