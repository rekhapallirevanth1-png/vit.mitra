import zipfile
import xml.etree.ElementTree as ET
import json
import os

xlsx_path = 'vit.xlsx'
with zipfile.ZipFile(xlsx_path, 'r') as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
            text = ''.join(t.text or '' for t in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'))
            shared_strings.append(text)

    sheet1_xml = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    members = []
    for row in sheet1_xml.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
        row_idx = int(row.attrib.get('r'))
        if row_idx == 1:
            continue
        vals = {}
        for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
            ref = c.attrib.get('r')
            col = ''.join(x for x in ref if x.isalpha())
            t = c.attrib.get('t')
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else ''
            if t == 's' and val.isdigit():
                val = shared_strings[int(val)]
            vals[col] = val.strip()
        regNo = vals.get('A', '')
        name = vals.get('B', '')
        branch = vals.get('C', '')
        team = vals.get('D', '')
        if regNo and name:
            members.append({
                'regNo': regNo,
                'name': name,
                'branch': branch,
                'team': team
            })

os.makedirs('data', exist_ok=True)
with open('data/xlsx_members.json', 'w', encoding='utf-8') as f:
    json.dump(members, f, indent=2, ensure_ascii=False)

print(f"Successfully extracted {len(members)} members from vit.xlsx to data/xlsx_members.json")
for i, m in enumerate(members, 1):
    print(f"{i:02d}. {m['regNo']} | {m['name']} | {m['branch']} | {m['team']}")
