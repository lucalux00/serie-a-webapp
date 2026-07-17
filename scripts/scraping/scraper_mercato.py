import os
import psycopg2
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime

DB_URL = os.environ.get("POSTGRES_URL")

LEAGUES = {
    'A': 'https://www.transfermarkt.it/serie-a/letztetransfers/wettbewerb/IT1',
    'B': 'https://www.transfermarkt.it/serie-b/letztetransfers/wettbewerb/IT2',
    'PL': 'https://www.transfermarkt.it/premier-league/letztetransfers/wettbewerb/GB1',
    'LL': 'https://www.transfermarkt.it/laliga/letztetransfers/wettbewerb/ES1'
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
}

def setup_db(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS mercato_live (
            id SERIAL PRIMARY KEY,
            league VARCHAR(10) NOT NULL,
            status VARCHAR(50),
            transfer_type VARCHAR(50),
            team VARCHAR(100),
            player VARCHAR(100),
            from_to VARCHAR(150),
            fee VARCHAR(50),
            transfer_date VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)

def scrape_league(league_code, url):
    print(f"Scraping {league_code} -> {url}")
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        transfers = []
        rows = soup.select('.items tbody tr')
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 5:
                continue
                
            try:
                player_link = cols[0].select_one('.hauptlink a')
                if not player_link: continue
                player_name = player_link.text.strip()
                
                left_team_link = cols[3].select_one('.hauptlink a')
                left_team = left_team_link.text.strip() if left_team_link else 'Svincolato'
                
                joined_team_link = cols[4].select_one('.hauptlink a')
                joined_team = joined_team_link.text.strip() if joined_team_link else 'Svincolato'
                
                fee = cols[7].text.strip() if len(cols) > 7 else '?'
                date_text = cols[5].text.strip() if len(cols) > 5 else 'Oggi'
                
                transfer_type = 'acquisto'
                team_to_display = joined_team
                from_to_display = f"da {left_team}"
                
                fee_lower = fee.lower()
                if 'gratuito' in fee_lower or 'svincolato' in fee_lower or left_team == 'Svincolato' or joined_team == 'Svincolato':
                    transfer_type = 'svincolato'
                elif 'prestito' in fee_lower:
                    transfer_type = 'prestito'
                    
                transfers.append({
                    'league': league_code,
                    'status': 'ufficiale',
                    'transfer_type': transfer_type,
                    'team': team_to_display,
                    'player': player_name,
                    'from_to': from_to_display,
                    'fee': fee,
                    'transfer_date': date_text
                })
            except Exception as e:
                # Skip riga malformata
                pass
                
        return transfers
    except Exception as e:
        print(f"Errore scraping {league_code}: {e}")
        return []

def main():
    if not DB_URL:
        print("Errore: POSTGRES_URL non trovato.")
        return

    all_transfers = []
    for code, url in LEAGUES.items():
        league_transfers = scrape_league(code, url)
        all_transfers.extend(league_transfers)
        time.sleep(2) # Pausa anti-ban
        
    if not all_transfers:
        print("Nessun trasferimento trovato. Terminazione.")
        return
        
    print(f"Trovati {len(all_transfers)} trasferimenti totali. Salvataggio su Vercel Postgres...")
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        setup_db(cur)
        
        # Pulisci vecchi trasferimenti per evitare duplicati infiniti
        cur.execute("TRUNCATE mercato_live RESTART IDENTITY;")
        
        insert_query = """
            INSERT INTO mercato_live (league, status, transfer_type, team, player, from_to, fee, transfer_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for t in all_transfers:
            cur.execute(insert_query, (
                t['league'], t['status'], t['transfer_type'], 
                t['team'], t['player'], t['from_to'], 
                t['fee'], t['transfer_date']
            ))
            
        conn.commit()
        print(f"SUCCESSO: Inseriti {len(all_transfers)} trasferimenti nel database.")
        
    except Exception as e:
        print(f"ERRORE Database: {e}")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    main()
