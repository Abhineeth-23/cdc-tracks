# backend/app/services/project_service.py
import os
import zipfile
import xml.etree.ElementTree as ET
from sqlalchemy.orm import Session
from app.models import ProjectTopic

TRACK_SHEET_MAP = {
    "Cloud  DevOps  Security Enginee": "cloud-engineer-devops-engineer-cyber-security-engineer",
    "Data Analyst  Data Scientist  A": "data-analyst-data-scientist-ai-ml-engineer",
    "Full Stack Development": "full-stack-developer",
    "Software Engineer  Developer": "software-engineer-software-developer",
    "HITAM Related Projects": "hitam-projects"
}

def seed_project_topics_data(db: Session, excel_path: str = None):
    if not excel_path:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        excel_path = os.path.abspath(os.path.join(current_dir, "../../../misc/III-I Project Topics.xlsx"))

    if not os.path.exists(excel_path):
        print(f"Project Excel not found at {excel_path}")
        return

    # Check if project topics are already seeded
    existing_count = db.query(ProjectTopic).count()
    if existing_count > 0:
        print(f"Project topics already seeded ({existing_count} records). Skipping excel parse.")
        return

    try:
        z = zipfile.ZipFile(excel_path)
        
        # Load shared strings
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in ss_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                t_elems = si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                strings.append(''.join([t.text for t in t_elems if t.text]))

        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        sheets = wb_tree.findall('main:sheets/main:sheet', ns)

        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel_map = {
            r.attrib['Id']: r.attrib['Target'] 
            for r in rels_tree.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship')
        }

        inserted_count = 0

        for sheet_elem in sheets:
            sheet_name = sheet_elem.attrib.get('name', '').strip()
            r_id = sheet_elem.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            
            target = rel_map.get(r_id)
            if not target:
                continue
                
            sheet_path = 'xl/' + target if not target.startswith('xl/') else target
            if sheet_path not in z.namelist():
                continue

            sheet_data = ET.fromstring(z.read(sheet_path))
            rows = sheet_data.findall('.//main:row', ns)
            if not rows:
                continue

            track_slug = TRACK_SHEET_MAP.get(sheet_name)
            if not track_slug:
                # Fallback matching
                for k, v in TRACK_SHEET_MAP.items():
                    if k.lower() in sheet_name.lower() or sheet_name.lower() in k.lower():
                        track_slug = v
                        break
            if not track_slug:
                track_slug = sheet_name.lower().replace(' ', '-')

            is_hitam = (sheet_name == "HITAM Related Projects" or track_slug == "hitam-projects")

            # Process rows (skip row 1 which is header)
            for row in rows[1:]:
                row_vals = []
                for c in row.findall('main:c', ns):
                    v = c.find('main:v', ns)
                    t = c.attrib.get('t')
                    val = ""
                    if v is not None and v.text is not None:
                        if t == 's':
                            idx = int(v.text)
                            val = strings[idx] if idx < len(strings) else v.text
                        else:
                            val = v.text
                    row_vals.append(val)

                if not row_vals or len(row_vals) < 2:
                    continue

                project_code = row_vals[0].strip() if len(row_vals) > 0 else ""
                title = row_vals[1].strip() if len(row_vals) > 1 else ""
                if not project_code or not title:
                    continue

                problem_stmt = row_vals[2].strip() if len(row_vals) > 2 else ""
                key_obj = row_vals[3].strip() if len(row_vals) > 3 else ""
                techs = row_vals[4].strip() if len(row_vals) > 4 else ""
                concepts = row_vals[5].strip() if len(row_vals) > 5 else ""
                diff = row_vals[6].strip() if len(row_vals) > 6 else "Medium"

                topic = ProjectTopic(
                    project_code=project_code,
                    track_slug=track_slug,
                    title=title,
                    problem_statement=problem_stmt,
                    key_objectives=key_obj,
                    technologies=techs,
                    concepts=concepts,
                    difficulty=diff,
                    is_hitam=is_hitam
                )
                db.add(topic)
                inserted_count += 1

        db.commit()
        print(f"Successfully seeded {inserted_count} project topics into database.")
    except Exception as e:
        db.rollback()
        print(f"Failed to seed project topics: {e}")
