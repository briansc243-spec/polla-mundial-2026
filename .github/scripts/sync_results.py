#!/usr/bin/env python3
"""
Sync FIFA World Cup 2026 match results from ESPN API to Supabase.
Runs every 10 minutes via GitHub Actions. Idempotent — safe to re-run.
"""
import os, json, urllib.request, re, sys
from datetime import datetime, timezone

SUPABASE_URL = os.environ['SUPABASE_URL']
ANON_KEY     = os.environ['SUPABASE_ANON_KEY']
ESPN_URL     = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719'

ESPN_TO_ES = {
    'Mexico': 'México', 'South Africa': 'Sudáfrica',
    'South Korea': 'Corea del Sur', 'Czechia': 'Chequia',
    'Canada': 'Canadá', 'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
    'Switzerland': 'Suiza', 'Qatar': 'Qatar',
    'United States': 'USA', 'Paraguay': 'Paraguay',
    'Australia': 'Australia', 'Sweden': 'Suecia',
    'Germany': 'Alemania', 'Curaçao': 'Curazao',
    'Ivory Coast': 'Costa de Marfil', 'Ecuador': 'Ecuador',
    'Netherlands': 'Países Bajos', 'Japan': 'Japón',
    'New Zealand': 'Nueva Zelanda', 'Tunisia': 'Túnez',
    'Belgium': 'Bélgica', 'Egypt': 'Egipto',
    'Iran': 'Irán', 'Saudi Arabia': 'Arabia Saudita',
    'Spain': 'España', 'Cape Verde': 'Cabo Verde',
    'Uruguay': 'Uruguay', 'Haiti': 'Haití',
    'France': 'Francia', 'Iraq': 'Iraq',
    'Senegal': 'Senegal', 'Norway': 'Noruega',
    'Argentina': 'Argentina', 'Algeria': 'Algeria',
    'Austria': 'Austria', 'Jordan': 'Jordania',
    'Uzbekistan': 'Uzbekistán', 'Panama': 'Panamá',
    'Portugal': 'Portugal', 'Congo DR': 'Congo DR',
    'England': 'Inglaterra', 'Croatia': 'Croacia',
    'Ghana': 'Ghana', 'Morocco': 'Marruecos',
    'Colombia': 'Colombia', 'Brazil': 'Brasil',
    'Türkiye': 'Turquía', 'Scotland': 'Escocia',
    'Serbia': 'Serbia', 'Denmark': 'Dinamarca',
    'Poland': 'Polonia', 'Ukraine': 'Ucrania',
    'Hungary': 'Hungría', 'Slovakia': 'Eslovaquia',
    'Romania': 'Rumania', 'Slovenia': 'Eslovenia',
    'Albania': 'Albania', 'Czech Republic': 'Chequia',
    'Türkiye': 'Turquía', 'Wales': 'Gales',
    'Costa Rica': 'Costa Rica', 'Honduras': 'Honduras',
    'Jamaica': 'Jamaica', 'Bolivia': 'Bolivia',
    'Chile': 'Chile', 'Peru': 'Perú',
    'Venezuela': 'Venezuela', 'Ecuador': 'Ecuador',
    'Cameroon': 'Camerún', 'Nigeria': 'Nigeria',
    'Tunisia': 'Túnez', 'Mali': 'Malí',
    'Ivory Coast': 'Costa de Marfil',
    'South Korea': 'Corea del Sur',
    'Saudi Arabia': 'Arabia Saudita',
    'United Arab Emirates': 'Emiratos Árabes',
    'New Zealand': 'Nueva Zelanda',
}

# Group stage: (id, team1_es, team2_es)
MATCHES = [
    (1,  'México',           'Sudáfrica'),
    (2,  'Corea del Sur',    'Chequia'),
    (3,  'México',           'Corea del Sur'),
    (4,  'Chequia',          'Sudáfrica'),
    (5,  'Sudáfrica',        'Corea del Sur'),
    (6,  'Chequia',          'México'),
    (7,  'Qatar',            'Suiza'),
    (8,  'Canadá',           'Bosnia y Herzegovina'),
    (9,  'Suiza',            'Bosnia y Herzegovina'),
    (10, 'Canadá',           'Qatar'),
    (11, 'Bosnia y Herzegovina', 'Qatar'),
    (12, 'Suiza',            'Canadá'),
    (13, 'Brasil',           'Marruecos'),
    (14, 'Haití',            'Escocia'),
    (15, 'Escocia',          'Marruecos'),
    (16, 'Brasil',           'Haití'),
    (17, 'Marruecos',        'Haití'),
    (18, 'Escocia',          'Brasil'),
    (19, 'USA',              'Paraguay'),
    (20, 'Australia',        'Turquía'),
    (21, 'USA',              'Australia'),
    (22, 'Turquía',          'Paraguay'),
    (23, 'Paraguay',         'Australia'),
    (24, 'Turquía',          'USA'),
    (25, 'Alemania',         'Curazao'),
    (26, 'Costa de Marfil',  'Ecuador'),
    (27, 'Ecuador',          'Curazao'),
    (28, 'Alemania',         'Costa de Marfil'),
    (29, 'Curazao',          'Costa de Marfil'),
    (30, 'Ecuador',          'Alemania'),
    (31, 'Países Bajos',     'Japón'),
    (32, 'Suecia',           'Túnez'),
    (33, 'Túnez',            'Japón'),
    (34, 'Países Bajos',     'Suecia'),
    (35, 'Túnez',            'Países Bajos'),
    (36, 'Japón',            'Suecia'),
    (37, 'Bélgica',          'Egipto'),
    (38, 'Irán',             'Nueva Zelanda'),
    (39, 'Bélgica',          'Irán'),
    (40, 'Nueva Zelanda',    'Egipto'),
    (41, 'Egipto',           'Irán'),
    (42, 'Nueva Zelanda',    'Bélgica'),
    (43, 'España',           'Cabo Verde'),
    (44, 'Arabia Saudita',   'Uruguay'),
    (45, 'España',           'Arabia Saudita'),
    (46, 'Uruguay',          'Cabo Verde'),
    (47, 'Uruguay',          'España'),
    (48, 'Cabo Verde',       'Arabia Saudita'),
    (49, 'Francia',          'Senegal'),
    (50, 'Iraq',             'Noruega'),
    (51, 'Francia',          'Iraq'),
    (52, 'Noruega',          'Senegal'),
    (53, 'Noruega',          'Francia'),
    (54, 'Senegal',          'Iraq'),
    (55, 'Argentina',        'Algeria'),
    (56, 'Austria',          'Jordania'),
    (57, 'Argentina',        'Austria'),
    (58, 'Jordania',         'Algeria'),
    (59, 'Jordania',         'Argentina'),
    (60, 'Algeria',          'Austria'),
    (61, 'Uzbekistán',       'Colombia'),
    (62, 'Portugal',         'Congo DR'),
    (63, 'Colombia',         'Congo DR'),
    (64, 'Portugal',         'Uzbekistán'),
    (65, 'Colombia',         'Portugal'),
    (66, 'Congo DR',         'Uzbekistán'),
    (67, 'Inglaterra',       'Croacia'),
    (68, 'Ghana',            'Panamá'),
    (69, 'Inglaterra',       'Ghana'),
    (70, 'Panamá',           'Croacia'),
    (71, 'Croacia',          'Ghana'),
    (72, 'Panamá',           'Inglaterra'),
]

