import os
import psycopg2
import feedparser
import time
from urllib.parse import urlparse

DB_URL = os.environ.get("POSTGRES_URL")

DIRECT_RSS_SOURCES = [
    'https://www.calciomercato.com/rss',
    'https://www.gianlucadimarzio.com/feed',
    'https://www.tuttomercatoweb.com/rss.xml',
    'https://www.corrieredellosport.it/rss/calcio',
    'https://sport.sky.it/rss/sport_calcio.xml',
    'https://www.sportmediaset.mediaset.it/rss/calcio.xml',
    'https://www.tuttosport.com/rss/calcio',
    'https://www.alfredopedulla.com/feed/'
]

def setup_db(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS news (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            link TEXT NOT NULL UNIQUE,
            pub_date VARCHAR(50),
            source VARCHAR(50),
            clean_title VARCHAR(255),
            snippet TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)

def fetch_feed(url):
    print(f"Fetching RSS: {url}")
    try:
        feed = feedparser.parse(url)
        return feed.entries
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

def get_source_from_url(url):
    try:
        domain = urlparse(url).netloc.replace('www.', '').split('.')[0]
        source_map = {
            'gianlucadimarzio': 'Di Marzio',
            'tuttomercatoweb': 'TMW',
            'calciomercato': 'CM.com',
            'corrieredellosport': 'CdS',
            'gazzetta': 'Gazzetta',
            'skysport': 'Sky Sport',
            'sport': 'Sky Sport',
        }
        for k, v in source_map.items():
            if k in domain.lower(): return v
        return domain.capitalize()
    except:
        return 'News'

def clean_html(raw_html):
    import re
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html).strip()

def main():
    if not DB_URL:
        print("Errore: POSTGRES_URL non trovato.")
        return

    all_items = []
    
    for url in DIRECT_RSS_SOURCES:
        entries = fetch_feed(url)
        for item in entries:
            raw_title = item.get('title', '')
            link = item.get('link', '')
            if not raw_title or not link: continue
            
            clean_title = raw_title.split(' - ')[0].split(' | ')[0].strip()
            
            raw_snippet = item.get('summary', item.get('description', ''))
            snippet = clean_html(raw_snippet)[:600]
            
            source = get_source_from_url(link)
            
            # Formato pub_date: proviamo a prenderlo, altrimenti stringa vuota
            pub_date = item.get('published', '')
            
            all_items.append({
                'title': raw_title[:250],
                'link': link,
                'pub_date': pub_date,
                'source': source,
                'clean_title': clean_title[:250],
                'snippet': snippet
            })
            
    if not all_items:
        print("Nessuna news trovata.")
        return
        
    print(f"Trovate {len(all_items)} news totali. Salvataggio su Postgres...")
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        setup_db(cur)
        
        # Pulisci le news vecchie per mantenere la tabella leggera
        cur.execute("TRUNCATE news RESTART IDENTITY;")
        
        insert_query = """
            INSERT INTO news (title, link, pub_date, source, clean_title, snippet)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (link) DO NOTHING
        """
        
        inserted = 0
        for item in all_items:
            try:
                cur.execute(insert_query, (
                    item['title'], item['link'], item['pub_date'],
                    item['source'], item['clean_title'], item['snippet']
                ))
                inserted += 1
            except Exception as e:
                # Ignoriamo la singola riga problematica
                pass
                
        conn.commit()
        print(f"SUCCESSO: Inserite {inserted} news fresche nel database.")
        
    except Exception as e:
        print(f"ERRORE Database: {e}")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    main()
