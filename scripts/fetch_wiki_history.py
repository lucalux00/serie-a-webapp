import pandas as pd
import json
import re

def clean_year(y):
    y = str(y).replace('*', '').strip()
    match = re.search(r'\d{4}', y)
    if match:
        year = int(match.group())
        # Return format '1929/30' or '1929'
        return y
    return None

def fetch_la_liga():
    url = "https://en.wikipedia.org/wiki/List_of_Spanish_football_champions"
    dfs = pd.read_html(url)
    
    # The table is usually one of the first few
    for df in dfs:
        if 'Club' in df.columns and 'Winners' in df.columns and 'Winning years' in df.columns:
            res = []
            for _, row in df.iterrows():
                club = row['Club']
                years_str = str(row['Winning years'])
                years = [y.strip() for y in years_str.split(',') if clean_year(y)]
                if len(years) > 0:
                    res.append({'team': club, 'wins': years})
            return res
    return []

print(json.dumps(fetch_la_liga(), indent=2))
