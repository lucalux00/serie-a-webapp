import os
import psycopg2
import requests
import json
from datetime import datetime, timedelta

API_KEY = "2fc579dbb539cbc9c2e4caa650d7b47f"
# The script will read the DB URL from the environment (set locally or via GitHub Secrets)
DB_URL = os.environ.get("POSTGRES_URL")

def fetch_odds(sport):
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds/?apiKey={API_KEY}&regions=eu&markets=h2h"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching {sport}: {e}")
        return []

def analyze_and_pick(match):
    home = match['home_team']
    away = match['away_team']
    
    if not match.get('bookmakers') or len(match['bookmakers']) == 0:
        return None
        
    bookmaker = match['bookmakers'][0]
    market = next((m for m in bookmaker['markets'] if m['key'] == 'h2h'), None)
    if not market or not market.get('outcomes'):
        return None
        
    home_odds = next((o['price'] for o in market['outcomes'] if o['name'] == home), 2.5)
    away_odds = next((o['price'] for o in market['outcomes'] if o['name'] == away), 2.5)
    draw_odds = next((o['price'] for o in market['outcomes'] if o['name'] == 'Draw'), 3.0)
    
    pick = ''
    final_odds = 0
    
    # Base logic (Tipster / Implied probability)
    # This is the starting point, to be expanded with Scikit-learn/Poisson later
    if home_odds < 1.55:
        pick = '1'
        final_odds = home_odds
    elif away_odds < 1.55:
        pick = '2'
        final_odds = away_odds
    elif home_odds < 2.0 and away_odds > 3.0:
        pick = '1X'
        final_odds = max(1.15, home_odds - 0.4)
    elif away_odds < 2.0 and home_odds > 3.0:
        pick = 'X2'
        final_odds = max(1.15, away_odds - 0.4)
    elif draw_odds < 3.20:
        pick = 'X'
        final_odds = draw_odds
    else:
        pick = 'Gol'
        final_odds = 1.75
        
    return {
        'id': match['id'],
        'match': f"{home} - {away}",
        'pick': pick,
        'odds': round(final_odds, 2),
        'commence_time': match['commence_time']
    }

def main():
    if not DB_URL:
        print("POSTGRES_URL environment variable is not set. Exiting.")
        return

    print("Inizio estrazione dati the-odds-api...")
    sports = ['soccer_italy_serie_a', 'soccer_uefa_champs_league', 'soccer_uefa_europa_league', 'upcoming']
    all_raw_data = []
    for sport in sports:
        all_raw_data.extend(fetch_odds(sport))
        
    print(f"Trovate {len(all_raw_data)} partite grezze. Filtraggio in corso...")
    
    valid_picks = []
    next_week_aware = datetime.now().astimezone() + timedelta(days=45) # 45 giorni per trovare partite in estate
    
    for match in all_raw_data:
        if match.get('sport_key') and not match['sport_key'].startswith('soccer_'):
            continue
            
        try:
            # Handle standard ISO 8601 strings from the API
            commence_time = datetime.fromisoformat(match['commence_time'].replace('Z', '+00:00'))
            
            if commence_time < next_week_aware:
                pick_data = analyze_and_pick(match)
                if pick_data:
                    valid_picks.append(pick_data)
        except Exception as e:
            continue
                
    # Remove duplicates
    unique_picks = list({p['id']: p for p in valid_picks}.values())
    
    print(f"Elaborate {len(unique_picks)} previsioni uniche. Salvataggio su Vercel Postgres...")
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Clear old predictions to keep the table fresh
        cur.execute("DELETE FROM ml_predictions;")
        
        insert_query = """
        INSERT INTO ml_predictions (id, match_name, pick, odds, match_date, algorithm_version)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        for p in unique_picks:
            cur.execute(insert_query, (
                p['id'],
                p['match'],
                p['pick'],
                p['odds'],
                p['commence_time'],
                'v1.0_heuristic'
            ))
            
        conn.commit()
        print(f"SUCCESSO: Inserite {len(unique_picks)} previsioni nel database.")
        
    except Exception as e:
        print(f"ERRORE Database: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()
