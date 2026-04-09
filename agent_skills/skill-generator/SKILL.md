# Skill Generator

## Purpose
Automate the creation of standardized Agent Skill boilerplate and maintain a machine-readable registry for skill discovery.

## Language
Python

## Usage
Run the generator script to create a new skill directory, a `SKILL.md` playbook, and a boilerplate script.
```powershell
python agent_skills/skill-generator/generator.py "new-skill-name" "A brief description of the skill" --lang "python|javascript|typescript|bash"
```

The script will:
1. Create `agent_skills/new-skill-name/`
2. Generate `agent_skills/new-skill-name/SKILL.md`
3. Generate a boilerplate script (e.g., `new_skill_name.py`)
4. Register the new skill in `agent_skills/registry.json`

## Storage & Maintenance
- **Registry**: `agent_skills/registry.json` is the source of truth for all active skills.
- **Maintenance**: Periodically verify that all paths in the registry exist.

## Constraints & Rules
- Skill names should be kebab-case.
- Scripts should be colocated within their skill folder.
- Always read the generated `SKILL.md` to customize instructions.
