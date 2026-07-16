import urllib.request
import re
import json

def fetch_wiki_winners(url, league):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    
    # We will just extract the table that contains the "Winning years"
    table_pattern = re.compile(r'<table class="wikitable[^>]*>.*?</table>', re.DOTALL)
    tables = table_pattern.findall(html)
    
    for table in tables:
        if 'Winning years' in table or 'Winning Seasons' in table or 'Years won' in table or 'Winning years' in table:
            rows = re.findall(r'<tr.*?>(.*?)</tr>', table, re.DOTALL)
            results = []
            for row in rows:
                cols = re.findall(r'<t[dh].*?>(.*?)</t[dh]>', row, re.DOTALL)
                if len(cols) >= 3:
                    # Strip html tags
                    clean_cols = [re.sub(r'<[^>]+>', '', c).strip() for c in cols]
                    club = clean_cols[0].replace('&#160;', '').replace('&amp;', '&').strip()
                    club = re.sub(r'\[.*?\]', '', club)
                    
                    # Usually winning years is in the 3rd or 4th column
                    years_col = clean_cols[2] if len(clean_cols[2]) > 5 else clean_cols[-1]
                    
                    years = re.findall(r'\b(18\d{2}(?:[/-]\d{2,4})?|19\d{2}(?:[/-]\d{2,4})?|20\d{2}(?:[/-]\d{2,4})?)\b', years_col)
                    if len(years) > 0 and club and club != 'Club' and club != 'Team':
                        results.append({'team': club, 'wins': years})
            if results:
                return results
    return []

print(json.dumps({
    'LL': fetch_wiki_winners("https://en.wikipedia.org/wiki/List_of_Spanish_football_champions", 'LL'),
    'BL': fetch_wiki_winners("https://en.wikipedia.org/wiki/List_of_German_football_champions", 'BL'),
    'L1': fetch_wiki_winners("https://en.wikipedia.org/wiki/List_of_French_football_champions", 'L1')
}, indent=2))
