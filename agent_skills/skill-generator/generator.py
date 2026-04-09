import os
import json
import argparse
import sys
from datetime import datetime

# Path to the registry file relative to the script
REGISTRY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'registry.json')

def create_skill(name, purpose, language):
    # Normalize path
    skill_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), name)
    
    if os.path.exists(skill_dir):
        print(f"Error: Skill directory already exists at {skill_dir}")
        sys.exit(1)
        
    os.makedirs(skill_dir)
    print(f"Created directory: {skill_dir}")
    
    # Define script extension
    ext_map = {
        'python': 'py',
        'javascript': 'mjs',
        'typescript': 'ts',
        'bash': 'sh'
    }
    ext = ext_map.get(language.lower(), 'txt')
    script_filename = f"main.{ext}" if language.lower() != 'python' else f"{name.replace('-', '_')}.py"
    
    # 1. Generate SKILL.md
    skill_md_content = f"""# {name.replace('-', ' ').title()}

## Purpose
{purpose}

## Language
{language}

## Usage
Explain how to run the script here.
```bash
# Example:
# node agent_skills/{name}/{script_filename}
# python agent_skills/{name}/{script_filename}
```

## Storage & Maintenance
- **Persistence**: Describe any persistent state (e.g., DuckDB, JSON files).
- **Maintenance**: Describe any required cleanup or optimization tasks.

## Constraints & Rules
- Always use localized paths.
- Avoid external network calls unless authorized.
"""
    with open(os.path.join(skill_dir, 'SKILL.md'), 'w', encoding='utf-8') as f:
        f.write(skill_md_content)
    print(f"Generated: SKILL.md")
    
    # 2. Generate Boilerplate Script
    script_content = ""
    if language.lower() == 'python':
        script_content = f"""import os
import sys

def main():
    print("Executing {name}...")
    # Add your logic here

if __name__ == "__main__":
    main()
"""
    elif language.lower() == 'javascript':
        script_content = f"""import os from 'os';
import path from 'path';

async function main() {{
    console.log("Executing {name}...");
    // Add your logic here
}}

main().catch(console.error);
"""
    
    with open(os.path.join(skill_dir, script_filename), 'w', encoding='utf-8') as f:
        f.write(script_content)
    print(f"Generated: {script_filename}")
    
    # 3. Update Registry
    update_registry(name, purpose, language, f"agent_skills/{name}/")

def update_registry(name, purpose, language, path_to_skill):
    if not os.path.exists(REGISTRY_PATH):
        data = {"skills": []}
    else:
        with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
    # Check if already exists
    if any(s['name'] == name for s in data['skills']):
        print(f"Note: {name} already exists in registry. Skipping registration.")
        return
        
    data['skills'].append({
        "name": name,
        "purpose": purpose,
        "language": language,
        "path": path_to_skill
    })
    
    # Sort by name
    data['skills'].sort(key=lambda x: x['name'])
    
    with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Updated registry: {REGISTRY_PATH}")

def main():
    parser = argparse.ArgumentParser(description="Generate a new Agent Skill boilerplate.")
    parser.add_argument("name", help="The name of the skill (kebab-case)")
    parser.add_argument("purpose", help="Brief purpose of the skill")
    parser.add_argument("--lang", default="python", help="Preferred language (default: python)")
    
    args = parser.parse_args()
    
    create_skill(args.name, args.purpose, args.lang)

if __name__ == "__main__":
    main()