# Build lookup: (team1_es, team2_es) -> match_id
MATCH_LOOKUP = {(t1, t2): mid for mid, t1, t2 in MATCHES}


def strip_flag(name):
    return re.sub(r'[\U0001F1E0-\U0001F1FF\U0001F300-\U0001F9FF\U00002600-\U000027FF☀-⟿]+\s*', '', name).strip()


def supabase_request(method, path, payload=None, headers_extra=None):
    url = f"{SUPABASE_URL}{path}"
    data = json.dumps(payload).encode() if payload else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('apikey', ANON_KEY)
    req.add_header('Authorization', f'Bearer {ANON_KEY}')
    req.add_header('Content-Type', 'application/json')
    if headers_extra:
        for k, v in headers_extra.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            body = r.read().decode()
            return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def get_existing_results():
    status, body = supabase_request(
        'GET',
        "/rest/v1/polla_data?key=like.result:*&select=key,value"
    )
    if status != 200:
        print(f"  ERROR fetching existing results: HTTP {status}: {body}", file=sys.stderr)
        return set()
    rows = json.loads(body)
    return {row['value']['matchId'] for row in rows if isinstance(row.get('value'), dict)}


def upsert_result(match_id, score1, score2):
    payload = {
        "key": f"result:{match_id}",
        "value": {"matchId": match_id, "score1": score1, "score2": score2}
    }
    status, body = supabase_request(
        'POST',
        '/rest/v1/polla_data',
        payload,
        {'Prefer': 'resolution=merge-duplicates,return=minimal'}
    )
    return status in (200, 201, 204)


def main():
    now = datetime.now(timezone.utc)
    print(f"[{now.strftime('%Y-%m-%d %H:%M:%S')} UTC] Syncing results from ESPN...")

    req = urllib.request.Request(ESPN_URL)
    req.add_header('User-Agent', 'Mozilla/5.0')
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        print(f"  ERROR fetching ESPN: {e}", file=sys.stderr)
        sys.exit(1)

    events = data.get('events', [])
    print(f"  ESPN returned {len(events)} events")

    existing = get_existing_results()
    print(f"  Already in DB: {len(existing)} results")

    saved = 0
    for event in events:
        comp = event.get('competitions', [{}])[0]
        status_type = event.get('status', {}).get('type', {})

        if status_type.get('name') != 'STATUS_FULL_TIME':
            continue

        comps = comp.get('competitors', [])
        home = next((c for c in comps if c.get('homeAway') == 'home'), None)
        away = next((c for c in comps if c.get('homeAway') == 'away'), None)
        if not home or not away:
            continue

        home_en = home.get('team', {}).get('displayName', '')
        away_en = away.get('team', {}).get('displayName', '')
        home_es = ESPN_TO_ES.get(home_en)
        away_es = ESPN_TO_ES.get(away_en)

        if not home_es or not away_es:
            continue  # knockout placeholder or unmapped team

        match_id = MATCH_LOOKUP.get((home_es, away_es))
        if not match_id:
            continue  # not in our group stage list

        if match_id in existing:
            continue  # already saved

        score1 = int(home.get('score') or 0)
        score2 = int(away.get('score') or 0)

        ok = upsert_result(match_id, score1, score2)
        if ok:
            print(f"  ✅ Saved match {match_id}: {home_es} {score1}-{score2} {away_es}")
            saved += 1
        else:
            print(f"  ❌ Failed match {match_id}: {home_es} vs {away_es}", file=sys.stderr)

    print(f"  Done — {saved} new result(s) saved.")


if __name__ == '__main__':
    main()
